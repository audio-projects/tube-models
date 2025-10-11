import { File } from '../../files';
import { normanKorenTriodeModel } from './norman-koren-triode-model';

// normanKorenTriodeModelError, sum of squared errors (SSE) and root mean square error (RMS)
export const normanKorenTriodeModelError = function (files: File[], kp: number, mu: number, kvb: number, ex: number, kg1: number, maximumPlateDissipation: number): {sse: number, rmse: number} {
    // result
    let error = 0;
    let count = 0;
    // loop data files
    for (const file of files) {
        // loop series
        for (const series of file.series) {
            // loop points
            for (const point of series.points) {
                // check we can use this point in calculations (max power dissipation and different than zero)
                if (point.ip + (point.is ?? 0) > 0 && point.ep * point.ip * 1e-3 <= maximumPlateDissipation) {
                    // calculate currents
                    const currents = normanKorenTriodeModel(point.ep, point.eg + file.egOffset, kp, mu, kvb, ex, kg1);
                    // error
                    error += (currents.ip - point.ip - (point.is ?? 0)) * (currents.ip - point.ip - (point.is ?? 0));
                    count++;
                }
            }
        }
    }
    // return large number in case paramaters are not allowed (Infinite, NaN)
    return isFinite(error) ? {sse: error, rmse: Math.sqrt(error / count)} : {sse: Number.MAX_VALUE / 2, rmse: Number.MAX_VALUE / 2};
};
