import { add, smaller, divide, larger, flatten, identity, inv, MathCollection, MathNumericType,  max, multiply, norm, subtract, transpose } from 'mathjs';
import { derivative, Jacobian, JacobianT } from './derivative';
import { Trace } from '../trace';
import { processOptions } from './processOptions';
import { length, Vector } from './vector';

/*
 * Levenberg-Marquardt problems have objective functions in the form
 *
 *                T
 *     F(x) = R(x) * R(x) / 2
 *
 * returns [R(x), F(x)],
 *         R(x): column vector, size = number of functions
 *         F(x): number
 *
 * @author: Rogelio J. Baucells
 * @version: 1.0
 */
function levmarObjectiveFunction(r: (x: Vector) => Vector, x: Vector, trace?: Trace, iteration?: number): [Vector, MathNumericType] {
    // evaluate residual function r(x), column vector, size number of functions
    const Rx = r(x);
    // compute F(x) = R(x)' R(x) / 2
    const Fx = divide(multiply(transpose(Rx), Rx), 2) as MathNumericType;
    // update trace if needed
    if (trace) {
        // update iterations if needed
        if (isFinite(iteration || 0) && trace.residuals)
            trace.residuals.push({ r: Rx, x: x, fx: Fx });
        // increment function call
        trace.functionCalls++;
    }
    // return residual and Fx
    return [Rx, Fx];
}

/*
 * Iterative Methods for Optimization, Algorithm 3.3.4.
 *
 * Algorithm for testing the trial point
 *
 * f: residual function, f(x), returns vector, size = number of functions xc: current x solution, column vector, size = number of variables fc: residual function evaluated on xc, column vector, size = number of functions jacc: Jacobian matrix evaluated on xc, matrix, size = number of functions (rows) x number of variables (columns) jaccT: transpose of the Jacobian matrix gradc: gradient on xc, column vector, size = number of variables xt: trial point, vector, size = number of variables rt: residual function evaluated on xp, column vector, size = number of functions ft: objective function evaluated ob xp, number v: the Levenberg-Marquardt parameter trace: the trace object if enabled
 *
 * returns: [x, Rx, Fx, v, iteration]
 */
function trtestlm(f: (x: Vector) => Vector, xc: Vector, fc: MathNumericType, jacc: Jacobian, jaccT: JacobianT, gradc: Vector, xt: Vector, rt: Vector, ft: MathNumericType, v: number, n: number, trace?: Trace): [Vector, Vector, MathNumericType, number, number] {
    // initialize z (variable vector)
    let z = xc;
    // iteration index
    let iteration = 0;
    // mu
    const mu0 = 0.1;
    const muLow = 0.25;
    const muHigh = 0.75;
    // w
    const wdown = 0.5;
    const wup = 2.0;
    // v0
    const v0 = 0.001;
    // main loop
    while (z == xc && iteration <= 50) {
        // compute actual reduction ared = f(xc) - f(xt), ared: number
        const ared = subtract(fc, ft);
        // compute st = xt - xc, st: column vector, size = number of variables
        const st = subtract(xt, xc);
        // compute predicted reduction pred = -gc' * st / 2, pred: number
        const pred = -divide(multiply(gradc, st), 2) as number;
        // compute ratio = ared / pred
        const ratio = divide(ared, pred);
        // check ratio
        if (smaller(ratio, mu0)) {
            // compute v
            v = max(wup * v, v0);
            // recompute the trial point with the new value of ν,
            const hc = add(multiply(jaccT, jacc), multiply(identity(n), v)) as number[][];
            xt = subtract(xc, multiply(inv(hc), gradc)) as Vector;
            // evaluate objective function on xt, returns [R(xt), F(xt)], do not pass iteration parameter here!
            [rt, ft] = levmarObjectiveFunction(f, xt, trace, undefined);
        }
        else if (smaller(ratio, muLow)) {
            // set z = xt
            z = xt;
            // compute v
            v = max(v * 2.0, v0);
        }
        else {
            // set z = xt
            z = xt;
            // check ratio
            if (larger(ratio, muHigh)) {
                // compute v
                v = v * wdown;
                // check v
                if (v < v0)
                    v = 0;
            }
        }
        // increase iteration
        iteration++;
    }
    // check iteration
    if (iteration > 50)
        throw new Error('Too many iterations');
    // return
    return [z, rt, ft, v, iteration];
}

interface LevenbergMarquardtOptions {
    tolerance?: number;
    trace?: Trace;
    kmax?: number;
    absoluteThreshold?: number; // absolute threshold for convergence
}

