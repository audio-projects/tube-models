/// <reference lib="webworker" />

import { DefaultPowellOptions, powell, PowellOptions } from './algorithms/powell';
import { derkEModel } from './models/derke-model';
import { derkEModelError } from './models/derke-model-error';
import { estimateDerkEParameters } from './estimates/estimate-derke-parameters';
import { File } from '../files';
import { levmar } from './algorithms/Levenberg-Marquardt';
import { numberValueAt, Vector } from './algorithms/vector';
import { Trace } from './trace';

// LM algorithm
const optimizeWithLevenbergMarquardt = function (files: File[], maximumPlateDissipation: number, mu: number, ex: number, kg1: number, kp: number, kvb: number, kg2: number, a: number, alphaS: number, beta: number, secondaryEmission: boolean, s: number, alphaP: number, lambda: number, v: number, w: number, trace?: Trace) {
    // residuals function (function to optimize)
    const R = function (x: Vector): Vector {
        // x vector values (abs)
        const x0 = Math.abs(numberValueAt(x, 0));
        const x1 = Math.abs(numberValueAt(x, 1));
        const x2 = Math.abs(numberValueAt(x, 2));
        const x3 = Math.abs(numberValueAt(x, 3));
        const x4 = Math.abs(numberValueAt(x, 4));
        const x5 = Math.abs(numberValueAt(x, 5));
        const x6 = Math.abs(numberValueAt(x, 6));
        const x7 = Math.abs(numberValueAt(x, 7));
        const x8 = Math.abs(numberValueAt(x, 8));
        const x9 = Math.abs(numberValueAt(x, 9));
        const x10 = Math.abs(numberValueAt(x, 10));
        const x11 = Math.abs(numberValueAt(x, 11));
        const x12 = Math.abs(numberValueAt(x, 12));
        const x13 = Math.abs(numberValueAt(x, 13));
        // residuals
        const r = [];
        let index = 0;
        // loop data files
        for (const file of files) {
            // loop series
            for (const series of file.series) {
                // loop points
                for (const point of series.points) {
                    // check we can use this point in calculations (max power dissipation and different than zero)
                    if ((point.ip + (point.is ?? 0)) > 0 && point.ep * (point.ip + (point.is ?? 0)) * 1e-3 <= maximumPlateDissipation) {
                        // calculate currents
                        const currents = derkEModel(point.ep, point.eg + file.egOffset, point.es ?? 0, kp * x3, mu * x0, kvb * x4, ex * x1, kg1 * x2, kg2 * x5, a * x6, alphaS * x7, beta * x8, secondaryEmission, s * x9, alphaP * x10, lambda * x11, v * x12, w * x13);
                        // residuals
                        r[index++] = currents.ip - point.ip;
                        r[index++] = currents.is - (point.is ?? 0);
                    }
                }
            }
        }
        // return vector
        return r;
    };
    // log information
    self.postMessage({
        type: 'log',
        text: `Optimizing Derk Model parameters using the Levenberg-Marquardt algorithm, Root Mean Square Error: ${derkEModelError(files, kp, mu, kvb, ex, kg1, kg2, a, alphaS, beta, secondaryEmission, s, alphaP, lambda, v, w, maximumPlateDissipation).rmse.toExponential()}`
    });
    // optimize
    const result = levmar(R, [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1], {trace: trace, tolerance: 1e-4, kmax: 500});
    // check result
    if (result.converged) {
        // update variable vector
        const x = result.x;
        // create model parameters
        const parameters = {
            mu: Math.abs(mu * numberValueAt(x, 0)),
            ex: Math.abs(ex * numberValueAt(x, 1)),
            kg1: Math.abs(kg1 * numberValueAt(x, 2)),
            kp: Math.abs(kp * numberValueAt(x, 3)),
            kvb: Math.abs(kvb * numberValueAt(x, 4)),
            kg2: Math.abs(kg2 * numberValueAt(x, 5)),
            a: Math.abs(a * numberValueAt(x, 6)),
            alphaS: Math.abs(alphaS * numberValueAt(x, 7)),
            beta: Math.abs(beta * numberValueAt(x, 8)),
            s: Math.abs(s * numberValueAt(x, 9)),
            alphaP: Math.abs(alphaP * numberValueAt(x, 10)),
            lambda: Math.abs(lambda * numberValueAt(x, 11)),
            v: Math.abs(v * numberValueAt(x, 12)),
            w: Math.abs(w * numberValueAt(x, 13)),
            secondaryEmission: secondaryEmission,
        };
        // log values
        self.postMessage({
            type: 'log',
            text: `Derk Model parameters: mu=${parameters.mu}, ex=${parameters.ex}, kg1=${parameters.kg1}, kp=${parameters.kp}, kvb=${parameters.kvb}, kg2=${parameters.kg2}, a=${parameters.a}, alphaS=${parameters.alphaS}, beta=${parameters.beta}, secondaryEmission=${parameters.secondaryEmission}, s=${parameters.s}, alphaP=${parameters.alphaP}, lambda=${parameters.lambda}, v=${parameters.v}, w=${parameters.w}, Root Mean Square Error: ${derkEModelError(files, parameters.kp, parameters.mu, parameters.kvb, parameters.ex, parameters.kg1, parameters.kg2, parameters.a, parameters.alphaS, parameters.beta, parameters.secondaryEmission, parameters.s, parameters.alphaP, parameters.lambda, parameters.v, parameters.w, maximumPlateDissipation).rmse.toExponential()}, iterations: ${result.iterations}`,
        });
        // return model parameters
        return parameters;
    }
    return undefined;
};

