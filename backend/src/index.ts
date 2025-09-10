import dotenv from 'dotenv';
dotenv.config();

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { v4 as uuidv4 } from 'uuid';
import { authMiddleware } from './middleware/auth';
import { ChatRequestSchema, ChatResponse, ChatRequest, ConversationMessage } from './types';
import { parseIntent } from './nlu';
import { handleRiskQuery } from './modules/risk';
import { handleStatsAnalysis } from './modules/stats';
import { handleInvestigation } from './modules/investigation';
import { handleStrategySimulation } from './modules/strategy';

const app = express();
const port = Number(process.env.PORT || 3001);

app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '1mb' }));
app.use(morgan('dev'));

// Simple in-memory session store: sessionId -> messages
const sessionStore: Map<string, ConversationMessage[]> = new Map();
const lastIdentifierBySession: Map<string, string> = new Map();
const MAX_TURNS = 10;

app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});

app.post('/api/chat', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  try {
    const parsed = ChatRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Invalid request', details: parsed.error.flatten() });
      return;
    }
    const body: ChatRequest = parsed.data;

    let sessionId = body.sessionId || uuidv4();
    if (!sessionStore.has(sessionId)) {
      sessionStore.set(sessionId, []);
    }

    const history = sessionStore.get(sessionId)!;
    history.push({ role: 'user', content: body.message, timestamp: Date.now() });
    while (history.length > MAX_TURNS * 2) {
      history.shift();
    }

    const intent = parseIntent(body.message, history);

    let response: ChatResponse;
    switch (intent.type) {
      case 'risk_query': {
        if (intent.context && typeof intent.context['identifier'] === 'string') {
          lastIdentifierBySession.set(sessionId, String(intent.context['identifier']));
        }
        const identifier = (intent.context && (intent.context['identifier'] as string)) || lastIdentifierBySession.get(sessionId);
        response = await handleRiskQuery({ input: identifier ? identifier : body.message, sessionId, context: intent.context });
        break;
      }
      case 'stats_analysis': {
        response = await handleStatsAnalysis({ input: body.message, sessionId, context: intent.context });
        break;
      }
      case 'investigation': {
        const identifier = lastIdentifierBySession.get(sessionId);
        const combined = identifier ? `${identifier} ${body.message}` : body.message;
        response = await handleInvestigation({ input: combined, sessionId, context: intent.context });
        break;
      }
      case 'strategy_simulation': {
        const identifier = (intent.context && (intent.context['prefix'] as string)) || lastIdentifierBySession.get(sessionId);
        const combined = identifier ? `${identifier} ${body.message}` : body.message;
        response = await handleStrategySimulation({ input: combined, sessionId, context: intent.context });
        break;
      }
      default: {
        response = {
          sessionId,
          intent: intent.type,
          output: {
            text: '我可以帮助进行号码风险查询、统计分析、调查细化与策略模拟。请描述你的需求，例如：查询号码 +8613800138000 的风险。',
            structured: null,
          },
        };
      }
    }

    history.push({ role: 'assistant', content: response.output.text, timestamp: Date.now() });
    while (history.length > MAX_TURNS * 2) {
      history.shift();
    }

    const latencyMs = Date.now() - start;
    res.json({ ...response, latencyMs });
  } catch (err) {
    next(err);
  }
});

// Centralized error handler
app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  // eslint-disable-next-line no-console
  console.error('Unhandled error', err);
  res.status(500).json({ error: 'Internal Server Error' });
});

app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`Backend listening on http://localhost:${port}`);
});

