import { estimateDerkES } from './estimate-derke-s';
import { estimateDerkS } from './estimate-derk-s';
import { File, Point } from '../../files';
import { Initial } from '../initial';
import { powell } from '../algorithms/powell';
import { ScreenCurrentFeaturePoint } from './screen-current-feature-point';
import { Trace } from '../trace';

const Epsilon = 1e-6;

/**
 * Calculates the approximate first derivative (slope) at point i using the central difference method.
 * f'(x_i) ≈ (y_{i+1} - y_{i-1}) / (x_{i+1} - x_{i-1})
 */
function calculateFirstDerivative(points: Point[], i: number): number | undefined {
    // ensure we have enough points to calculate the derivative
    if (i === 0 || i === points.length - 1) {
        // Cannot calculate central difference for boundary points
        return undefined;
    }
    // central difference formula
    const dy = (points[i + 1].is || 0) - (points[i - 1].is || 0);
    const dx = points[i + 1].ep - points[i - 1].ep;
    // return slope
    return dx !== 0 ? dy / dx : Infinity; // Handle vertical slope
}

/**
 * Calculates the approximate second derivative at point i using the central difference method.
 * f''(x_i) ≈ (y_{i+1} - 2y_i + y_{i-1}) / (Δx^2) - assuming uniform spacing.
 * This implementation uses the first derivative of the first derivative for uneven spacing:
 * f''(x_i) ≈ (f'(x_{i+1}) - f'(x_{i-1})) / (x_{i+1} - x_{i-1})
 *
 * NOTE: For robustness and simplicity with potentially uneven spacing, we can approximate
 * the second derivative using the y-values directly, which is equivalent to applying the
 * central difference formula twice.
 */
function calculateSecondDerivative(points: Point[], i: number): number | undefined {
    // ensure we have enough points to calculate the second derivative
    if (i <= 0 || i >= points.length - 1) {
        // Requires two neighbors on both sides, or use the direct y-value formula.
        // For simplicity, we'll focus on interior points.
        return undefined;
    }
    // y values
    const y_i_plus_1 = points[i + 1].is || 0;
    const y_i = points[i].is || 0;
    const y_i_minus_1 = points[i - 1].is || 0;
    // x values
    const x_i_plus_1 = points[i + 1].ep;
    const x_i_minus_1 = points[i - 1].ep;
    // a simple, robust approximation for uneven spacing
    const dy2 = y_i_plus_1 - 2 * y_i + y_i_minus_1;
    const dx_squared_approx = (x_i_plus_1 - points[i].ep) * (points[i].ep - x_i_minus_1);
    // return second derivative
    return dx_squared_approx !== 0 ? dy2 / dx_squared_approx : Infinity;
}

export function findScreenCurrentFeaturePointsInSeries(points: Point[], egOffset: number): ScreenCurrentFeaturePoint[] {
    // inflection points to use
    const featurePoints: ScreenCurrentFeaturePoint[] = [];
    // 1. Calculate and store first derivatives for all points
    const firstDerivatives: (number | undefined)[] = points.map((_, i) => calculateFirstDerivative(points, i));
    // 2. Calculate and store second derivatives for all points
    const secondDerivatives: (number | undefined)[] = points.map((_, i) => calculateSecondDerivative(points, i));
    // loop from 1 to length - 1
    for (let i = 1; i < points.length - 1; i++) {
        // derivatives
        const d1_i = firstDerivatives[i];
        const d2_i = secondDerivatives[i];
        // validate both derivatives exist
        if (d1_i === undefined || d2_i === undefined)
            continue;
        // --- A. Local Minimum Detection (First Derivative Test) ---
        // For secondary emission, screen current has a LOCAL MINIMUM at the crossover point
        // A local min occurs where the first derivative changes sign from (-) to (+)
        const d1_prev = firstDerivatives[i - 1];
        const d1_next = firstDerivatives[i + 1];
        // validate derivatives exist
        if (d1_prev !== undefined && d1_next !== undefined) {
            // Check if slope changes from negative to positive (minimum)
            if (d1_prev < -Epsilon && d1_next > Epsilon) {
                // point at local minimum (secondary emission crossover)
                const point = points[i];
                // append minimum point as feature point
                featurePoints.push({
                    type: 'Local Minimum',
                    epmax: point.ep,
                    eg: point.eg + egOffset,
                    is: point.is || 0,
                    ip: point.ip,
                    ep: point.ep,
                    es: point.es || 0
                });
                // continue to next point
                continue;
            }
            // Check if slope changes from positive to negative (maximum)
            if (d1_prev > Epsilon && d1_next < -Epsilon) {
                // point at local maximum
                const point = points[i];
                // append maximum point as feature point
                featurePoints.push({
                    type: 'Local Maximum',
                    epmax: point.ep,
                    eg: point.eg + egOffset,
                    is: point.is || 0,
                    ip: point.ip,
                    ep: point.ep,
                    es: point.es || 0
                });
                // continue to next point
                continue;
            }
        }
        // --- B. Inflection Point Detection (Second Derivative Test) ---
        // An inflection point occurs where the second derivative changes sign.
        // We check the sign change between d2_i and d2_{i-1}.
        const d2_prev = secondDerivatives[i - 1];
        // validate previous second derivative exists
        if (d2_prev !== undefined) {
            // Check for sign change in the second derivative (concavity change)
            if ((d2_prev < -Epsilon && d2_i > Epsilon) || (d2_prev > Epsilon && d2_i < -Epsilon)) {
                // Inflection point is detected *between* points i-1 and i
                // For reporting, we can use the current point 'i' as an approximation
                featurePoints.push({
                    type: 'Inflection Point',
                    epmax: points[i].ep,
                    eg: points[i].eg + egOffset,
                    is: points[i].is || 0,
                    ip: points[i].ip,
                    ep: points[i].ep,
                    es: points[i].es || 0
                });
            }
        }
    }
    return featurePoints;
}

