import { Trace } from '../trace';
import { sign } from 'mathjs';

function initializeTrace(trace?: Trace) {
    // trace
    const result: Trace = {
        iterations: trace?.iterations || 0,
        history: trace?.history || [],
        functionValues: trace?.functionValues || [],
        estimates: trace?.estimates || {},
        residuals: trace?.residuals || [],
        jacobians: trace?.jacobians || [],
        functionCalls: trace?.functionCalls || 0,
        tolerance: trace?.tolerance || 0,
    };
    return result;
}

function initialDirections(n: number): number[][] {
    // initialize xi
    const xi: number[][] = [];
    // loop dimensions
    for (let i = 0; i < n; i++) {
        // initialize row
        xi[i] = [];
        // loop dimensions
        for (let j = 0; j < n; j++)
            // set value
            xi[i][j] = i == j ? 1 : 0;
    }
    return xi;
}

export interface PowellOptions {
    relativeThreshold: number;
    absoluteThreshold: number;
    iterations: number;
    traceEnabled: boolean;
    trace?: Trace;
}

const processOptions = (options: PowellOptions, defaults: PowellOptions): PowellOptions => {
    // result
    const result: PowellOptions = {
        relativeThreshold: options.relativeThreshold || defaults.relativeThreshold,
        absoluteThreshold: options.absoluteThreshold || defaults.absoluteThreshold,
        iterations: options.iterations || defaults.iterations,
        traceEnabled: options.traceEnabled || defaults.traceEnabled,
        trace: options.trace || defaults.trace,
    };
    return result;
};

/**
 * Routine for initially Bracketing a Minimum
 *
 * Given two points (ax, bx) searches in the downhill direction and returns new points
 * (ax, bx, cx) that bracket the minimum of the function.
 *
 * Numerical Recipes in C, Chapter 10.1
 * http://apps.nrbook.com/c/index.html
 */
function mnbrak(ax: number, bx: number, f: (x: number) => number): { ax: number; bx: number; cx: number } {
    // default ratio by which seccessive intervals are magnified
    const gold = 1.618034;
    const tiny = 1e-20;
    // maximum magnification allowed for a parabolic-fit step
    const glimit = 100.0;
    // evaluate functions
    let fax = f(ax);
    let fbx = f(bx);
    // compare function values
    if (fbx > fax) {
        // swap ax, bx
        [ax, bx] = [bx, ax];
        // swap fax, fbx
        [fbx, fax] = [fax, fbx];
    }
    // calculate cx (guess)
    let cx = bx + gold * (bx - ax);
    // evaluate function
    let fcx = f(cx);
    // loop state
    let u, fu;
    // loop until we bracket
    while (fbx > fcx) {
        // compute u by parabolic extrapolation from a, b, c.
        const r = (bx - ax) * (fbx - fcx);
        const q = (bx - cx) * (fbx - fax);
        const qr = q - r;
        u = bx - ((bx - cx) * q - (bx - ax) * r) / (2 * sign(qr) * Math.max(Math.abs(qr), tiny));
        const ulim = bx + glimit * (cx - bx);
        // check parabolic u is between b and c
        if ((bx - u) * (u - cx) > 0.0) {
            // evaluate function
            fu = f(u);
            // check where is the minimum
            if (fu < fcx) {
                // minimum is between b and c
                ax = bx;
                bx = u;
                fax = fbx;
                fbx = fu;
                // exit
                break;
            }
            else if (fu > fbx) {
                // minimum is between a and u
                cx = u;
                fcx = fu;
                // exit
                break;
            }
            // parabolic fit was no use, use default magnification
            u = cx + gold * (cx - bx);
            fu = f(u);
        }
        else if ((cx - u) * (u - ulim) > 0.0) {
            // evaluate function
            fu = f(u);
            if (fu < fcx) {
                // change values
                bx = cx;
                cx = u;
                u = cx + gold * (cx - bx);
                // change function values
                fbx = fcx;
                fcx = fu;
                fu = f(u);
            }
        }
        else if ((u - ulim) * (ulim - cx) >= 0.0) {
            // update u
            u = ulim;
            // evaluate function
            fu = f(u);
        }
        else {
            // recalculate u
            u = cx + gold * (cx - bx);
            // evaluate function
            fu = f(u);
        }
        // eliminate oldest point and continue
        ax = bx;
        bx = cx;
        cx = u;
        fax = fbx;
        fbx = fcx;
        fcx = fu;
    }
    return {
        ax: ax,
        bx: bx,
        cx: cx,
    };
}