/*
 * Iterative Methods for Optimization, Algorithm 3.3.5.
 *
 * Levenberg-Marquardt algorithm
 *
 * f: residual function, f(x), returns vector, size = number of functions x: initial values, column vector, size = number of variables options: object with the following parameters kmax: maximum number of iteration, optional (default = 100) tolerance: used as termination criteria, evaluating (||gradient|| <= tolerance), optional (default = 1e-6) jacobian: jacobian function, Jac{x}, returns matrix, size = number of functions (rows) x number of variables (columns) traceEnabled: enable algorithm trace
 *
 * returns: array [succeeded, x, trace] succeeded: boolean value indicating if the algorithm converge to a result x: algorithm output variable values trace: algorithm trace, if enabled (see options)
 */
export function levmar(f: (x: Vector) => Vector, x: Vector, options: LevenbergMarquardtOptions) {
    // defaults
    const defaults = {
        kmax: 100,
        tolerance: 1e-6,
        traceEnabled: false,
        absoluteThreshold: 2.220446049250312E-16
    };
    // process options if any
    options = processOptions(options as Record<string, unknown>, defaults);
    // initialize trace
    const initializeTrace = function(trace: Trace): Trace {
        // initialize
        trace.tolerance = trace.tolerance || options.tolerance;
        trace.jacobians = trace.jacobians || [];
        trace.gradients = trace.gradients || [];
        trace.residuals = trace.residuals || [];
        trace.history = trace.history || [];
        trace.functionCalls = trace.functionCalls || 0;
        // return trace
        return trace;
    };
    // initialize trace if needed (use existing trace in options)
    const trace = options.trace ? initializeTrace(options.trace) : undefined;
    // variables vector length
    const n = length(x);
    // function to compute the Jacobian matrix and append trace information if needed
    const computeJacobian = function(f: (x: Vector) => Vector, x: Vector, rx: Vector): Jacobian {
        // evaluate derivative
        const [jacobian] = derivative(f, x, { order: 1, hessian: false, fx: rx });
        // update trace if needed
        if (trace && trace.jacobians)
            trace.jacobians.push({ x: x, jacobian: jacobian });
        // return jacobian
        return jacobian;
    };
    // iteration
    let iteration = 0;
    // initialize xc = x
    let xc = x;
    // store initial values in trace if needed
    if (trace && trace.history)
        trace.history.push(xc);
    // evaluate objective function, returns [R(x), F(xc)]
    let of = levmarObjectiveFunction(f, xc, trace, iteration);
    // R(xc) & F(xc)
    const residual = of[0];
    let fc = of[1];
    // jacobian
    let jacc = computeJacobian(f, xc, residual);
    // some caculations used more than once
    let jaccT = transpose(jacc) as JacobianT;
    // compute gradient J'R, column vector, size = number of variables
    let gradc = multiply(jaccT, residual) as Vector;
    // compute gradient modulus (gradient is a column vector (matrix N x 1), we need to convert it to vector)
    let modulus = norm(flatten(gradc)) as number;
    // store values in trace if needed
    if (trace && trace.gradients)
        trace.gradients.push({ x: xc, gradc: gradc, modulus: modulus });
    // initialize v
    let v = modulus;
    // compute the gradient's modulus (gradient is a column vector (matrix)), check for termination
    while (isFinite(modulus) && modulus > (options.tolerance || 0) && iteration <= (options.kmax || 100)) {
        // increment iteration
        iteration++;
        // compute xt
        const hc = add(multiply(jaccT, jacc), multiply(identity(n), v)) as MathCollection;
        const xt = subtract(xc, multiply(inv(hc), gradc)) as MathCollection;
        // evaluate objective function on xt, return [R(xt), F(xt)]
        of = levmarObjectiveFunction(f, xt, trace, iteration);
        // R(xc) & F(xc)
        let residual = of[0];
        const ft = of[1];
        // invoke trtestlm, return [x, Rx, Fx, v, iteration]
        [x, residual, fc, v] = trtestlm(f, xc, fc, jacc, jaccT, gradc, xt, residual, ft, v, n, trace);
        // update xc
        xc = x;
        // store values in trace if needed
        if (trace && trace.history)
            trace.history.push(xc);
        // evaluate jacobian (central difference used when more precision is needed)
        jacc = computeJacobian(f, xc, residual);
        // update calculations
        jaccT = transpose(jacc);
        // update gradient
        gradc = multiply(jaccT, residual) as Vector;
        // compute gradient modulus (gradient is a column vector (matrix N x 1), we need to convert it to vector)
        modulus = norm(flatten(gradc)) as number;
        // store values in trace if needed
        if (trace && trace.gradients)
            trace.gradients.push({ x: xc, gradc: gradc, modulus: modulus });
    }
    // return x and trace
    return {
        converged: isFinite(modulus) && iteration <= (options.kmax || 100),
        x: x,
        iterations: iteration,
        trace: trace
    };
}
