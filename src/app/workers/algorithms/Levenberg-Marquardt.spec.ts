import { levmar } from './Levenberg-Marquardt';
import { valueAt, Vector } from './vector';

describe('algorithms / Levenberg-Marquardt', () => {

    const defaultOptions = {
        tolerance: 1e-6,
        kmax: 100,
        absoluteThreshold: 2.220446049250312E-16
    };

    it('should solve a simple linear least squares problem', () => {
        // arrange - simple quadratic function: f(x) = x^2 - 4
        // We want to find x such that f(x) = 0, so x = ±2
        // Starting from x = 1, we should converge to x = 2

        // residual function: r(x) = [x^2 - 4]
        const residualFunction = (params: Vector): Vector => {
            const x = valueAt(params, 0) as unknown as number;
            return [x * x - 4];
        };

        const initialGuess = [1.0]; // initial guess

        // act
        const result = levmar(residualFunction, initialGuess, defaultOptions);

        // assert
        expect(result.converged).toBe(true);
        const solution = valueAt(result.x, 0) as unknown as number;
        expect(Math.abs(solution)).toBeCloseTo(2.0, 4); // should be close to ±2
    });

    it('should solve a 2-parameter linear regression problem', () => {
        // arrange - fit y = a*x to single data point (2, 6)
        // Expected: a = 3

        // residual function: r(a) = [a*2 - 6]
        const residualFunction = (params: Vector): Vector => {
            const a = valueAt(params, 0) as unknown as number;
            return [a * 2 - 6];
        };

        const initialGuess = [1.0]; // initial guess for 'a'

        // act
        const result = levmar(residualFunction, initialGuess, defaultOptions);

        // assert
        expect(result.converged).toBe(true);
        const paramA = valueAt(result.x, 0) as unknown as number;
        expect(paramA).toBeCloseTo(3.0, 4); // parameter 'a' should be close to 3
    });

    it('should solve a system of nonlinear equations with 2 variables and 2 residuals', () => {
        // arrange - solve system of equations:
        // a² + b² = 5
        // a - b = 1
        // Expected solution: a = 2, b = 1 (or a = -1, b = -2)

        // residual function: r(a,b) = [a² + b² - 5, a - b - 1]
        const residualFunction = (params: Vector): Vector => {
            const a = valueAt(params, 0) as unknown as number;
            const b = valueAt(params, 1) as unknown as number;

            const r1 = a * a + b * b - 5;  // a² + b² - 5 = 0
            const r2 = a - b - 1;          // a - b - 1 = 0

            // Return as column vector using matrix function
            return [r1, r2];
        };

        const initialGuess = [1.5, 0.5]; // initial guess close to solution [2, 1]

        // act
        const result = levmar(residualFunction, initialGuess, defaultOptions);

        // assert
        expect(result.converged).toBe(true);
        const paramA = valueAt(result.x, 0) as unknown as number;
        const paramB = valueAt(result.x, 1) as unknown as number;
        expect(paramA).toBeCloseTo(2.0, 4); // parameter 'a' should be close to 2
        expect(paramB).toBeCloseTo(1.0, 4); // parameter 'b' should be close to 1

        // verify the solution satisfies the original equations
        expect(paramA * paramA + paramB * paramB).toBeCloseTo(5.0, 4); // a² + b² = 5
        expect(paramA - paramB).toBeCloseTo(1.0, 4); // a - b = 1
    });

    it('should solve a 3-parameter optimization problem with 2 residuals', () => {
        // arrange - solve system where we want:
        // x² + y² + z² = 14 (target value)
        // xy + yz + xz = 11 (target value)
        // Known solution: x=1, y=2, z=3 satisfies: 1+4+9=14 and 2+6+3=11

        // residual function: r(x,y,z) = [x²+y²+z²-14, xy+yz+xz-11]
        const residualFunction = (params: Vector): Vector => {
            const x = valueAt(params, 0) as unknown as number;
            const y = valueAt(params, 1) as unknown as number;
            const z = valueAt(params, 2) as unknown as number;

            const r1 = x * x + y * y + z * z - 14;  // x² + y² + z² - 14 = 0
            const r2 = x * y + y * z + x * z - 11;  // xy + yz + xz - 11 = 0

            return [r1, r2];
        };

        const initialGuess = [0.8, 1.8, 2.8]; // initial guess close to solution [1, 2, 3]

        // act
        const result = levmar(residualFunction, initialGuess, defaultOptions);

        // assert
        expect(result.converged).toBe(true);
        const paramX = valueAt(result.x, 0) as unknown as number;
        const paramY = valueAt(result.x, 1) as unknown as number;
        const paramZ = valueAt(result.x, 2) as unknown as number;
        expect(paramX).toBeCloseTo(1.0, 3); // parameter 'x' should be close to 1
        expect(paramY).toBeCloseTo(2.0, 3); // parameter 'y' should be close to 2
        expect(paramZ).toBeCloseTo(3.0, 3); // parameter 'z' should be close to 3

        // verify the solution satisfies the original equations
        expect(paramX * paramX + paramY * paramY + paramZ * paramZ).toBeCloseTo(14.0, 3); // x² + y² + z² = 14
        expect(paramX * paramY + paramY * paramZ + paramX * paramZ).toBeCloseTo(11.0, 3); // xy + yz + xz = 11
    });
});
