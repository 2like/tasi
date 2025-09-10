import { ChatResponse, ModuleInput, StatsResult } from '../types';
import { getMockStats } from '../mock';

export async function handleStatsAnalysis(input: ModuleInput): Promise<ChatResponse> {
  const result: StatsResult = getMockStats();
  const text = '统计结果已生成：请查看折线图与地区表格。';

  return {
    sessionId: input.sessionId,
    intent: 'stats_analysis',
    output: { text, structured: result },
  };
}

