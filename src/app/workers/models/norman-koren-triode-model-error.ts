import { File } from '../../files';
import { normanKorenTriodeModel } from './norman-koren-triode-model';

// normanKorenTriodeModelError
export const normanKorenTriodeModelError = function (files: File[], kp: number, mu: number, kvb: number, ex: number, kg1: number, maximumPlateDissipation: number) {
    // result
    let r = 0;
    // loop data files
    for (const file of files) {
        // check measurement type is supported by model
        if (file.measurementType === 'IP_VA_VG_VH' || file.measurementType === 'IP_VG_VA_VH' || file.measurementType === 'IPIS_VG_VAVS_VH' || file.measurementType === 'IPIS_VAVS_VG_VH') {
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
