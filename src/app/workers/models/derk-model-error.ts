import { derkModel } from './derk-model';
import { File } from '../../files';

// derkModelError
export const derkModelError = function (files: File[], kp: number, mu: number, kvb: number, ex: number, kg1: number, kg2: number, a: number, alpha: number, alphaS: number, beta: number, secondaryEmission: boolean, s: number, alphaP: number, lambda: number, v: number, w: number, maximumPlateDissipation: number) {
    // result
    let r = 0;
    // loop data files
    for (const file of files) {
        // check measurement type is supported by model
        if (file.measurementType !== 'IP_VA_VG_VH' && file.measurementType !== 'IP_VG_VA_VH' && file.measurementType !== 'IPIS_VG_VAVS_VH' && file.measurementType !== 'IPIS_VAVS_VG_VH') {
            // loop series
            for (const series of file.series) {
                // loop points
                for (const point of series.points) {
                    // check we can use this point in calculations
                    if (point.ep * point.ip * 1e-3 <= maximumPlateDissipation) {
                        // calculate currents
                        const c = derkModel(point.ep, point.eg + file.egOffset, point.es ?? 0, kp, mu, kvb, ex, kg1, kg2, a, alpha, alphaS, beta, secondaryEmission, s, alphaP, lambda, v, w);
                        // residuals
                        const ipr = c.ip - point.ip;
                        const isr = c.is - (point.is ?? 0);
                        // least squares
                        r += ipr * ipr + isr * isr;
                    }
                }
            }
        }
    }
    // return large number in case paramaters are not allowed (Infinite, NaN)
    return isFinite(r) ? r : Number.MAX_VALUE / 2;
};
