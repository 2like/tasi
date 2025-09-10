"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleRiskQuery = handleRiskQuery;
async function handleRiskQuery(input) {
    const numberMatch = input.input.match(/\+?\d{8,15}/);
    const identifier = numberMatch ? numberMatch[0] : '未知标识';
    // Stubbed risk report; replace with real detection API integration
    const report = {
        basic: {
            region: 'CN-北京',
            operator: 'China Mobile',
            serviceType: 'Mobile',
        },
        fraudTypes: [
            { type: 'Wangiri', score: 0.72, confidence: 0.81 },
            { type: 'Caller ID Spoofing', score: 0.41, confidence: 0.66 },
        ],
        riskLevel: 'medium',
        labels: ['短时多次呼叫', '跨境呼叫', '异常时段活跃'],
        recommendations: [
            '建议启用被叫振铃限制与二次确认',
            '若为企业号，开启国际来电标记与外呼白名单',
            '持续监控48小时，若分值上升至>0.8则临时阻断',
        ],
    };
    const text = `已生成风险研判报告：标识 ${identifier}，总体风险等级为中等（medium）。主要风险类型：Wangiri、Caller ID 伪装。建议：开启外呼白名单、限制异常时段来电，并持续监控。`;
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