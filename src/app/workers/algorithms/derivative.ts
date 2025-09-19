import { add, divide, identity, multiply, zeros, subtract, subset, deepEqual, flatten, transpose, index, reshape, concat } from 'mathjs';
import type { MathCollection, MathNumericType } from 'mathjs';
import { Vector, length } from './vector';

// http://gitweb.scilab.org/?p=scilab.git;a=blob;f=scilab/modules/optimization/macros/derivative.sci;h=e6e574d2384bcf5050060bb8e61fd4777d1c7abc;hb=HEAD

const DBL_EPSILON = 2.2204460492503130808472633361816E-16;

export type Jacobian = MathCollection<MathNumericType>;

export type JacobianT = MathCollection<MathNumericType>;

function stepsize(order: number, first: boolean): number {
    // process order
    switch (order) {
        case 1:
            return first ? Math.sqrt(DBL_EPSILON) : Math.pow(DBL_EPSILON, 1 / 3);
        case 2:
            return first ? Math.pow(DBL_EPSILON, 1 / 3) : Math.pow(DBL_EPSILON, 1 / 4);
        case 4:
            return first ? Math.pow(DBL_EPSILON, 1 / 4) : Math.pow(DBL_EPSILON, 1 / 6);
    }
    throw new Error(`Unsupported order: ${order}`);
}

/**
* Calculates the first derivatives by finite differences
*/
export function firstderivative(f: (x: Vector) => Vector, x: Vector, order: number, h: number, q: MathCollection, fx0?: Vector): MathCollection {
    // x dimension (x is a row vector)
    const n = length(x);
    // evaluate function at x (returns column vector)
    const fx = fx0 || f(x);
    // function result dimension (column vector)
    const m = length(fx);
    // result m x n matrix
    let r = undefined as unknown as MathCollection;

    // loop variables
    for (let j = 0; j < n; j++) {
        // create delta vector: zeros with h at position j, follow the q direction
        const delta = subset(zeros(n), index(j), multiply(h, subset(q, index(j, j))));
        // process order
        switch (order) {
            case 1: {
                // evaluate (f(x + h*e_j) - f(x)) / h, reshape it as a column vector matrix (m x 1)
                const df = reshape(divide(subtract(f(add(x, delta)), fx), h) as Vector, [m, 1]);
                // store partial derivatives in result matrix, as column at j
                r = j == 0 ? df : concat(r, df);
                // exit
                break;
            }
            case 2: {
                // evaluate (f(x + h*e_j) - f(x - h*e_j)) / (2*h), reshape it as a column vector matrix (m x 1)
                const df = reshape(divide(subtract(f(add(x, delta)), f(subtract(x, delta))), 2 * h) as Vector, [m, 1]);
                // store partial derivatives in result matrix, as column at j
                r = j == 0 ? df : concat(r, df);
                // exit
                break;
            }
            case 4: {
                // 2 * delta
                const delta2 = multiply(2, delta);
                // evaluate fourth-order central difference
                const fph = f(add(x, delta) as MathCollection);
                const fmh = f(subtract(x, delta) as MathCollection);
                const fp2h = f(add(x, delta2) as MathCollection);
                const fm2h = f(subtract(x, delta2) as MathCollection);
                // (f(x - 2h) - 8*f(x - h) + 8*f(x + h) - f(x + 2h)) / (12*h), reshape it as a column vector matrix (m x 1)
                const df = reshape(divide(  add(subtract(fm2h, multiply(8, fmh)), subtract(multiply(8, fph), fp2h)), multiply(12, h)) as Vector, [m, 1]);
                // store partial derivatives in result matrix, as column at j
                r = j == 0 ? df : concat(r, df);
                // exit
                break;
            }
        }
    }
    return r;
}

interface DerivativeOptions {
    order?: number; // order of the finite differe                                                                                             nces (1, 2, 4), default is 2
    h?: number; // step size
    q?: MathCollection; // directions matrix
    fx?: Vector; // initial function value (performance optimization for order 1 calculations)
    hessian?: boolean; // calculate Hessian
}

export type DerivativeResult = [Jacobian, MathCollection?];

export function derivative(f: (x: Vector) => Vector, x: Vector, options?: DerivativeOptions): DerivativeResult {
    // make sure options is defined
    options = options || {};
    // order of the finite differences (1, 2, 4), default is 2
    const order: number = options.order || 2;
    // step size
    let h = options.h || stepsize(order, true);
    // x dimension (x is a row vector)
    const n = length(x);
    // validate directions matrix if provided
    if (options.q) {
        // directions matrix should be orthogonal
        const q = options.q;
        // q * q' == identity(n)
        if (!deepEqual(multiply(q, transpose(q)), identity(n)))
            throw new Error('Directions matrix is not orthogonal');
    }
    // directions matrix
    const q: MathCollection = options.q || identity(n) as MathCollection;
    // initial function value (performance optimization for order 1 calculations)
    const fx = options.fx;
    // calculate Jacobian
    const J = firstderivative(f, x, order, h, q, fx);
    // check we need to calculate second derivative (Hessian)
    if (options.hessian) {
        // step size
        h = options.h || stepsize(order, false);
        // function to find derivative of
        const hf = (x: Vector): Vector => {
            // calculate first derivative
            const d = firstderivative(f, x, order, h, q);
            // result (column vector of size m * n), where m is the number of rows in Jacobian
            return flatten(d);
        };
        // calculate Hessian
        const H = firstderivative(hf, x, order, h, q);
        // return Jacobian and Hessian
        return [J, H];
    }
    // return Jacobian
    return [J];
}
