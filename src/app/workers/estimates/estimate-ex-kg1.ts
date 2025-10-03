import { DefaultPowellOptions, powell, PowellOptions } from '../algorithms/powell';
import { File } from '../../files';
import { Initial } from '../initial';
import { Trace } from '../trace';

export const estimateExKg1 = function (initial: Initial, files: File[], maxW: number, trace?: Trace) {
    // check we need to estimate ex and kg1
    if (!initial.ex || !initial.kg1) {
        // mu must be initialized
        if (!initial.mu) {
            // cannot estimate ex and kg1 without mu
            throw new Error('Cannot estimate ex and kg1 without mu');
        }
        // initialize trace
        if (trace) {
            // estimates
            trace.estimates.ex = {
                average: [],
            };
            trace.estimates.kg1 = {
                average: [],
            };
        }
        // sum for averages
        let exSum = 0;
        let kg1Sum = 0;
        let count = 0;
        // mu for calculations
        const mu = initial.mu;
        // loop files
        for (const file of files) {
            // check measurement type (plate characteristics of a triode)
            if (file.measurementType === 'IP_VA_VG_VH' || file.measurementType === 'IPIS_VAVS_VG_VH') {
                // loop series
                for (const series of file.series) {
                    // series points must be sorted by the X axis (EP)
                    series.points.sort((p1, p2) => p1.ep - p2.ep);
                    // least squares function
                    const leastSquares = function (x: number[]): number {
                        // get parameters
                        const ex = Math.abs(x[0]);
                        const kg1 = Math.abs(x[1]);
                        // result
                        let r = 0;
                        // number of points to use
                        let c = 0;
                        // loop points (use large Ep, loop backwards)
                        for (let k = series.points.length - 1; k >= 0 && c < 6; k--) {
                            // current point
                            const p = series.points[k];
                            // check point meets power criteria
                            if (p.ip * p.ep * 1e-3 < maxW) {
                                // check point meets criteria
                                if (p.ep / mu > -(p.eg + file.egOffset)) {
                                    // compute error
                                    const e = -Math.log((p.ip + (p.is ?? 0)) * 1e-3) - Math.log(kg1) + ex * Math.log(p.ep / mu + p.eg + file.egOffset);
                                    // compute residual
                                    r += e * e;
                                    // increment number of points
                                    c++;
                                }
                                else {
                                    // exit loop
                                    break;
                                }
                            }
                        }
                        return r;
                    };
                    // powell optimization options
                    const options: PowellOptions = {
                        absoluteThreshold: DefaultPowellOptions.absoluteThreshold,
                        relativeThreshold: 1e-4,
                        iterations: 500,
                        traceEnabled: false,
                    };
                    // optimize leastSquares
                    const result = powell([initial.ex || 1.3, initial.kg1 || 1000], leastSquares, options);
                    // check result
                    if (result.converged) {
                        // update trace
                        if (trace) {
                            // append averages
                            trace.estimates.ex?.average.push({
                                file: file.name,
                                ex: Math.abs(result.x[0]),
                                eg: (series.eg ?? 0) + file.egOffset,
                            });
                            trace.estimates.kg1?.average.push({
                                file: file.name,
                                kg1: Math.abs(result.x[1]),
                                eg: (series.eg ?? 0) + file.egOffset,
                            });
                        }
                        // append to sums
                        exSum += Math.abs(result.x[0]);
                        kg1Sum += Math.abs(result.x[1]);
                        // increment count
                        count++;
                    }
                }
            }
        }
        // calculate estimates
        initial.ex = count > 0 ? exSum / count : 1.3;
        initial.kg1 = count > 0 ? kg1Sum / count : 1000;
    }
};
