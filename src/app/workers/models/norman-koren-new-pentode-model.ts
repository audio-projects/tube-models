import { ipk } from './ipk';
import { PentodeModelResult } from './pentode-model-result';

export const normanKorenNewPentodeModel = function (ep: number, eg: number, es: number, kp: number, mu: number, kvb: number, ex: number, kg1: number, kg2: number): PentodeModelResult {
    // IPk
    const i = ipk(eg, es, kp, mu, kvb, ex);
    // ip
    const ip = (1000 * i * Math.atan(ep / kvb)) / kg1;
    // is
    const is = (1000 * i) / kg2;
    // return currents
    return {
        ip: ip,
        is: is,
    };
};
