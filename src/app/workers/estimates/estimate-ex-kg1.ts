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
            // check measurement type (plate characteristics of a triode and pentode)
            if (file.measurementType === 'IP_VA_VG_VH' || file.measurementType === 'IPIS_VAVS_VG_VH' || file.measurementType === 'IPIS_VA_VG_VS_VH' || file.measurementType === 'IPIS_VG_VA_VS_VH' || file.measurementType === 'IPIS_VG_VAVS_VH') {
                // loop series
                for (const series of file.series) {
                    // series points must be sorted by the X axis (EP)
                    series.points.sort((p1, p2) => p1.ep - p2.ep);
                    // collect data points for linear regression
                    const xData: number[] = [];
                    const yData: number[] = [];
                    // loop points (use large Ep for high voltage condition)
                    for (let k = series.points.length - 1; k >= 0; k--) {
                        // current point
                        const p = series.points[k];
                        // check point meets power criteria
                        if (p.ip * p.ep * 1e-3 < maxW) {
                            // effective voltage: Va/mu + Vg
                            const veff = p.ep / mu + (p.eg + file.egOffset);
                            // check Derk Reefman condition: Va/mu > -Vg
                            if (p.ep / mu > -(p.eg + file.egOffset) && veff > 0) {
                                // total current (plate + screen for pentodes)
                                const itotal = (p.ip + (p.is ?? 0)) * 1e-3;
                                if (itotal > 0) {
                                    // linear regression data: ln(Ia) vs ln(Va/mu + Vg)
                                    xData.push(Math.log(veff));
                                    yData.push(Math.log(itotal));
                                }
                            }
                        }
                    }
                    // perform linear regression if we have enough points
                    if (xData.length >= 3) {
                        // calculate linear regression: y = slope * x + intercept
                        const n = xData.length;
                        const sumX = xData.reduce((a, b) => a + b, 0);
                        const sumY = yData.reduce((a, b) => a + b, 0);
                        const sumXY = xData.reduce((sum, x, i) => sum + x * yData[i], 0);
                        const sumXX = xData.reduce((sum, x) => sum + x * x, 0);
                        // linear regression formulas
                        const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
                        const intercept = (sumY - slope * sumX) / n;
                        // extract parameters
                        const exEst = slope; // Ex is the slope
                        const kg1Est = Math.exp(-intercept); // Kg1 = exp(-intercept)
                        // ensure physically reasonable values
                        if (exEst > 0.1 && exEst < 5.0 && kg1Est > 0.01 && kg1Est < 1000000) {
                            // update trace
                            if (trace) {
                                // append averages
                                trace.estimates.ex?.average.push({
                                    file: file.name,
                                    ex: exEst,
                                    eg: (series.eg ?? 0) + file.egOffset,
                                });
                                trace.estimates.kg1?.average.push({
                                    file: file.name,
                                    kg1: kg1Est,
                                    eg: (series.eg ?? 0) + file.egOffset,
                                });
                            }
                            // append to sums
                            exSum += exEst;
                            kg1Sum += kg1Est;
                            // increment count
                            count++;
                        }
                    }
                }
            }
        }
        // calculate estimates
        initial.ex = count > 0 ? exSum / count : 1.3;
        initial.kg1 = count > 0 ? kg1Sum / count : 1000;
    }
};
