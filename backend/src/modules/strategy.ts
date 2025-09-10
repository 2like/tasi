import { ChatResponse, ModuleInput } from '../types';

export async function handleStrategySimulation(input: ModuleInput): Promise<ChatResponse> {
  const match = input.input.match(/(\+?\d{3,5})/);
  const prefix = match ? match[1] : '+86***';

  // Mocked metrics
  const blockRate = 0.72; // 阻断率
  const falsePositiveRate = 0.04; // 误伤率
  const hourly = Array.from({ length: 24 }).map((_, h) => ({ hour: h, effect: Number((0.4 + 0.6 * Math.sin(h / 3)).toFixed(2)) }));

  const bestHours = hourly
    .map((x) => ({ hour: x.hour, score: x.effect }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map((x) => `${x.hour}:00-${x.hour + 1}:00`);

  const text = `策略模拟完成：拦截号段 ${prefix} 可实现约 ${(blockRate * 100).toFixed(1)}% 阻断率，误伤率 ${(falsePositiveRate * 100).toFixed(1)}%。推荐在 ${bestHours.join('、')} 执行强化拦截。`;

  return {
    sessionId: input.sessionId,
    intent: 'strategy_simulation',
    output: { text, structured: { prefix, blockRate, falsePositiveRate, hourly } },
  };
}

