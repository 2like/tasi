import { ChatResponse, ModuleInput, StatsResult } from '../types';

export async function handleStatsAnalysis(input: ModuleInput): Promise<ChatResponse> {
  const now = new Date();
  const points = Array.from({ length: 30 }).map((_, i) => {
    const d = new Date(now);
    d.setDate(now.getDate() - (29 - i));
    return { timestamp: d.toISOString().slice(0, 10), value: Math.round(50 + 30 * Math.sin(i / 5)) };
  });

  const result: StatsResult = {
    summary: '上月电信诈骗总体下降约 8%，夜间（22:00-02:00）Wangiri 活跃度较高。',
    charts: [
      {
        type: 'line',
        series: [
          { name: '诈骗告警数', points: points.map((p) => ({ timestamp: p.timestamp, value: p.value })) },
        ],
      },
    ],
    tables: [
      { region: '广东', topFraud: 'Wangiri', cases: 1234 },
      { region: '浙江', topFraud: 'Smishing', cases: 845 },
      { region: '江苏', topFraud: 'Subscription Fraud', cases: 612 },
    ],
  };

  const text = '统计结果已生成：上月总体下降约8%。夜间高风险，重点关注广东、浙江、江苏三地。可查看折线图与地区表格。';

  return {
    sessionId: input.sessionId,
    intent: 'stats_analysis',
    output: { text, structured: result },
  };
}

