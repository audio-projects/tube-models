import { File } from '../../files';
import { Initial } from '../initial';
import { Trace } from '../trace';

export const estimateKvb = function (initial: Initial, files: File[], maxW: number, egOffset: number, trace?: Trace) {
    // check we need to estimate kvb
    if (!initial.kvb) {
        // mu must be initialized
        if (!initial.mu || !initial.kp || !initial.kg1 || !initial.ex) {
            // cannot estimate ex and kg1 without mu
            throw new Error('Cannot estimate kp without mu, kp, kg1 and ex');
        }
        // initialize trace
        if (trace) {
            // estimates
            trace.estimates.kvb = {
                average: [],
            };
        }
        // mu, kg1 and ex for calculations
        const mu = initial.mu;
        const kp = initial.kp;
        const kg1 = initial.kg1;
        const ex = initial.ex;
        // averages
        let sum = 0;
        let count = 0;
        // loop files
        for (const file of files) {
            // check measurement type
            if (file.measurementType === 'IP_EP_EG_VH' || file.measurementType === 'IP_EPES_EG_VH') {
                // loop series
                for (const series of file.series) {
                    // series average (for trace)
                    let seriesSum = 0;
                    let seriesCount = 0;
                    // sort points by X axle (Ep)
                    series.points.sort((a, b) => (a.ep - b.ep));
                    // loop points
                    for (const p of series.points) {
                        // check point meets power criteria
                        if ((p.ip + (p.is ?? 0)) * p.ep * 1e-3 < maxW) {
                            // check point meets criteria (9.1.4)
                            if (kp * (1 / mu + (p.eg + egOffset) / p.ep) > 1) {
                                // calculate e1
                                const e1 = Math.pow(2 * (p.ip + (p.is ?? 0)) * 1e-3 * kg1, 1 / ex);
                                // use positive values only
                                if (e1 > 0) {
                                    // calculate kvb
                                    const kvb = Math.pow((p.eg + egOffset) / ((e1 / p.ep) - (1 / mu)), 2) - p.ep * p.ep;
                                    // update average calculation
                                    seriesSum += Math.abs(kvb);
                                    seriesCount++;
                                    // use 5 points per series for average calculation
                                    if (seriesCount === 5)
                                        break;
                                }
                            }
                        }
                    }
                    // update trace
                    if (trace) {
                        // append trace
                        trace.estimates.kvb?.average.push({
                            file: file.name,
                            kvb: seriesSum / seriesCount,
                            eg: (series.eg ?? 0) + egOffset,
                        });
                    }
                    // update sum
                    sum += seriesSum;
                    count += seriesCount;
                }
            }
        }
        // calculate estimate
        initial.kvb = count > 0 ? sum / count : 1000;
    }
};
