"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const uuid_1 = require("uuid");
const auth_1 = require("./middleware/auth");
const types_1 = require("./types");
const nlu_1 = require("./nlu");
const risk_1 = require("./modules/risk");
const stats_1 = require("./modules/stats");
const investigation_1 = require("./modules/investigation");
const strategy_1 = require("./modules/strategy");
const app = (0, express_1.default)();
const port = Number(process.env.PORT || 3001);
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)());
app.use(express_1.default.json({ limit: '1mb' }));
app.use((0, morgan_1.default)('dev'));
// Simple in-memory session store: sessionId -> messages
const sessionStore = new Map();
const lastIdentifierBySession = new Map();
const MAX_TURNS = 10;
app.get('/health', (_req, res) => {
    res.json({ status: 'ok', uptime: process.uptime() });
});
app.post('/api/chat', auth_1.authMiddleware, async (req, res, next) => {
    const start = Date.now();
    try {
        const parsed = types_1.ChatRequestSchema.safeParse(req.body);
        if (!parsed.success) {
            res.status(400).json({ error: 'Invalid request', details: parsed.error.flatten() });
            return;
        }
        const body = parsed.data;
        let sessionId = body.sessionId || (0, uuid_1.v4)();
        if (!sessionStore.has(sessionId)) {
            sessionStore.set(sessionId, []);
        }
        const history = sessionStore.get(sessionId);
        history.push({ role: 'user', content: body.message, timestamp: Date.now() });
        while (history.length > MAX_TURNS * 2) {
            history.shift();
        }
        const intent = (0, nlu_1.parseIntent)(body.message, history);
        let response;
        switch (intent.type) {
            case 'risk_query': {
                if (intent.context && typeof intent.context['identifier'] === 'string') {
                    lastIdentifierBySession.set(sessionId, String(intent.context['identifier']));
                }
                const identifier = (intent.context && intent.context['identifier']) || lastIdentifierBySession.get(sessionId);
                response = await (0, risk_1.handleRiskQuery)({ input: identifier ? identifier : body.message, sessionId, context: intent.context });
                break;
            }
            case 'stats_analysis': {
                response = await (0, stats_1.handleStatsAnalysis)({ input: body.message, sessionId, context: intent.context });
                break;
            }
            case 'investigation': {
                const identifier = lastIdentifierBySession.get(sessionId);
                const combined = identifier ? `${identifier} ${body.message}` : body.message;
                response = await (0, investigation_1.handleInvestigation)({ input: combined, sessionId, context: intent.context });
                break;
            }
            case 'strategy_simulation': {
                const identifier = (intent.context && intent.context['prefix']) || lastIdentifierBySession.get(sessionId);
                const combined = identifier ? `${identifier} ${body.message}` : body.message;
                response = await (0, strategy_1.handleStrategySimulation)({ input: combined, sessionId, context: intent.context });
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
    }
    catch (err) {
        next(err);
    }
});
// Centralized error handler
app.use((err, _req, res, _next) => {
    // eslint-disable-next-line no-console
    console.error('Unhandled error', err);
    res.status(500).json({ error: 'Internal Server Error' });
});
app.listen(port, () => {
    // eslint-disable-next-line no-console
    console.log(`Backend listening on http://localhost:${port}`);
});
//# sourceMappingURL=index.js.map