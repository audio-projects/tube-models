import { File } from '../../files';
import { normanKorenNewPentodeModel } from './norman-koren-new-pentode-model';

// normanKorenNewPentodeModelError
export const normanKorenNewPentodeModelError = function (files: File[], mu: number, kp: number, kvb: number, ex: number, kg1: number, kg2: number, maximumPlateDissipation: number) {
    // result
    let r = 0;
    // loop data files
    for (const file of files) {
        // check measurement type is supported by model
        if (['IP_EP_EG_VS_VH', 'IP_EG_EP_VS_VH', 'IP_EP_ES_VG_VH', 'IP_ES_EG_VA_VH', 'IP_EG_EPES_VH', 'IP_EG_EPES_VH'].indexOf(file.measurementType) !== -1) {
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
                        r += ipr * ipr + isr * isr;
                    }
                }
            }
        }
    }
    // return large number in case paramaters are not allowed (Infinite, NaN)
    return isFinite(r) ? r : Number.MAX_VALUE / 2;
};
