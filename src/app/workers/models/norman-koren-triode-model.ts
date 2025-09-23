import { TriodeModelResult } from './triode-model-result';

// normanKorenTriodeModel (3.1)
export const normanKorenTriodeModel = function (ep: number, eg: number, kp: number, mu: number, kvb: number, ex: number, kg1: number): TriodeModelResult {
    // e1
    const e1 = (ep * Math.log(1.0 + Math.exp(kp * (1 / mu + eg / Math.sqrt(kvb + ep * ep))))) / kp;
    // return current
    return {
        ip: e1 > 0 ? (1000 * Math.pow(e1, ex)) / kg1 : 0
    };
};
