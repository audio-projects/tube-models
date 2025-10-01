// Koren current (4.1)
export const ipk = function (eg: number, es: number, kp: number, mu: number, kvb: number, ex: number): number {
    // e1
    const e1 = (es * Math.log(1.0 + Math.exp(kp * (1 / mu + eg / Math.sqrt(kvb + es * es))))) / kp;
    // IPk
    return e1 > 0 ? Math.pow(e1, ex) : 0;
};
