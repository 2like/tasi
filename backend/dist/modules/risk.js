"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleRiskQuery = handleRiskQuery;
const mock_1 = require("../mock");
const extract_1 = require("../utils/extract");
async function handleRiskQuery(input) {
    const identifier = (0, extract_1.extractIdentifierFromText)(input.input) || '未知标识';
    const report = (0, mock_1.getMockRisk)(identifier);
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
//# sourceMappingURL=risk.js.map