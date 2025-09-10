export const mockRiskByIdentifier: Record<string, any> = {
  '+8613800138000': {
    basic: { region: 'CN-北京', operator: 'China Mobile', serviceType: 'Mobile' },
    fraudTypes: [
      { type: 'Wangiri', score: 0.82, confidence: 0.88 },
      { type: 'Caller ID Spoofing', score: 0.39, confidence: 0.64 },
    ],
    riskLevel: 'high',
    labels: ['短时多次呼叫', '国际回拨', '异常夜间活跃'],
    recommendations: [
      '启用国际来电标记与回拨拦截',
      '开启外呼白名单策略',
      '24小时临时阻断并复核',
    ],
  },
  '+85251234567': {
    basic: { region: 'HK', operator: 'CarrierX', serviceType: 'Mobile' },
    fraudTypes: [
      { type: 'IRSF', score: 0.61, confidence: 0.72 },
      { type: 'Subscription Fraud', score: 0.33, confidence: 0.55 },
    ],
    riskLevel: 'medium',
    labels: ['高成本目的地', '异常套餐切换'],
    recommendations: ['启用高资费目的地阈值控制', '运营商侧资费告警联动'],
  },
};

export const mockInvestigationByIdentifier: Record<string, any> = {
  '+8613800138000': {
    connectedRate: 0.31,
    avgDurationSeconds: 36,
    topConnected: ['+81345670012', '+61412345678', '+12025551234', '+447911123456', '+85251234567', '+886912345678', '+60123456789', '+628123456789', '+81345670034', '+4915212345678'],
    routing: ['Originating: CN-Mobile', 'Transit: HK-CarrierX', 'International Gateway', 'Terminating: JP-NTT'],
    history: [
      { date: '2025-08-21', type: 'Wangiri', score: 0.82 },
      { date: '2025-06-19', type: 'Caller ID Spoofing', score: 0.58 },
    ],
  },
};

export function generateLast30DaysSeries(label = '诈骗告警数') {
  const now = new Date();
  return Array.from({ length: 30 }).map((_, i) => {
    const d = new Date(now);
    d.setDate(now.getDate() - (29 - i));
    return { timestamp: d.toISOString().slice(0, 10), value: Math.round(60 + 25 * Math.sin(i / 4)) };
  });
}

export const mockStats = {
  summary: '上月电信诈骗总体下降约 6%，夜间（22:00-02:00）Wangiri 活跃度较高，节假日前后存在脉冲。',
  charts: [
    {
      type: 'line' as const,
      series: [{ name: '诈骗告警数', points: generateLast30DaysSeries() }],
    },
  ],
  tables: [
    { region: '广东', topFraud: 'Wangiri', cases: 1320 },
    { region: '浙江', topFraud: 'Smishing', cases: 902 },
    { region: '江苏', topFraud: 'Subscription Fraud', cases: 644 },
  ],
};

export function mockStrategyForPrefix(prefix: string) {
  const normalized = prefix.replace(/[^\d+]/g, '');
  const seed = normalized.length;
  const blockRate = 0.6 + (seed % 4) * 0.08; // 0.6 ~ 0.84
  const falsePositiveRate = 0.02 + ((seed + 1) % 3) * 0.015; // 0.02 ~ 0.05
  const hourly = Array.from({ length: 24 }).map((_, h) => ({ hour: h, effect: Number((0.4 + 0.5 * Math.sin((h + seed) / 3)).toFixed(2)) }));
  return { blockRate, falsePositiveRate, hourly };
}

