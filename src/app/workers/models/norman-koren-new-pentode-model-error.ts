import { File } from '../../files';
import { normanKorenNewPentodeModel } from './norman-koren-new-pentode-model';

// normanKorenNewPentodeModelError, sum of squared errors (SSE) and root mean square error (RMS)
export const normanKorenNewPentodeModelError = function (files: File[], kp: number, mu: number, kvb: number, ex: number, kg1: number, kg2: number, maximumPlateDissipation: number): {sse: number, rmse: number} {
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
                    const c = normanKorenNewPentodeModel(point.ep, point.eg + file.egOffset, point.es ?? 0, kp, mu, kvb, ex, kg1, kg2);
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
