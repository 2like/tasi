import { ChatResponse, ModuleInput } from '../types';

export async function handleInvestigation(input: ModuleInput): Promise<ChatResponse> {
  const lower = input.input.toLowerCase();
  if (lower.includes('是否接通') || lower.includes('接通')) {
    const text = '过去24小时接通率为 37.5%，平均振铃 12 秒。';
    return { sessionId: input.sessionId, intent: 'investigation', output: { text, structured: { answer: 'connected_rate', value: 0.375 } } };
  }
  if (lower.includes('平均时长')) {
    const text = '平均通话时长 00:42，长尾通话主要发生在 23:00-01:00。';
    return { sessionId: input.sessionId, intent: 'investigation', output: { text, structured: { answer: 'avg_duration', seconds: 42 } } };
  }
  if (lower.includes('前10') || lower.includes('top10')) {
    const numbers = Array.from({ length: 10 }).map((_, i) => `+86138001${(300 + i).toString().padStart(3, '0')}`);
    const text = `前10个接通号码：${numbers.join(', ')}`;
    return { sessionId: input.sessionId, intent: 'investigation', output: { text, structured: { answer: 'top_connected', numbers } } };
  }
  if (lower.includes('路由')) {
    const path = ['Originating: CN-Mobile', 'Transit: HK-CarrierX', 'International Gateway', 'Terminating: US-VoIP'];
    const text = `示例呼叫路由链条：${path.join(' -> ')}`;
    return { sessionId: input.sessionId, intent: 'investigation', output: { text, structured: { answer: 'routing', path } } };
  }
  if (lower.includes('历史风险')) {
    const records = [
      { date: '2025-08-21', type: 'Wangiri', score: 0.78 },
      { date: '2025-07-03', type: 'IRSF', score: 0.65 },
    ];
    const text = '历史风险记录包含 2025-08-21（Wangiri）与 2025-07-03（IRSF）两次高风险事件。';
    return { sessionId: input.sessionId, intent: 'investigation', output: { text, structured: { answer: 'history', records } } };
  }

  const text = '可回答：接通率、平均时长、TOP10接通号码、路由链条与历史风险记录。';
  return { sessionId: input.sessionId, intent: 'investigation', output: { text, structured: null } };
}

