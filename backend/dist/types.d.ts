import { z } from 'zod';
export type Role = 'user' | 'assistant';
export interface ConversationMessage {
    role: Role;
    content: string;
    timestamp: number;
}
export declare const ChatRequestSchema: z.ZodObject<{
    message: z.ZodString;
    sessionId: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export type ChatRequest = z.infer<typeof ChatRequestSchema>;
export type IntentType = 'risk_query' | 'stats_analysis' | 'investigation' | 'strategy_simulation' | 'smalltalk';
export interface ParsedIntent {
    type: IntentType;
    context?: Record<string, unknown>;
}
export interface ModuleInput {
    input: string;
    sessionId: string;
    context?: Record<string, unknown> | undefined;
}
export interface ChatResponse {
    sessionId: string;
    intent: IntentType;
    output: {
        text: string;
        structured: unknown;
    };
}
export interface RiskReportBasicInfo {
    region: string;
    operator: string;
    serviceType: string;
}
export interface RiskReport {
    basic: RiskReportBasicInfo;
    fraudTypes: Array<{
        type: string;
        score: number;
        confidence: number;
    }>;
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
    labels: string[];
    recommendations: string[];
}
export interface TimeSeriesPoint {
    timestamp: string;
    value: number;
}
export interface StatsResult {
    summary: string;
    tables?: Record<string, unknown>[];
    charts?: Array<{
        type: 'line' | 'bar' | 'pie';
        series: Array<{
            name: string;
            points: TimeSeriesPoint[];
        }>;
    }>;
}
//# sourceMappingURL=types.d.ts.map