// Powell algorithm
const optimizeWithPowell = function (files: File[], maximumPlateDissipation: number, mu: number, ex: number, kg1: number, kp: number, kvb: number, kg2: number, a: number, alphaS: number, beta: number, secondaryEmission: boolean, s: number, alphaP: number, lambda: number, v: number, w: number, trace?: Trace) {
    // log information
    postMessage({
        type: 'log',
        text: `Optimizing Derk E Model parameters using the Powell algorithm, Root Mean Square Error: ${derkEModelError(files, kp, mu, kvb, ex, kg1, kg2, a, alphaS, beta, secondaryEmission, s, alphaP, lambda, v, w, maximumPlateDissipation).rmse.toExponential()}`,
    });
    // least square problem (optimize parameters not affecting the Koren current)
    let sumOfSquaredErrors = function (x: number[]): number {
        // update parameters
        const kg1 = Math.abs(x[0]);
        const kg2 = Math.abs(x[1]);
        const a = Math.abs(x[2]);
        const alphaS = Math.abs(x[3]);
        const beta = Math.abs(x[4]);
        // secondary emission parameters
        const s = secondaryEmission ? Math.abs(x[5]) : 0;
        const alphaP = secondaryEmission ? Math.abs(x[6]) : 0;
        const lambda = secondaryEmission ? Math.abs(x[7]) : 0;
        const v = secondaryEmission ? Math.abs(x[8]) : 0;
        const w = secondaryEmission ? Math.abs(x[9]) : 0;
        // evaluate target function
        return derkEModelError(files, kp, mu, kvb, ex, kg1, kg2, a, alphaS, beta, secondaryEmission, s, alphaP, lambda, v, w, maximumPlateDissipation).sse;
    };
    // powell optimization options
    const options: PowellOptions = {
        absoluteThreshold: DefaultPowellOptions.absoluteThreshold,
        relativeThreshold: DefaultPowellOptions.relativeThreshold,
        iterations: 500,
        traceEnabled: true,
        trace: trace,
    };
    // optimize f1
    let result = powell(secondaryEmission ? [kg1, kg2, a, alphaS, beta, s, alphaP, lambda, v, w] : [kg1, kg2, a, alphaS, beta], sumOfSquaredErrors, options);
    // check result
    if (result.converged) {
        // extract parameters
        const kg1 = Math.abs(result.x[0]);
        const kg2 = Math.abs(result.x[1]);
        const a = Math.abs(result.x[2]);
        const alphaS = Math.abs(result.x[3]);
        const beta = Math.abs(result.x[4]);
        // secondary emission parameters
        const s = secondaryEmission ? Math.abs(result.x[5]) : 0;
        const alphaP = secondaryEmission ? Math.abs(result.x[6]) : 0;
        const lambda = secondaryEmission ? Math.abs(result.x[7]) : 0;
        const v = secondaryEmission ? Math.abs(result.x[8]) : 0;
        const w = secondaryEmission ? Math.abs(result.x[9]) : 0;
        // log information
        postMessage({
            type: 'log',
            text: `1. Derk Model parameters: mu=${mu}, ex=${ex}, kg1=${kg1}, kp=${kp}, kvb=${kvb}, kg2=${kg2}, a=${a}, alphaS=${alphaS}, beta=${beta}, s=${s}, alphaP=${alphaP}, lambda=${lambda}, v=${v}, w=${w}, Root Mean Square Error: ${derkEModelError(files, kp, mu, kvb, ex, kg1, kg2, a, alphaS, beta, secondaryEmission, s, alphaP, lambda, v, w, maximumPlateDissipation).rmse.toExponential()}, iterations: ${result.iterations}`,
        });
        // optimize now all parameters simultaneously
        sumOfSquaredErrors = function (x: number[]): number {
            // update parameters
            const mu = Math.abs(x[0]);
            const ex = Math.abs(x[1]);
            const kg1 = Math.abs(x[2]);
            const kp = Math.abs(x[3]);
            const kvb = Math.abs(x[4]);
            const kg2 = Math.abs(x[5]);
            const a = Math.abs(x[6]);
            const alphaS = Math.abs(x[7]);
            const beta = Math.abs(x[8]);
            // secondary emission parameters
            const s = secondaryEmission ? Math.abs(x[9]) : 0;
            const alphaP = secondaryEmission ? Math.abs(x[10]) : 0;
            const lambda = secondaryEmission ? Math.abs(x[11]) : 0;
            const v = secondaryEmission ? Math.abs(x[12]) : 0;
            const w = secondaryEmission ? Math.abs(x[13]) : 0;
            // evaluate target function
            return derkEModelError(files, kp, mu, kvb, ex, kg1, kg2, a, alphaS, beta, secondaryEmission, s, alphaP, lambda, v, w, maximumPlateDissipation).sse;
        };
        // optimize f1
        result = powell(secondaryEmission ? [mu, ex, kg1, kp, kvb, kg2, a, alphaS, beta, s, alphaP, lambda, v, w] : [mu, ex, kg1, kp, kvb, kg2, a, alphaS, beta], sumOfSquaredErrors, options);
        // check result
        if (result.converged) {
            // create model parameters
            const parameters = {
                mu: Math.abs(result.x[0]),
                ex: Math.abs(result.x[1]),
                kg1: Math.abs(result.x[2]),
                kp: Math.abs(result.x[3]),
                kvb: Math.abs(result.x[4]),
                kg2: Math.abs(result.x[5]),
                a: Math.abs(result.x[6]),
                alphaS: Math.abs(result.x[7]),
                beta: Math.abs(result.x[8]),
                // secondary emission parameters
                secondaryEmission: secondaryEmission,
                s: secondaryEmission ? Math.abs(result.x[9]) : 0,
                alphaP: secondaryEmission ? Math.abs(result.x[10]) : 0,
                lambda: secondaryEmission ? Math.abs(result.x[11]) : 0,
                v: secondaryEmission ? Math.abs(result.x[12]) : 0,
                w: secondaryEmission ? Math.abs(result.x[13]) : 0,
                // root mean square error
                rmse: 0,
            };
            // calculate Root Mean Square Error
            parameters.rmse = derkEModelError(files, parameters.kp, parameters.mu, parameters.kvb, parameters.ex, parameters.kg1, parameters.kg2, parameters.a, parameters.alphaS, parameters.beta, secondaryEmission, parameters.s, parameters.alphaP, parameters.lambda, parameters.v, parameters.w, maximumPlateDissipation).rmse;
            // log values
            postMessage({
                type: 'log',
                text: `2. Derk Model parameters: mu=${parameters.mu}, ex=${parameters.ex}, kg1=${parameters.kg1}, kp=${parameters.kp}, kvb=${parameters.kvb}, kg2=${parameters.kg2}, a=${parameters.a}, alphaS=${parameters.alphaS}, beta=${parameters.beta}, s=${parameters.s}, alphaP=${parameters.alphaP}, lambda=${parameters.lambda}, v=${parameters.v}, w=${parameters.w}, Root Mean Square Error: ${parameters.rmse.toExponential()}, iterations: ${result.iterations}`,
            });
            // return model parameters
            return parameters;
        }
    }
    return undefined;
};

