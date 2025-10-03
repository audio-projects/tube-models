import { File } from '../../files';
import { Initial } from '../initial';
import { ipk } from '../models/ipk';
import { Trace } from '../trace';

export const estimateKg2 = function (initial: Initial, files: File[], maxW: number, trace?: Trace) {
    // check we need to estimate kg2
    if (!initial.kg2) {
        // mu, ex, kp and kvb must be initialized
        if (!initial.kp || !initial.mu || !initial.kvb || !initial.ex) {
            // cannot estimate kg2 without kp, mu, kvb and ex
            throw new Error('Cannot estimate kg2 without kp, mu, kvb and ex');
        }
        // initialize trace
        if (trace) {
            // estimates
            trace.estimates.kg2 = {
                average: [],
            };
        }
        // kg2 sum
        let sum = 0;
        // count
        let count = 0;
        // loop files
        for (const file of files) {
            // check measurement type (ep is in the X-axis)
            if (file.measurementType === 'IPIS_VA_VG_VS_VH' || file.measurementType === 'IPIS_VA_VS_VG_VH' || file.measurementType === 'IPIS_VAVS_VG_VH') {
                // loop series
                for (const series of file.series) {
                    // loop points (backwards, high ep)
                    for (let k = series.points.length - 1; k >= 0; k--) {
                        // current point
                        const p = series.points[k];
                        // is & ep
                        const is = p.is ?? 0;
                        const es = p.es ?? 0;
                        // check point meets power criteria and has a is
                        if ((p.ip + is) * p.ep / 1000 < maxW && is > 0) {
                            // IPk
                            const ip = ipk(p.eg + file.egOffset, es, initial.kp, initial.mu, initial.kvb, initial.ex);
                            // check we have IPk
                            if (ip > 0) {
                                // estimate kg2
                                const kg2 = ip * 1000 / is;
                                // update sum & count
                                sum += Math.abs(kg2);
                                count++;
                                // update trace
                                if (trace) {
                                    // append averages
                                    trace.estimates.kg2?.average.push({
                                        file: file.name,
                                        kg2: kg2,
                                    });
                                }
                                // exit loop
                                break;
                            }
                        }
                    }
                }
            }
        }
        // estimates
        initial.kg2 = count > 0 ? sum / count : 1000;
    }
};
