import { File } from '../../files';
import { normanKorenTriodeModel } from './norman-koren-triode-model';

// normanKorenTriodeModelError
export const normanKorenTriodeModelError = function (files: File[], mu: number, ex: number, kg1: number, kp: number, kvb: number, maximumPlateDissipation: number) {
    // result
    let r = 0;
    // loop data files
    for (const file of files) {
        // check measurement type is supported by model
        if (['IP_EP_EG_VH', 'IP_EG_EP_VH', 'IPIS_EG_EPES_VH', 'IPIS_EPES_EG_VH'].indexOf(file.measurementType) !== -1) {
            // loop series
            for (const series of file.series) {
                // loop points
                for (const point of series.points) {
                    // check we can use this point in calculations (max power dissipation and different than zero)
                    if (point.ip + (point.is ?? 0) > 0 && point.ep * (point.ip + (point.is ?? 0)) * 1e-3 <= maximumPlateDissipation) {
                        // calculate currents
                        const currents = normanKorenTriodeModel(point.ep, point.eg + file.egOffset, kp, mu, kvb, ex, kg1);
                        // least squares
                        r += (currents.ip - point.ip - (point.is ?? 0)) * (currents.ip - point.ip - (point.is ?? 0));
                    }
                }
            }
        }
    }
    // return large number in case paramaters are not allowed (Infinite, NaN)
    return isFinite(r) ? r : Number.MAX_VALUE / 2;
};
