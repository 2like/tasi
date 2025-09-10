export declare const mockRiskByIdentifier: Record<string, any>;
export declare const mockInvestigationByIdentifier: Record<string, any>;
export declare function generateLast30DaysSeries(label?: string): {
    timestamp: string;
    value: number;
}[];
export declare const mockStats: {
    summary: string;
    charts: {
        type: "line";
        series: {
            name: string;
            points: {
                timestamp: string;
                value: number;
            }[];
        }[];
    }[];
    tables: {
        region: string;
        topFraud: string;
        cases: number;
    }[];
};
export declare function mockStrategyForPrefix(prefix: string): {
    blockRate: number;
    falsePositiveRate: number;
    hourly: {
        hour: number;
        effect: number;
    }[];
};
//# sourceMappingURL=data.d.ts.map