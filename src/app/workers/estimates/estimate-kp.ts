import { DefaultPowellOptions, powell, PowellOptions } from '../algorithms/powell';
import { File } from '../../files';
import { Initial } from '../initial';
import { Trace } from '../trace';

export const estimateKp = function (initial: Initial, files: File[], maxW: number, trace?: Trace) {
    // check we need to estimate kp
    if (!initial.kp) {
        // mu must be initialized
        if (!initial.mu || !initial.ex || !initial.kg1) {
            // cannot estimate ex and kg1 without mu
            throw new Error('Cannot estimate kp without mu, ex and kg1');
        }
        // initialize trace
        if (trace) {
            // estimates
            trace.estimates.kp = {
                average: [],
            };
        }
        // averages
        let sum = 0;
        let count = 0;
        // mu, kg1 and ex for calculations
        const mu = initial.mu;
        const kg1 = initial.kg1;
        const ex = initial.ex;
        // loop files
        for (const file of files) {
            // check measurement type
            if (file.measurementType === 'IP_EP_EG_VH' || file.measurementType === 'IP_EPES_EG_VH') {
                // loop series
                for (const series of file.series) {
                    // series points must be sorted by the X axis (EP)
                    series.points.sort((p1, p2) => p1.ep - p2.ep);
                    // least squares function
                    const leastSquares = function (x: number[]): number {
                        // get parameter
                        const kp = Math.abs(x[0]);
                        // result
                        let r = 0;
                        // number of points to use
                        let c = 0;
                        // loop points
                        for (let k = 0; k < series.points.length && c < 6; k++) {
                            // current point
                            const p = series.points[k];
                            // check point meets power criteria
                            if ((p.ip + (p.is ?? 0)) * p.ep * 1e-3 < maxW) {
                                // check point meets criteria
                                if (p.ep / mu > -(p.eg + file.egOffset)) {
                                    // calculate e1 estimate
                                    const e1 = Math.pow(((p.ip + (p.is ?? 0)) * kg1) / 2000, 1 / ex);
                                    // check e1
                                    if (e1 > 0) {
                                        // difference
                                        const d = -Math.log(e1) + Math.log(p.ep) - Math.log(kp) + kp * (1 / mu + (p.eg + file.egOffset) / p.ep);
                                        // update r
                                        r += d * d;
                                        // increment points used
                                        c++;
                                    }
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
                    const result = powell([100], leastSquares, options);
                    // check result
                    if (result.converged) {
                        // update trace
                        if (trace) {
                            // append average
                            trace.estimates.kp?.average.push({
                                file: file.name,
                                kp: Math.abs(result.x[0]),
                                eg: (series.eg ?? 0) + file.egOffset,
                            });
                        }
                        // append to sum
                        sum += Math.abs(result.x[0]);
                        // increment count
                        count++;
                    }
                }
            }
        }
        // calculate estimate
        initial.kp = count > 0 ? sum / count : 300;
    }
};
