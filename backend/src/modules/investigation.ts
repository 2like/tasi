import { ChatResponse, ModuleInput } from '../types';
import { getMockInvestigation } from '../mock';
import { extractIdentifierFromText } from '../utils/extract';

export async function handleInvestigation(input: ModuleInput): Promise<ChatResponse> {
  const lower = input.input.toLowerCase();
  const identifier = extractIdentifierFromText(input.input) || '+8613800138000';
  const mock = getMockInvestigation(identifier);
  if (lower.includes('是否接通') || lower.includes('接通')) {
    const text = `过去24小时接通率为 ${(mock.connectedRate * 100).toFixed(1)}%，平均振铃 12 秒。`;
    return { sessionId: input.sessionId, intent: 'investigation', output: { text, structured: { answer: 'connected_rate', value: mock.connectedRate } } };
  }
  if (lower.includes('平均时长')) {
    const text = `平均通话时长 ${mock.avgDurationSeconds.toString().padStart(2, '0')} 秒，长尾通话主要发生在 23:00-01:00。`;
    return { sessionId: input.sessionId, intent: 'investigation', output: { text, structured: { answer: 'avg_duration', seconds: mock.avgDurationSeconds } } };
  }
  if (lower.includes('前10') || lower.includes('top10')) {
    const numbers = mock.topConnected as string[];
    const text = `前10个接通号码：${numbers.join(', ')}`;
    return { sessionId: input.sessionId, intent: 'investigation', output: { text, structured: { answer: 'top_connected', numbers } } };
  }
  if (lower.includes('路由')) {
    const path = mock.routing as string[];
    const text = `示例呼叫路由链条：${path.join(' -> ')}`;
    return { sessionId: input.sessionId, intent: 'investigation', output: { text, structured: { answer: 'routing', path } } };
  }
  if (lower.includes('历史风险')) {
    const records = mock.history as Array<{ date: string; type: string; score: number }>;
    const text = `历史风险记录包含 ${records.length} 次高风险事件。`;
    return { sessionId: input.sessionId, intent: 'investigation', output: { text, structured: { answer: 'history', records } } };
  }

  const text = '可回答：接通率、平均时长、TOP10接通号码、路由链条与历史风险记录。';
  return { sessionId: input.sessionId, intent: 'investigation', output: { text, structured: null } };
}

