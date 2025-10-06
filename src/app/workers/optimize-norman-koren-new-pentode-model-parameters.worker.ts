/// <reference lib="webworker" />

import { DefaultPowellOptions, powell, PowellOptions } from './algorithms/powell';
import { estimatePentodeParameters } from './estimates/estimate-pentode-parameters';
import { File } from '../files';
import { Initial } from './initial';
import { levmar } from './algorithms/Levenberg-Marquardt';
import { normanKorenNewPentodeModel } from './models/norman-koren-new-pentode-model';
import { normanKorenNewPentodeModelError } from './models/norman-koren-new-pentode-model-error';
import { numberValueAt, Vector } from './algorithms/vector';
import { Trace } from './trace';

// LM algorithm
const optimizeWithLevenbergMarquardt = function (files: File[], maximumPlateDissipation: number, mu: number, ex: number, kg1: number, kp: number, kvb: number, kg2: number, trace?: Trace) {
    // residuals function (function to optimize)
    const R = function (x: Vector): Vector {
        // x vector values (abs)
        const x0 = Math.abs(numberValueAt(x, 0));
        const x1 = Math.abs(numberValueAt(x, 1));
        const x2 = Math.abs(numberValueAt(x, 2));
        const x3 = Math.abs(numberValueAt(x, 3));
        const x4 = Math.abs(numberValueAt(x, 4));
        const x5 = Math.abs(numberValueAt(x, 5));
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
                        const currents = normanKorenNewPentodeModel(point.ep, point.eg + file.egOffset, point.es ?? 0, kp * x3, mu * x0, kvb * x4, ex * x1, kg1 * x2, kg2 * x5);
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
        text: `Optimizing Pentode Model parameters using the Levenberg-Marquardt algorithm, Objective function value: ${(normanKorenNewPentodeModelError(files, kp, mu, kvb, ex, kg1, kg2, maximumPlateDissipation) * 1e-6).toExponential()}`
    });
    // optimize
    const result = levmar(R, [1, 1, 1, 1, 1, 1], {trace: trace, tolerance: 1e-4, kmax: 500});
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
            kg2: Math.abs(kg2 * numberValueAt(x, 5))
        };
        // log values
        self.postMessage({
            type: 'log',
            text: `Pentode Model parameters: mu=${parameters.mu}, ex=${parameters.ex}, kg1=${parameters.kg1}, kp=${parameters.kp}, kvb=${parameters.kvb}, kg2=${parameters.kg2}, Objective function value: ${(normanKorenNewPentodeModelError(files, parameters.kp, parameters.mu, parameters.kvb, parameters.ex, parameters.kg1, parameters.kg2, maximumPlateDissipation) * 1e-6).toExponential()}, iterations: ${result.iterations}`,
        });
        // return model parameters
        return parameters;
    }
    return undefined;
};

// Powell algorithm
const optimizeWithPowell = function (files: File[], maximumPlateDissipation: number, mu: number, ex: number, kg1: number, kp: number, kvb: number, kg2: number, trace?: Trace) {
    // log information
    postMessage({
        type: 'log',
        text: `Optimizing Pentode Model parameters using the Powell algorithm, Objective function value: ${(normanKorenNewPentodeModelError(files, kp, mu, kvb, ex, kg1, kg2, maximumPlateDissipation) * 1e-6).toExponential()}`,
    });
    // least square problem
    const leastSquares = function (x: number[]): number {
        // update parameters
        const mu = Math.abs(x[0]);
        const ex = Math.abs(x[1]);
        const kg1 = Math.abs(x[2]);
        const kp = Math.abs(x[3]);
        const kvb = Math.abs(x[4]);
        const kg2 = Math.abs(x[5]);
        // evaluate target function
        return normanKorenNewPentodeModelError(files, kp, mu, kvb, ex, kg1, kg2, maximumPlateDissipation);
    };
    // powell optimization options
    const options: PowellOptions = {
        absoluteThreshold: DefaultPowellOptions.absoluteThreshold,
        relativeThreshold: DefaultPowellOptions.relativeThreshold,
        iterations: 500,
        traceEnabled: true,
        trace: trace,
    };
    // create variable vector
    const x = [mu, ex, kg1, kp, kvb, kg2];
    // optimize f1
    const result = powell(x, leastSquares, options);
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
        };
        // log values
        postMessage({
            type: 'log',
            text: `Pentode Model parameters: mu=${parameters.mu}, ex=${parameters.ex}, kg1=${parameters.kg1}, kp=${parameters.kp}, kvb=${parameters.kvb}, kg2=${parameters.kg2}, Objective function value: ${(normanKorenNewPentodeModelError(files, parameters.kp, parameters.mu, parameters.kvb, parameters.ex, parameters.kg1, parameters.kg2, maximumPlateDissipation) * 1e-6).toExponential()}, iterations: ${result.iterations}`,
        });
        // return model parameters
        return parameters;
    }
    return undefined;
};

addEventListener('message', ({ data }) => {
    // get state
    const files = data.files;
    const maximumPlateDissipation = data.maximumPlateDissipation;
    const algorithm = data.algorithm;
    const trace = data.trace;
    // initial parameters
    const initial: Initial = {};
    // estimate parameters
    const estimates = estimatePentodeParameters(initial, files, maximumPlateDissipation, trace);
    // update parameters
    const mu = Math.abs(estimates.mu ?? 0);
    const ex = Math.abs(estimates.ex ?? 0);
    const kg1 = Math.abs(estimates.kg1 ?? 0);
    const kp = Math.abs(estimates.kp ?? 0);
    const kvb = Math.abs(estimates.kvb ?? 0);
    const kg2 = Math.abs(estimates.kg2 ?? 0);
    // log initial values
    postMessage({
        type: 'log',
        text: `Initial Pentode Model parameters: mu=${mu}, ex=${ex}, kg1=${kg1}, kp=${kp}, kvb=${kvb}, kg2=${kg2}`,
    });
    // optimized model parameters
    let parameters;
    // check algorithm
    if (algorithm === 0) {
        // use Levenberg-Marquardt
        parameters = optimizeWithLevenbergMarquardt(files, maximumPlateDissipation, mu, ex, kg1, kp, kvb, kg2, trace);
    }
    else {
        // use Powell
        parameters = optimizeWithPowell(files, maximumPlateDissipation, mu, ex, kg1, kp, kvb, kg2, trace);
    }
    // notify completion/failure
    postMessage({
        type: parameters ? 'succeeded' : 'failed',
        parameters: parameters,
        trace: trace,
    });
});
