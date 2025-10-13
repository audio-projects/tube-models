import { File } from '../../files';
import { Initial } from '../initial';
import { Trace } from '../trace';

export const estimateKp = function (initial: Initial, files: File[], trace?: Trace) {
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
            // loop series
            for (const series of file.series) {
                // series points must be sorted by the X axis (EP)
                series.points.sort((p1, p2) => p1.ep - p2.ep);
                // collect data points for linear regression
                const dataPoints: { x: number; y: number }[] = [];
                // loop points to collect high voltage data
                for (const p of series.points) {
                    // check point meets criteria (high Va, Va/μ > -Vg condition)
                    if (p.ep / mu > -(p.eg + file.egOffset)) {
                        // calculate e1 estimate
                        const e1 = Math.pow(((p.ip + (p.is ?? 0)) * kg1) / 2000, 1 / ex);
                        // check e1 is valid
                        if (e1 > 0) {
                            // x-axis: (1/μ + Vg/Va)
                            const x = 1 / mu + (p.eg + file.egOffset) / p.ep;
                            // y-axis: ln(E1)
                            const y = Math.log(e1);
                            // add data point
                            dataPoints.push({ x, y });
                        }
                    }
                }
                // perform linear regression if we have enough points
                if (dataPoints.length >= 3) {
                    // calculate means
                    const n = dataPoints.length;
                    const meanX = dataPoints.reduce((sum, p) => sum + p.x, 0) / n;
                    const meanY = dataPoints.reduce((sum, p) => sum + p.y, 0) / n;
                    // calculate slope (Kp estimate)
                    let numerator = 0;
                    let denominator = 0;
                    for (const point of dataPoints) {
                        const dx = point.x - meanX;
                        const dy = point.y - meanY;
                        numerator += dx * dy;
                        denominator += dx * dx;
                    }
                    // calculate Kp from slope
                    if (denominator > 0) {
                        // Kp estimate
                        const kpEstimate = numerator / denominator;
                        // validate Kp estimate (should be positive)
                        if (kpEstimate > 0) {
                            // update trace
                            if (trace) {
                                // append average
                                trace.estimates.kp?.average.push({
                                    file: file.name,
                                    kp: kpEstimate,
                                    eg: (series.eg ?? 0) + file.egOffset,
                                });
                            }
                            // append to sum
                            sum += kpEstimate;
                            // increment count
                            count++;
                        }
                    }
                }
            }
        }
        // calculate estimate
        initial.kp = count > 0 ? sum / count : 10;
    }
};
