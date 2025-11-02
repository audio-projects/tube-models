import { DefaultPowellOptions, powell } from '../algorithms/powell';
import { estimateA } from './estimate-a';
import { estimateDerkES } from './estimate-derke-s';
import { estimateExKg1 } from './estimate-ex-kg1';
import { estimateKg2 } from './estimate-kg2';
import { estimateKp } from './estimate-kp';
import { estimateMu } from './estimate-mu';
import { estimateSecondaryEmissionParameters } from './estimate-secondary-emission-parameters';
import { File } from '../../files';
import { Initial } from '../initial';
import { ipk } from '../models/ipk';
import { Trace } from '../trace';

// estimateDerkEParameters
export const estimateDerkEParameters = function (initial: Initial, files: File[], secondaryEmission: boolean, trace?: Trace): Initial {
    // initialize trace
    if (trace) {
        // estimates
        trace.estimates = trace.estimates || {};
        trace.estimates.beta = {
            average: []
        };
        trace.estimates.alphaS = {
            average: []
        };
    }
    // estimate mu
    estimateMu(initial, files, trace);
    // estimate ex and kg1
    estimateExKg1(initial, files, trace);
    // estimate kp
    estimateKp(initial, files, trace);
    // kvb is not estimated for pentodes, it uses a hardcoded value
    initial.kvb = 100;
    // estimate kg2
    estimateKg2(initial, files, trace);
    // estimate a
    estimateA(initial, files, trace);
    // check we need to estimate parameters
    if (!initial.alphaS || !initial.beta) {
        // mu, ex, kp and kvb must be initialized
        if (!initial.kp || !initial.mu || !initial.kvb || !initial.ex || !initial.kg2) {
            // cannot estimate parameters without kp, mu, kvb, ex and kg2
            throw new Error('Cannot estimate parameters without kp, mu, kvb, ex and kg2');
        }
        // capture initial values
        const kp = initial.kp;
        const mu = initial.mu;
        const kvb = initial.kvb;
        const ex = initial.ex;
        const kg2 = initial.kg2;
        // sums
        let aSum = 0;
        let bSum = 0;
        // count
        let count = 0;
        // loop all files
        for (const file of files) {
            // check measurement type (ep is in the X-axis)
            if (file.measurementType === 'IPIS_VA_VG_VS_VH' || file.measurementType === 'IPIS_VA_VS_VG_VH' || file.measurementType === 'IPIS_VAVS_VG_VH') {
                // loop series
                for (const series of file.series) {
                    // series points must be sorted by the X axis (EP)
                    series.points.sort((p1, p2) => p1.ep - p2.ep);
                    // least squares function
                    const leastSquares = function(x: number[]) {
                        // slope and interception
                        const a = x[0];
                        const b = x[1];
                        // result
                        let r = 0;
                        // number of points to use
                        let c = 0;
                        // loop points (very small values of Va, where secondary emission is visible in plate characteristics)
                        for (const p of series.points) {
                            // "is" and "es" must be defined
                            if (p.is && p.es) {
                                // ipk
                                const ip = ipk(p.eg + file.egOffset, p.es, kp, mu, kvb, ex);
                                // Calculate ratio - for DerkE model, we need Is*kg2/Ip > 1
                                // This means space charge effects are visible (screen current enhanced)
                                const ratio = p.is * 1e-3 * kg2 / ip;
                                if (ratio > 1) {
                                    // difference
                                    const d = Math.log(ratio - 1) - (a * Math.pow(p.ep, 1.5) + b);
                                    // least squares
                                    r += d * d;
                                    // update points used
                                    c++;
                                    // use 4 points
                                    if (c >= 4)
                                        break;
                                }
                            }
                        }
                        // If no valid points found, return large error to indicate bad fit
                        return c > 0 ? r : 1e10;
                    };
                    // optimize leastSquares
                    const result = powell([5, 0.05], leastSquares, DefaultPowellOptions);
                    // check result
                    if (result.converged) {
                        // slope and interception
                        const a = result.x[0];
                        const b = result.x[1];
                        // update trace
                        if (trace?.estimates.beta && trace?.estimates.alphaS) {
                            // slope and interception
                            trace.estimates.beta.average.push({
                                file: file.name,
                                a: a,
                                b: b,
                                eg: (series.eg || 0) + file.egOffset
                            });
                            trace.estimates.alphaS.average.push({
                                file: file.name,
                                a: a,
                                b: b,
                                eg: (series.eg || 0) + file.egOffset
                            });
                        }
                        // append to sums
                        aSum += a;
                        bSum += b;
                        // increment count
                        count++;
                    }
                }
            }
        }
        // calculate estimates
        initial.alphaS = count > 0 ? Math.exp(bSum / count) : 5;
        // beta = (-a)^(2/3) where a should be negative (space charge decreases with voltage)
        // Use absolute value to ensure valid result even if fit gives wrong sign
        initial.beta = count > 0 ? Math.pow(Math.abs(aSum / count), 2 / 3) : 0.001;
    }
    // process secondary emission
    estimateSecondaryEmissionParameters(initial, files, secondaryEmission, estimateDerkES, trace);
    // return estimates
    return initial;
};
