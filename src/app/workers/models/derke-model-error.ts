import { derkEModel } from './derke-model';
import { File } from '../../files';

// derkEModelError, sum of squared errors (SSE) and root mean square error (RMS)
export const derkEModelError = function (files: File[], kp: number, mu: number, kvb: number, ex: number, kg1: number, kg2: number, a: number, alphaS: number, beta: number, secondaryEmission: boolean, s: number, alphaP: number, lambda: number, v: number, w: number, maximumPlateDissipation: number): {sse: number, rmse: number} {
    // result
    let error = 0;
    let count = 0;
    // loop data files
    for (const file of files) {
        // loop series
        for (const series of file.series) {
            // loop points
            for (const point of series.points) {
                // check we can use this point in calculations
                if (point.ep * point.ip * 1e-3 <= maximumPlateDissipation) {
                    // calculate currents
                    const c = derkEModel(point.ep, point.eg + file.egOffset, point.es || 0, kp, mu, kvb, ex, kg1, kg2, a, alphaS, beta, secondaryEmission, s, alphaP, lambda, v, w);
                    // residuals
                    const ipr = c.ip - point.ip;
                    const isr = c.is - (point.is ?? 0);
                    // least squares
                    error += ipr * ipr + isr * isr;
                    count++;
                }
            }
        }
    }
    // return large number in case paramaters are not allowed (Infinite, NaN)
    return isFinite(error) ? {sse: error, rmse: Math.sqrt(error / count)} : {sse: Number.MAX_VALUE / 2, rmse: Number.MAX_VALUE / 2};
};
