"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleStatsAnalysis = handleStatsAnalysis;
const mock_1 = require("../mock");
async function handleStatsAnalysis(input) {
    const result = (0, mock_1.getMockStats)();
    const text = '统计结果已生成：请查看折线图与地区表格。';
    return {
        sessionId: input.sessionId,
        intent: 'stats_analysis',
        output: { text, structured: result },
    };
}
//# sourceMappingURL=stats.js.map