/**
 * Given a function f and a bracketing triplet of abscissas ax, bx, cx (such that bx is between ax and cx, and f(bx) is less than
 * both f(ax) and f(cx)), this routine isolates the minimum to a fractional precision of about tol using Brent's method.
 *
 * Numerical Recipes in C, Chapter 10.2
 * http://apps.nrbook.com/c/index.html
 */
function brent(ax: number, bx: number, cx: number, f: (x: number) => number, tol: number): { xmin: number; fx: number } {
    // options
    const iterations = 500;
    // const
    const zeps = 1e-10;
    const cgold = 0.381966;
    // distance moved from the step before last
    let e = 0.0;
    // a and b must be in descending order
    let a = Math.min(ax, cx);
    let b = Math.max(ax, cx);
    // loop state
    let x = bx,
        w = bx,
        v = bx;
    let fx = f(x);
    let fw = fx,
        fv = fx;
    let d = e;
    // loop
    for (let iteration = 1; iteration < iterations; ++iteration) {
        const xm = 0.5 * (a + b);
        const tol1 = tol * Math.abs(x) + zeps;
        const tol2 = 2 * tol1;
        // test for completion
        if (Math.abs(x - xm) <= tol2 - 0.5 * (b - a)) {
            // return minimum and function value
            return {
                xmin: x,
                fx: fx,
            };
        }
        // construct parabolic fit
        if (Math.abs(e) > tol1) {
            const r = (x - w) * (fx - fv);
            let q = (x - v) * (fx - fw);
            let p = (x - v) * q - (x - w) * r;
            q = 2 * (q - r);
            if (q > 0)
                p = -p;
            q = Math.abs(q);
            const etemp = e;
            e = d;
            // check parabolic fit
            if (Math.abs(p) >= Math.abs(0.5 * q * etemp) || p <= q * (a - x) || p >= q * (b - x)) {
                e = x > xm ? a - x : b - x;
                d = cgold * e;
            }
            else {
                d = p / q;
                const u = x + d;
                if (u - a < tol2 || b - u < tol2) d = sign(xm - x) * tol1;
            }
        }
        else {
            e = x >= xm ? a - x : b - x;
            d = cgold * e;
        }
        const u = Math.abs(d) >= tol1 ? x + d : x + sign(d) * tol1;
        // function evaluation
        const fu = f(u);
        if (fu <= fx) {
            if (u >= x)
                a = x;
            else
                b = x;
            // shift values
            v = w;
            w = x;
            x = u;
            // shift function values
            fv = fw;
            fw = fx;
            fx = fu;
        }
        else {
            if (u < x)
                a = u;
            else
                b = u;
            if (fu <= fw || w == x) {
                v = w;
                w = u;
                fv = fw;
                fw = fu;
            }
            else if (fu <= fv || v == x || v == w) {
                v = u;
                fv = fu;
            }
        }
    }
    throw 'Too many iterations in brent';
}

/**
 * Given an n-dimensional point p and an n-dimensional direction xi, moves and resets p to where the function f(p)
 * takes a minimum along the direction xi from p and replaces xi by the actual vector displacement that p was moved.
 * Also returns the function value at the returned location p.
 *
 * Numerical Recipes in C, Chapter 10.5
 * http://apps.nrbook.com/c/index.html
 */
function linmin(p: number[], xi: number[], n: number, f: (x: number[]) => number) {
    // options
    const brentTolerance = 2.0e-4;
    // global variables
    const pcom: number[] = [];
    const xicom: number[] = [];
    // copy initial point and matrix with directions
    for (let j = 0; j < n; j++) {
        pcom[j] = p[j];
        xicom[j] = xi[j];
    }
    // function in one dimension
    const f1dim = function (x: number) {
        // initialize xt
        const xt: number[] = [];
        // loop dimensions
        for (let k = 0; k < n; k++) {
            // compute xt
            xt[k] = pcom[k] + x * xicom[k];
        }
        // evaluate function
        return f(xt);
    };
    // invoke mnbrak
    const { ax, bx, cx } = mnbrak(0, 1, f1dim);
    // invoke brent
    const r = brent(ax, bx, cx, f1dim, brentTolerance);
    // minimum
    const xmin: number = r.xmin;
    // construct vector result (updates p and xi)
    for (let j = 0; j < n; j++) {
        xi[j] *= xmin;
        p[j] += xi[j];
    }
    return r.fx;
}