function findScreenCurrentFeaturePoints(files: File[]): ScreenCurrentFeaturePoint[] {
    // inflection points to use
    const featurePoints: ScreenCurrentFeaturePoint[] = [];
    // loop all files
    for (const file of files) {
        // check measurement type where Va (ep) is on the X-axis and screen current (is) is present
        if (file.measurementType === 'IPIS_VA_VG_VS_VH' || file.measurementType === 'IPIS_VA_VS_VG_VH' || file.measurementType === 'IPIS_VAVS_VG_VH') {
            // loop series
            for (const series of file.series) {
                // we require at least 3 points to find inflection or local max
                if (series.points.length < 3)
                    continue;
                // series points must be sorted by the X axis (EP)
                series.points.sort((p1, p2) => p1.ep - p2.ep);
                // find feature points in series
                const seriesFeaturePoints = findScreenCurrentFeaturePointsInSeries(series.points, file.egOffset);
                // append to main feature points
                featurePoints.push(...seriesFeaturePoints);
            }
        }
    }
    return featurePoints;
}

// estimateSecondaryEmissionParameters
export const estimateSecondaryEmissionParameters = function (initial: Initial, files: File[], secondaryEmission: boolean, estimateS: typeof estimateDerkS | typeof estimateDerkES, trace?: Trace) {
    // check secondaryEmission is enabled
    if (!secondaryEmission) {
        // set secondary emission parameters to zero
        initial.s = 0;
        initial.alphaP = 0;
        initial.lambda = 0;
        initial.v = 0;
        initial.w = 0;
        // exit
        return;
    }
    // initialize trace if needed
    if (trace) {
        // estimates
        trace.estimates = trace.estimates || {};
        trace.estimates.secondaryEmission = {};
    }
    // lambda (lambda = mu)
    initial.lambda = initial.lambda || initial.mu;
    // alphaP
    initial.alphaP = initial.alphaP || 0.2;
    // estimate v, w & s if needed
    if (!initial.v || !initial.w || !initial.s) {
        // find feature points
        const screenCurrentFeaturePoints = findScreenCurrentFeaturePoints(files);
        // update trace
        if (trace?.estimates?.secondaryEmission)
            trace.estimates.secondaryEmission.screenCurrentFeaturePoints = screenCurrentFeaturePoints;
        // check we need to estimate v or w
        if (!initial.v || !initial.w) {
            // check we detected feature points in screen current
            if (screenCurrentFeaturePoints.length === 0) {
                // estimate v & w as zero
                initial.v = 0;
                initial.w = 0;
                // estimate S
                estimateS(initial, screenCurrentFeaturePoints, trace);
                // exit
                return;
            }
            // least squares function
            const leastSquares = function(x: number[]) {
                // get parameters
                const v = Math.abs(x[0]);
                const w = Math.abs(x[1]);
                // result
                let r = 0;
                // loop screenCurrentFeaturePoints
                for (const p of screenCurrentFeaturePoints) {
                    // difference
                    const d = -p.epmax + p.es / (initial.lambda || 1) - v * p.eg - w;
                    // update r
                    r += d * d;
                }
                return r;
            };
            // optimize leastSquares
            const result = powell([0, 0], leastSquares, {
                iterations: 500,
                traceEnabled: false,
                relativeThreshold: 1e-4,
                absoluteThreshold: 2.220446049250312e-16
            });
            // check result
            if (result.converged) {
                // set initial values
                initial.v = Math.abs(result.x[0]);
                initial.w = Math.abs(result.x[1]);
            }
            else {
                // set initial values
                initial.v = 0;
                initial.w = 0;
            }
        }
        // estimate S
        estimateS(initial, screenCurrentFeaturePoints, trace);
    }
};
