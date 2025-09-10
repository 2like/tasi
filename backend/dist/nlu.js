"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseIntent = parseIntent;
// Very lightweight keyword-based intent detection for MVP
function parseIntent(message, _history) {
    const text = message.toLowerCase();
    const contains = (arr) => arr.some((k) => text.includes(k));
    if (contains(['风险', '查询', '号码', 'account', 'msisdn', 'phone']) ||
        /\+?\d{8,15}/.test(message)) {
        return { type: 'risk_query' };
    }
    if (contains(['统计', '趋势', '上月', '同比', '环比', '分布'])) {
        return { type: 'stats_analysis' };
    }
    if (contains(['是否接通', '接通', '平均时长', '前10', '路由', '历史风险'])) {
        return { type: 'investigation' };
    }
    if (contains(['策略', '拦截', '号段', '误伤率', '阻断率'])) {
        return { type: 'strategy_simulation' };
    }
    return { type: 'smalltalk' };
}
//# sourceMappingURL=nlu.js.map