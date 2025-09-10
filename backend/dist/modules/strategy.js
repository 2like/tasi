"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleStrategySimulation = handleStrategySimulation;
const mock_1 = require("../mock");
const extract_1 = require("../utils/extract");
async function handleStrategySimulation(input) {
    const prefix = (0, extract_1.extractPrefixFromText)(input.input) || '+86***';
    const { blockRate, falsePositiveRate, hourly } = (0, mock_1.getMockStrategy)(prefix);
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
//# sourceMappingURL=strategy.js.map