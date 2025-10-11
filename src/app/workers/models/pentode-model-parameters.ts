export interface PentodeModelParameters {
    mu?: number;
    ex?: number;
    kg1?: number;
    kg2?: number;
    kp?: number;
    kvb?: number;
    calculatedOn?: string; // ISO-8601 datetime string with timezone
    // root mean square error
    rmse?: number;
}
