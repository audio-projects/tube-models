import { ipk } from './ipk';
import { PentodeModelResult } from './pentode-model-result';
import { tanh } from 'mathjs';

// derkEModel
export const derkEModel = function (ep: number, eg: number, es: number, kp: number, mu: number, kvb: number, ex: number, kg1: number, kg2: number, a: number, alphaS: number, beta: number, secondaryEmission: boolean, s: number, alphaP: number, lambda: number, v: number, w: number): PentodeModelResult {
    // IPk
    const i = ipk(eg, es, kp, mu, kvb, ex);
    // secondary emission
    const se = secondaryEmission ? s * ep * (1 + tanh(-alphaP * (ep - (es / lambda - v * eg - w)))) : 0;
    // alpha, not a fitting parameter
    const alpha = 1 - (kg1 * (1 + alphaS)) / kg2;
    // ip
    const ip = 1000 * i * (1 / kg1 - 1 / kg2 + (a * ep) / kg1 - se / kg2 - Math.exp(-beta * ep * Math.sqrt(Math.abs(beta * ep))) * (alpha / kg1 + alphaS / kg2));
    // is
    const is = (1000 * i * (1 + alphaS * Math.exp(-beta * ep * Math.sqrt(Math.abs(beta * ep))) + se)) / kg2;
    // return currents
    return {
        ip: ip,
        is: is,
    };
};