export interface PowellResult {
    converged: boolean;
    x: number[];
    fx: number;
    iterations: number;
    trace?: Trace;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    warn?: any;
}

// defaults
export const DefaultPowellOptions = {
    relativeThreshold: 1e-6,
    absoluteThreshold: 2.220446049250312e-16,
    iterations: 100,
    traceEnabled: false,
};


/**
 * p: initial starting point (vector, size n)
 * xi: initial matrix whose columns contains the initial set of directions (matrix, n X n)
 * n: number of dimensions (variables)
 * ftol: fractional tolerance in the function value
 * f: function to minimize (f(x) where x is a vector)
 *
 * http://apps.nrbook.com/c/index.html
 */
export const powell = (p: number[], f: (x: number[]) => number, options: PowellOptions): PowellResult => {
    // dimensions
    const n = p.length;
    // initial directions
    let xi: number[][] = initialDirections(n);
    // process options if any
    options = processOptions(options, DefaultPowellOptions);
    // initialize trace if needed (use existing trace in options)
    const trace = options.traceEnabled ? initializeTrace(options.trace) : undefined;
    // evaluate f(p)
    let fret = f(p);
    // copy of initial point
    const pt: number[] = [];
    for (let j = 0; j < n; j++)
        pt[j] = p[j];
    // iteration
    let iteration = 0;
    // vector
    const xit = [];
    try {
        // iterate
        while (iteration <= options.iterations) {
            // increment iterator
            iteration++;
            // store fret
            const fp = fret;
            // direction of the largest decrease
            let ibig = 0;
            // delta
            let delta = 0.0;
            // loop over all directions in the set
            for (let i = 0; i < n; i++) {
                // copy direction
                for (let j = 0; j < n; j++)
                    xit[j] = xi[j][i];
                // store function value
                const fptt = fret;
                // minimize
                fret = linmin(p, xit, n, f);
                // record it if it is the largest decrease so far
                if (fptt - fret > delta) {
                    delta = fptt - fret;
                    ibig = i + 1;
                }
            }
            // check trace
            if (trace) {
                // store current values in trace if needed, slice will create a copy of the array
                trace.history.push(p.slice(0));
                // store initial function values in trace if needed
                trace.functionValues.push(fret);
            }
            // check for termination criteria
            if (2 * (fp - fret) <= options.relativeThreshold * (Math.abs(fp) + Math.abs(fret)) + options.absoluteThreshold) {
                // update trace if needed
                if (trace) trace.iterations += iteration;
                // return output parameters
                return {
                    converged: true,
                    x: p,
                    fx: fret,
                    iterations: iteration,
                    trace: trace,
                };
            }
            // extrapolated point
            const ptt: number[] = [];
            // construct the extrapolated point and the average direction moved
            for (let j = 0; j < n; j++) {
                ptt[j] = 2.0 * p[j] - pt[j];
                xit[j] = p[j] - pt[j];
                // save the old starting point
                pt[j] = p[j];
            }
            // evaluate function f(ptt)
            const fptt = f(ptt);
            // check value was reduced
            if (fptt < fp) {
                const t = 2.0 * (fp - 2.0 * fret + fptt) * (fp - fret - delta) * (fp - fret - delta) - delta * (fp - fptt) * (fp - fptt);
                if (t < 0.0) {
                    // move to the minimum in the new direction
                    fret = linmin(p, xit, n, f);
                    // save new direction
                    for (let w = 0; w < n; w++) {
                        xi[w][ibig - 1] = xi[w][n - 1];
                        xi[w][n - 1] = xit[w];
                    }
                }
            }
            // reset directions if needed
            if (iteration % n === 0)
                xi = initialDirections(n);
        }
    }
    catch (e) {
        // update trace if needed
        if (trace) trace.iterations += iteration;
        // return
        return {
            converged: false,
            iterations: iteration,
            trace: trace,
            warn: e,
            x: p,
            fx: fret,
        };
    }
    // update trace if needed
    if (trace)
        trace.iterations += iteration;
    // return
    return {
        converged: false,
        iterations: iteration,
        trace: trace,
        x: p,
        fx: fret,
    };
};
