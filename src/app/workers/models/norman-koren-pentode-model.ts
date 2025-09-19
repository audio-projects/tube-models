import { PentodeModelResult } from './pentode-model-result';

// normanKorenPentodeModel
export const normanKorenPentodeModel = function (ep: number, eg: number, es: number, kp: number, mu: number, kvb: number, ex: number, kg1: number, kg2: number): PentodeModelResult {
    // e1
    const e1 = (es * Math.log(1.0 + Math.exp(kp * (1 / mu + eg / es)))) / kp;
    // ip
    const ip = e1 >= 0 ? (1000 * Math.pow(e1, ex) * Math.atan(ep / kvb)) / kg1 : 0;
    // c
    const c = eg + es / mu;
    // is
    const is = c > 0 ? (1000 * Math.pow(c, ex)) / kg2 : 0;
    // return currents
    return {
        ip: ip,
        is: is,
    };
};
