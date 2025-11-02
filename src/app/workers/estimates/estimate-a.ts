import { File, Point } from '../../files';
import { Initial } from '../initial';
import { ipk } from '../models/ipk';
import { Trace } from '../trace';

// estimateA
export const estimateA = function (initial: Initial, files: File[], trace?: Trace) {
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
                    // accumulate estimates for this series using weighted averaging
                    let seriesSum = 0;
                    let seriesCount = 0;
                    let seriesWeightSum = 0;
                    // points with high EP
                    let l: Point | null = null, u: Point | null = null;
                    // loop points (backwards from highest voltage)
                    for (let k = series.points.length - 1; k >= 0; k--) {
                        // current point
                        const p = series.points[k];
                        // update lower and upper points
                        l = u;
                        u = p;
                        // check we can use these points, make sure ip are different and with a positive slope (saturation)
                        if (l && u && u.ip > l.ip) {
                            // calculate midpoint values for more accurate ipk evaluation
                            // Using midpoint reduces approximation error in the finite difference
                            const egMid = ((l.eg + u.eg) / 2) + file.egOffset;
                            const esMid = ((l.es ?? 0) + (u.es ?? 0)) / 2;
                            // IPk at midpoint - more accurate than using single endpoint
                            const ip = ipk(egMid, esMid, initial.kp, initial.mu, initial.kvb, initial.ex);
                            // estimate A using finite difference approximation
                            const a = initial.kg1 * (u.ip - l.ip) * 1e-3 / (ip * (u.ep - l.ep));
                            // weight by voltage span - larger spans give more reliable slope estimates
                            // and reduce the impact of measurement noise
                            const weight = u.ep - l.ep;
                            // accumulate weighted estimate
                            seriesSum += Math.abs(a) * weight;
                            seriesWeightSum += weight;
                            seriesCount++;
                            // collect up to 3 point pairs per series for better noise rejection
                            // multiple samples provide statistical robustness
                            if (seriesCount >= 3) {
                                break;
                            }
                        }
                    }
                    // if we have estimates for this series, add weighted average to global sum
                    if (seriesCount > 0) {
                        const seriesAverage = seriesSum / seriesWeightSum;
                        // update trace if needed
                        if (trace) {
                            // append weighted average estimate for this series
                            trace.estimates.a?.average.push({
                                file: file.name,
                                a: seriesAverage,
                                eg: (series.eg ?? 0) + file.egOffset
                            });
                        }
                        // add series average to global average
                        sum += seriesAverage;
                        count++;
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
