import { derkEModel } from '../models/derk-e-model';
import { derkModel } from '../models/derk-model';
import { File } from '../../files';
import { InflectionPoint } from './inflection-point';
import { Initial } from '../initial';
import { powell } from '../algorithms/powell';
import { Trace } from '../trace';
import { estimateDerkS } from './estimate-derk-s';

// estimateSecondaryEmissionParameters
export const estimateSecondaryEmissionParameters = function (initial: Initial, files: File[], egOffset: number, model: typeof derkEModel | typeof derkModel, estimateS: typeof estimateDerkS, trace?: Trace) {
    // initialize trace if needed
    if (trace) {
        // estimates
        trace.estimates = trace.estimates || {};
        trace.estimates.secondaryEmission = {
            inflectionPoints: []
        };
    }
    // lambda (lambda = mu)
    initial.lambda = initial.lambda || initial.mu;
    // alphaP
    initial.alphaP = initial.alphaP || 0.05;
    // estimate v, w & s if needed
    if (!initial.v || !initial.w || !initial.s) {
        // inflection & local maximum points
        const points = [];
        // loop all files
        for (const file of files) {
            // check measurement type (ep is in the X-axis and es is constant), do not use triode files
            if (file.measurementType === 'IPIS_VA_VG_VS_VH') {
                // loop series
                for (const series of file.series) {
                    // series points must be sorted by the X axis (EP)
                    series.points.sort((p1, p2) => p1.ep - p2.ep);
                    // check we have valid points
                    if (series.points.length > 0) {
                        // inflection point detection
                        let lastSlope = 0;
                        // initialize points
                        let lp = series.points[0];
                        // loop points (skip first, use points with low ep)
                        for (let k = 1; k < series.points.length ; k++) {
                            // current point
                            const p = series.points[k];
                            // calculate slope
                            const slope = ((p.is || 0) - (lp.is || 0)) / (p.ep - lp.ep);
                            // detect changes when we have processed two points
                            if (k > 1) {
                                // detect inflection point (change in slope sign)
                                if (slope * lastSlope <= 0) {
                                    // store point (last point since this is the place slope changed)
                                    points.push(lp);
                                    // exit loop
                                    break;
                                }
                                // detect local maximum (slope is increasing when ep is increasing, detect a decreasing slope)
                                if (slope < lastSlope) {
                                    // store point (last point since this is the place slope changed)
                                    points.push(lp);
                                    // exit loop
                                    break;
                                }
                            }
                            // store slope
                            lastSlope = slope;
                            // update previous point
                            lp = p;
                        }
                    }
                }
            }
        }
        // inflection points to use
        const inflectionPoints : InflectionPoint[] = [];
        // loop points
        for (const point of points) {
            // least squares
            const ls = function(x: number[]): number {
                // Vamax
                const epmax = Math.abs(x[0]);
                // calculate screen current
                const {is} = model(epmax, point.eg + egOffset, point.es, initial.kp, initial.mu, initial.kvb, initial.ex, initial.kg1, initial.kg2, initial.a, initial.alpha, initial.alphaS, initial.beta, true);
                // residual
                return ((point.is || 0) - is) * ((point.is || 0) - is);
            };
            // optimize leastSquares
            const r = powell([point.ep], ls, {
                iterations: 500,
                traceEnabled: false,
                relativeThreshold: 1e-4
            });
            // check result
            if (r.converged) {
                // epmax
                const epmax = Math.abs(r.x[0]);
                // check it is a valid value
                if (point.ep >= epmax) {
                    // add to inflection points
                    inflectionPoints.push({
                        epmax: epmax,
                        eg: point.eg,
                        is: point.is || 0,
                        ip: point.ip,
                        ep: point.ep,
                        es: point.es || 0
                    });
                }
            }
        }
        // update trace
        if (trace)
            trace.estimates.secondaryEmission.inflectionPoints = inflectionPoints;
        // check we need to estimate v or w
        if (!initial.v || !initial.w) {
            // least squares function
            const leastSquares = function(x: number[]) {
                // get parameters
                const v = x[0];
                const w = x[1];
                // result
                let r = 0;
                // loop inflectionPoints
                for (const p of inflectionPoints) {
                    // difference
                    const d = -p.epmax + p.ip / initial.lambda - v * (p.eg + egOffset) - w;
                    // update r
                    r += d * d;
                }
                return r;
            };
            // optimize leastSquares
            const result = powell([0, 0], leastSquares, {
                iterations: 500,
                traceEnabled: false,
                relativeThreshold: 1e-4
            });
            // check result
            if (result.converged) {
                // set initial values
                initial.v = result.x[0];
                initial.w = result.x[1];
            }
            else {
                // set initial values
                initial.v = 0;
                initial.w = 0;
            }
            // update trace
            if (trace) {
                trace.estimates.secondaryEmission.v = Math.abs(initial.v);
                trace.estimates.secondaryEmission.w = Math.abs(initial.w);
            }
        }
        // estimate S
        estimateS(initial, inflectionPoints, egOffset, trace);
    }
};
