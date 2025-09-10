"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMockRisk = getMockRisk;
exports.getMockInvestigation = getMockInvestigation;
exports.getMockStats = getMockStats;
exports.getMockStrategy = getMockStrategy;
const data_1 = require("./data");
function getMockRisk(identifier) {
    return data_1.mockRiskByIdentifier[identifier] || {
        basic: { region: 'CN-未知', operator: 'Unknown', serviceType: 'Unknown' },
        fraudTypes: [
            { type: 'Wangiri', score: 0.42, confidence: 0.6 },
            { type: 'Smishing', score: 0.22, confidence: 0.4 },
        ],
        riskLevel: 'medium',
        labels: ['近期低频呼叫'],
        recommendations: ['启用基本标记与提醒', '持续观察 48 小时'],
    };
}
function getMockInvestigation(identifier) {
    return (data_1.mockInvestigationByIdentifier[identifier] || {
        connectedRate: 0.37,
        avgDurationSeconds: 42,
        topConnected: ['+12025551234', '+81345670012', '+447911123456', '+85251234567', '+61412345678', '+81345670034', '+4915212345678', '+886912345678', '+628123456789', '+60123456789'],
        routing: ['Originating: CN-Unknown', 'International Gateway', 'Terminating: US-VoIP'],
        history: [
            { date: '2025-07-03', type: 'IRSF', score: 0.65 },
        ],
    });
}
function getMockStats() {
    return data_1.mockStats;
}
function getMockStrategy(prefix) {
    return (0, data_1.mockStrategyForPrefix)(prefix);
}
//# sourceMappingURL=index.js.map