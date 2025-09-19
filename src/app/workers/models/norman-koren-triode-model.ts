import { ipk } from './ipk';
import { TriodeModelResult } from './triode-model-result';

// normanKorenTriodeModel
export const normanKorenTriodeModel = function (ep: number, eg: number, kp: number, mu: number, kvb: number, ex: number, kg1: number): TriodeModelResult {
    // ip
    const ip = (1000 * ipk(eg, ep, kp, mu, kvb, ex)) / kg1;
    // return current
    return {
        ip: ip,
    };
};
