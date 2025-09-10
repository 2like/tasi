import { ChatResponse, ModuleInput, RiskReport } from '../types';
import { getMockRisk } from '../mock';
import { extractIdentifierFromText } from '../utils/extract';

export async function handleRiskQuery(input: ModuleInput): Promise<ChatResponse> {
  const identifier = extractIdentifierFromText(input.input) || '未知标识';
  const report = getMockRisk(identifier) as RiskReport;

  const text = `已生成风险研判报告：标识 ${identifier}，总体风险等级为 ${report.riskLevel}。主要风险类型：${report.fraudTypes.map((f) => f.type).join('、')}。`;

  return {
    sessionId: input.sessionId,
    intent: 'risk_query',
    output: {
      text,
      structured: { identifier, report },
    },
  };
}

