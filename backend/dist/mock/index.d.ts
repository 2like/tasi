export declare function getMockRisk(identifier: string): any;
export declare function getMockInvestigation(identifier: string): any;
export declare function getMockStats(): {
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
export declare function getMockStrategy(prefix: string): {
    blockRate: number;
    falsePositiveRate: number;
    hourly: {
        hour: number;
        effect: number;
    }[];
};
//# sourceMappingURL=index.d.ts.map