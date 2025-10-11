import { File, Point } from '../../files';
import { Initial } from '../initial';
import { ipk } from '../models/ipk';
import { Trace } from '../trace';

// estimateA
export const estimateA = function (initial: Initial, files: File[], maxW: number, trace?: Trace) {
    // check we need to estimate a
    if (!initial.a) {
        // mu, kp, kvb, ex and kg1 must be initialized
        if (!initial.kp || !initial.mu || !initial.kvb || !initial.ex || !initial.kg1) {
            // cannot estimate a without these parameters
            throw new Error('Cannot estimate a without kp, mu, kvb, ex and kg1');
        }
        // initialize trace
        if (trace) {
            // estimates
            trace.estimates.a = {
                average: []
            };
        }
        // average
        let sum = 0;
        // count
        let count = 0;
        // loop files
        for (const file of files) {
            // check measurement type (ep is in the X-axis)
            if (file.measurementType === 'IPIS_VA_VG_VS_VH' || file.measurementType === 'IPIS_VA_VS_VG_VH' || file.measurementType === 'IPIS_VAVS_VG_VH') {
                // loop series
                for (const series of file.series) {
                    // series points must be sorted by the X axis (EP)
                    series.points.sort((p1, p2) => p1.ep - p2.ep);
                    // points with high EP
                    let l: Point | null = null, u: Point | null = null;
                    // loop points (backwards)
                    for (let k = series.points.length - 1; k >= 0; k--) {
                        // current point
                        const p = series.points[k];
                        // check point meets power criteria
                        if (p.ip * p.ep * 1e-3 < maxW) {
                            // update lower and upper points
                            l = u;
                            u = p;
                            // check we can use these points, make sure ip are different and with a positive slope (saturation)
                            if (l && u && u.ip > l.ip) {
                                // IPk
                                const ip = ipk(l.eg + file.egOffset, l.es ?? 0, initial.kp, initial.mu, initial.kvb, initial.ex);
                                // estimate A
                                const a = initial.kg1 * (u.ip - l.ip) * 1e-3 / (ip * (u.ep - l.ep));
                                // update trace if needed
                                if (trace) {
                                    // append estimate
                                    trace.estimates.a?.average.push({
                                        file: file.name,
                                        a: a,
                                        eg: (series.eg ?? 0) + file.egOffset
                                    });
                                }
                                // average values (use absolute value to ensure A is always positive)
                                sum += Math.abs(a);
                                count++;
                                // exit
                                break;
                            }
                        }
                    }
                }
            }
            else if (file.measurementType === 'IP_EG_EP_VS_VH') {
                // TODO: implement
            }
            else if (file.measurementType === 'IP_ES_EG_VA_VH') {
                // TODO: implement
            }
        }
        // finalize estimate (average)
        initial.a = count > 0 ? sum / count : 0.001;
    }
};