addEventListener('message', ({ data }) => {
    // get state
    const files = data.files;
    const maximumPlateDissipation = data.maximumPlateDissipation;
    const secondaryEmission = data.secondaryEmission;
    const algorithm = data.algorithm;
    const trace = data.trace;
    // estimate parameters
    const estimates = estimateDerkEParameters({}, files, maximumPlateDissipation, secondaryEmission, trace);
    // update parameters
    const mu = Math.abs(estimates.mu ?? 0);
    const ex = Math.abs(estimates.ex ?? 0);
    const kg1 = Math.abs(estimates.kg1 ?? 0);
    const kp = Math.abs(estimates.kp ?? 0);
    const kvb = Math.abs(estimates.kvb ?? 0);
    const kg2 = Math.abs(estimates.kg2 ?? 0);
    const a = Math.abs(estimates.a ?? 0);
    const alphaS = Math.abs(estimates.alphaS ?? 0);
    const beta = Math.abs(estimates.beta ?? 0);
    // secondary emission parameters
    const s = Math.abs(estimates.s ?? 0);
    const alphaP = Math.abs(estimates.alphaP ?? 0);
    const lambda = Math.abs(estimates.lambda ?? 0);
    const v = Math.abs(estimates.v ?? 0);
    const w = Math.abs(estimates.w ?? 0);
    // log initial values
    postMessage({
        type: 'log',
        text: `Initial Derk E Model parameters (secondary emissions=${secondaryEmission}): mu=${mu}, ex=${ex}, kg1=${kg1}, kp=${kp}, kvb=${kvb}, kg2=${kg2} a=${a}, alphaS=${alphaS}, beta=${beta}, s=${s}, alphaP=${alphaP}, lambda=${lambda}, v=${v}, w=${w}`,
    });
    // optimized model parameters
    let parameters;
    // check algorithm
    if (algorithm === 0) {
        // use Levenberg-Marquardt
        parameters = optimizeWithLevenbergMarquardt(files, maximumPlateDissipation, mu, ex, kg1, kp, kvb, kg2, a, alphaS, beta, secondaryEmission, s, alphaP, lambda, v, w, trace);
    }
    else {
        // use Powell
        parameters = optimizeWithPowell(files, maximumPlateDissipation, mu, ex, kg1, kp, kvb, kg2, a, alphaS, beta, secondaryEmission, s, alphaP, lambda, v, w, trace);
    }
    // notify completion/failure
    postMessage({
        type: parameters ? 'succeeded' : 'failed',
        parameters: parameters,
        trace: trace,
    });
});
