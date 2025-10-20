import { powell } from './powell';

describe('algorithms / powell', () => {
    const defaultOptions = {
        relativeThreshold: 1e-6,
        absoluteThreshold: 1e-6,
        tolerance: 1e-6,
        iterations: 1000,
        traceEnabled: false,
    };

    describe('Basic Functionality', () => {

        it('should find the minimum of a simple quadratic function', () => {
            // arrange
            const quadratic = (x: number[]) => x[0] * x[0] + x[1] * x[1];
            const quadraticMinimum = [0, 0];
            const quadraticStart = [1, 1];
            // act
            const result = powell(quadraticStart, quadratic, defaultOptions);
            // assert
            expect(result.converged).toBe(true);
            expect(result.fx).toBeCloseTo(quadratic(quadraticMinimum), 5);
            expect(result.x[0]).toBeCloseTo(quadraticMinimum[0], 5);
            expect(result.x[1]).toBeCloseTo(quadraticMinimum[1], 5);
        });

        it('should find the minimum of the Rosenbrock function', () => {
            // arrange
            const rosenbrock = (x: number[]) => {
                const a = 1;
                const b = 100;
                return (a - x[0]) ** 2 + b * (x[1] - x[0] ** 2) ** 2;
            };
            const rosenbrockMinimum = [1, 1];
            const rosenbrockStart = [-1.2, 1];
            // act
            const result = powell(rosenbrockStart, rosenbrock, defaultOptions);
            // assert
            expect(result.converged).toBe(true);
            // Rosenbrock is challenging - accepts slightly lower precision
            expect(result.fx).toBeCloseTo(rosenbrock(rosenbrockMinimum), 4);
            expect(result.x[0]).toBeCloseTo(rosenbrockMinimum[0], 1);
            expect(result.x[1]).toBeCloseTo(rosenbrockMinimum[1], 1);
        });

        it("should find one of the minima of Himmelblau's function", () => {
            // arrange
            const himmelblau = (x: number[]) => (x[0] ** 2 + x[1] - 11) ** 2 + (x[0] + x[1] ** 2 - 7) ** 2;
            const himmelblauMinimum1 = [3, 2];
            const himmelblauStart1 = [0, 0];
            // act
            const result = powell(himmelblauStart1, himmelblau, defaultOptions);
            // assert
            expect(result.converged).toBe(true);
            expect(result.fx).toBeCloseTo(himmelblau(himmelblauMinimum1), 5);
            expect(result.x[0]).toBeCloseTo(himmelblauMinimum1[0], 5);
            expect(result.x[1]).toBeCloseTo(himmelblauMinimum1[1], 5);
        });

        it('should work with 1-dimensional functions', () => {
            // arrange
            const f1d = (x: number[]) => (x[0] - 3) ** 2;
            const start = [0];
            // act
            const result = powell(start, f1d, defaultOptions);
            // assert
            expect(result.converged).toBe(true);
            expect(result.x[0]).toBeCloseTo(3, 5);
            expect(result.fx).toBeCloseTo(0, 5);
        });

        it('should work with 3-dimensional functions', () => {
            // arrange
            const f3d = (x: number[]) => (x[0] - 1) ** 2 + (x[1] - 2) ** 2 + (x[2] - 3) ** 2;
            const start = [0, 0, 0];
            // act
            const result = powell(start, f3d, defaultOptions);
            // assert
            expect(result.converged).toBe(true);
            expect(result.x[0]).toBeCloseTo(1, 5);
            expect(result.x[1]).toBeCloseTo(2, 5);
            expect(result.x[2]).toBeCloseTo(3, 5);
            expect(result.fx).toBeCloseTo(0, 5);
        });

        it('should work with 5-dimensional functions', () => {
            // arrange
            const f5d = (x: number[]) => {
                let sum = 0;
                for (let i = 0; i < 5; i++) {
                    sum += (x[i] - (i + 1)) ** 2;
                }
                return sum;
            };
            const start = [0, 0, 0, 0, 0];
            // act
            const result = powell(start, f5d, defaultOptions);
            // assert
            expect(result.converged).toBe(true);
            for (let i = 0; i < 5; i++) {
                expect(result.x[i]).toBeCloseTo(i + 1, 4);
            }
            expect(result.fx).toBeCloseTo(0, 5);
        });
    });

    describe('Convergence Criteria', () => {

        it('should converge with relative threshold', () => {
            // arrange
            const f = (x: number[]) => x[0] ** 2 + x[1] ** 2;
            const start = [10, 10];
            const options = { ...defaultOptions, relativeThreshold: 1e-4, absoluteThreshold: 0 };
            // act
            const result = powell(start, f, options);
            // assert
            expect(result.converged).toBe(true);
            expect(result.fx).toBeLessThan(1e-3);
        });

        it('should converge with absolute threshold', () => {
            // arrange
            const f = (x: number[]) => x[0] ** 2 + x[1] ** 2;
            const start = [0.01, 0.01];
            const options = { ...defaultOptions, relativeThreshold: 0, absoluteThreshold: 1e-6 };
            // act
            const result = powell(start, f, options);
            // assert
            expect(result.converged).toBe(true);
        });

        it('should handle functions near zero', () => {
            // arrange
            const f = (x: number[]) => (x[0] - 0.0001) ** 2 + (x[1] - 0.0001) ** 2;
            const start = [1, 1];
            // act
            const result = powell(start, f, defaultOptions);
            // assert
            expect(result.converged).toBe(true);
            expect(result.x[0]).toBeCloseTo(0.0001, 4);
            expect(result.x[1]).toBeCloseTo(0.0001, 4);
        });

        it('should respect iteration limit', () => {
            // arrange
            const f = (x: number[]) => x[0] ** 2 + x[1] ** 2;
            const start = [100, 100];
            const options = { ...defaultOptions, iterations: 5 };
            // act
            const result = powell(start, f, options);
            // assert
            expect(result.iterations).toBeLessThanOrEqual(options.iterations + 1);
        });
    });

    describe('Direction Replacement and Reset', () => {

        it('should handle direction replacement correctly', () => {
            // arrange - function where direction replacement is triggered
            const f = (x: number[]) => 100 * (x[1] - x[0] ** 2) ** 2 + (1 - x[0]) ** 2;
            const start = [-1, 2];
            // act
            const result = powell(start, f, defaultOptions);
            // assert
            expect(result.converged).toBe(true);
            expect(result.x[0]).toBeCloseTo(1, 1);
            expect(result.x[1]).toBeCloseTo(1, 1);
        });

        it('should handle multiple direction resets (iterations > n)', () => {
            // arrange - function requiring many iterations
            const f = (x: number[]) => {
                let sum = 0;
                for (let i = 0; i < x.length - 1; i++) {
                    sum += 100 * (x[i + 1] - x[i] ** 2) ** 2 + (1 - x[i]) ** 2;
                }
                return sum;
            };
            const start = [-1, -1, -1];
            const options = { ...defaultOptions, iterations: 200 };
            // act
            const result = powell(start, f, options);
            // assert
            expect(result.converged).toBe(true);
            expect(result.x[0]).toBeCloseTo(1, 3);
            expect(result.x[1]).toBeCloseTo(1, 3);
            expect(result.x[2]).toBeCloseTo(1, 3);
        });

        it('should handle case where largest decrease is in last direction', () => {
            // arrange - function where last direction gives largest decrease
            const f = (x: number[]) => x[0] ** 2 + 100 * x[1] ** 2;
            const start = [1, 10];
            // act
            const result = powell(start, f, defaultOptions);
            // assert
            expect(result.converged).toBe(true);
            expect(result.x[0]).toBeCloseTo(0, 5);
            expect(result.x[1]).toBeCloseTo(0, 5);
        });
    });

    describe('Edge Cases and Robustness', () => {

        it('should handle already optimal starting point', () => {
            // arrange
            const f = (x: number[]) => x[0] ** 2 + x[1] ** 2;
            const start = [0, 0];
            // act
            const result = powell(start, f, defaultOptions);
            // assert
            expect(result.converged).toBe(true);
            expect(result.x[0]).toBeCloseTo(0, 5);
            expect(result.x[1]).toBeCloseTo(0, 5);
        });

        it('should handle flat regions', () => {
            // arrange - function with flat region
            const f = (x: number[]) => {
                const r = Math.sqrt(x[0] ** 2 + x[1] ** 2);
                return r < 0.5 ? 0 : (r - 0.5) ** 2;
            };
            const start = [2, 2];
            const options = { ...defaultOptions, iterations: 200 };
            // act
            const result = powell(start, f, options);
            // assert
            expect(result.fx).toBeLessThan(0.1);
        });

        it('should handle functions with negative minimum values', () => {
            // arrange
            const f = (x: number[]) => -(x[0] ** 2 + x[1] ** 2) + 10;
            const start = [0, 0];
            const options = { ...defaultOptions, iterations: 200 };
            // act
            const result = powell(start, f, options);
            // assert
            // Algorithm may not converge for minimizing a function that has maximum at start point
            // This tests behavior when function increases in all directions from start
            expect(result.fx).toBeCloseTo(10, 5);
        });

        it('should handle anisotropic functions', () => {
            // arrange - function with very different scales in different directions
            const f = (x: number[]) => x[0] ** 2 + 10000 * x[1] ** 2;
            const start = [1, 1];
            const options = { ...defaultOptions, iterations: 200 };
            // act
            const result = powell(start, f, options);
            // assert
            expect(result.converged).toBe(true);
            expect(result.x[0]).toBeCloseTo(0, 3);
            expect(result.x[1]).toBeCloseTo(0, 3);
        });

        it('should mutate the original starting point array', () => {
            // arrange
            const f = (x: number[]) => x[0] ** 2 + x[1] ** 2;
            const start = [5, 5];
            const originalStart = [...start];
            // act
            powell(start, f, defaultOptions);
            // assert - starting point is mutated (this is the actual behavior)
            // Note: This test documents the current behavior where p is mutated
            expect(start).not.toEqual(originalStart);
        });
    });

    describe('Trace Functionality', () => {

        it('should populate trace when enabled', () => {
            // arrange
            const f = (x: number[]) => x[0] ** 2 + x[1] ** 2;
            const start = [5, 5];
            const options = { ...defaultOptions, traceEnabled: true };
            // act
            const result = powell(start, f, options);
            // assert
            expect(result.trace).toBeDefined();
            expect(result.trace!.history.length).toBeGreaterThan(0);
            expect(result.trace!.functionValues.length).toBeGreaterThan(0);
            expect(result.trace!.history.length).toBe(result.trace!.functionValues.length);
            expect(result.trace!.iterations).toBeGreaterThan(0);
        });

        it('should not populate trace when disabled', () => {
            // arrange
            const f = (x: number[]) => x[0] ** 2 + x[1] ** 2;
            const start = [5, 5];
            const options = { ...defaultOptions, traceEnabled: false };
            // act
            const result = powell(start, f, options);
            // assert
            expect(result.trace).toBeUndefined();
        });

        it('should show decreasing function values in trace', () => {
            // arrange
            const f = (x: number[]) => x[0] ** 2 + x[1] ** 2;
            const start = [10, 10];
            const options = { ...defaultOptions, traceEnabled: true };
            // act
            const result = powell(start, f, options);
            // assert
            expect(result.trace).toBeDefined();
            const values = result.trace!.functionValues;
            for (let i = 1; i < values.length; i++) {
                expect(values[i]).toBeLessThanOrEqual(values[i - 1]);
            }
        });

        it('should preserve existing trace data when continuing optimization', () => {
            // arrange
            const f = (x: number[]) => x[0] ** 2 + x[1] ** 2;
            const start = [10, 10];
            const existingTrace = {
                iterations: 5,
                history: [[8, 8]],
                functionValues: [128],
                estimates: {},
                residuals: [],
                jacobians: [],
                functionCalls: 10,
                tolerance: 1e-6,
            };
            const options = { ...defaultOptions, traceEnabled: true, trace: existingTrace };
            // act
            const result = powell(start, f, options);
            // assert
            expect(result.trace).toBeDefined();
            expect(result.trace!.iterations).toBeGreaterThan(5);
            expect(result.trace!.history.length).toBeGreaterThan(1);
            // First history entry should be from existing trace
            const firstHistory = result.trace!.history[0] as number[];
            expect(firstHistory[0]).toBe(8);
            expect(firstHistory[1]).toBe(8);
            expect(result.trace!.functionValues[0]).toBe(128);
        });
    });

    describe('Return Values', () => {

        it('should return correct structure on success', () => {
            // arrange
            const f = (x: number[]) => x[0] ** 2;
            const start = [5];
            // act
            const result = powell(start, f, defaultOptions);
            // assert
            expect(result.converged).toBeDefined();
            expect(result.x).toBeDefined();
            expect(result.fx).toBeDefined();
            expect(result.converged).toBe(true);
            expect(Array.isArray(result.x)).toBe(true);
            expect(typeof result.fx).toBe('number');
            expect(typeof result.iterations).toBe('number');
        });

        it('should return best point found when iteration limit is low', () => {
            // arrange
            const f = (x: number[]) => x[0] ** 2 + x[1] ** 2;
            const start = [1000, 1000];
            const options = { ...defaultOptions, iterations: 1 };
            // act
            const result = powell(start, f, options);
            // assert
            // Note: Algorithm may still converge quickly even with low iteration limit
            // This test validates that iterations are respected
            expect(result.x).toBeDefined();
            expect(result.fx).toBeDefined();
            expect(result.iterations).toBeGreaterThan(0);
            expect(result.iterations).toBeLessThanOrEqual(options.iterations + 1);
        });

        it('should return best point found even when not fully converged', () => {
            // arrange
            const f = (x: number[]) => x[0] ** 2 + x[1] ** 2;
            const start = [100, 100];
            const initialValue = f(start);
            const options = { ...defaultOptions, iterations: 3 };
            // act
            const result = powell(start, f, options);
            // assert
            // Should make some progress toward minimum
            expect(result.fx).toBeLessThan(initialValue);
            expect(result.x).toBeDefined();
        });
    });

    describe('Options Handling', () => {

        it('should use default values for missing options', () => {
            // arrange
            const f = (x: number[]) => x[0] ** 2;
            const start = [5];
            // Intentionally using partial options to test default handling
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const partialOptions: any = {
                traceEnabled: false,
            };
            // act
            const result = powell(start, f, partialOptions);
            // assert
            expect(result).toBeDefined();
            expect(result.converged).toBe(true);
        });

        it('should respect relativeThreshold setting', () => {
            // arrange
            const f = (x: number[]) => x[0] ** 2 + x[1] ** 2;
            const start = [1, 1];
            const strictOptions = { ...defaultOptions, relativeThreshold: 1e-12 };
            const looseOptions = { ...defaultOptions, relativeThreshold: 1e-2 };
            // act
            const strictResult = powell([...start], f, strictOptions);
            const looseResult = powell([...start], f, looseOptions);
            // assert
            // Stricter threshold should generally require more iterations or similar
            // But for simple quadratic, both may converge quickly
            expect(strictResult.iterations).toBeGreaterThanOrEqual(looseResult.iterations);
        });

        it('should respect absoluteThreshold setting', () => {
            // arrange
            const f = (x: number[]) => x[0] ** 2 + x[1] ** 2;
            const start = [0.1, 0.1];
            const strictOptions = { ...defaultOptions, absoluteThreshold: 1e-12 };
            const looseOptions = { ...defaultOptions, absoluteThreshold: 1e-2 };
            // act
            const strictResult = powell([...start], f, strictOptions);
            const looseResult = powell([...start], f, looseOptions);
            // assert
            expect(strictResult.iterations).toBeGreaterThanOrEqual(looseResult.iterations);
        });
    });

    describe('Numerical Stability', () => {

        it('should handle very small parameter values', () => {
            // arrange
            const f = (x: number[]) => (x[0] - 1e-10) ** 2 + (x[1] - 1e-10) ** 2;
            const start = [1e-5, 1e-5];
            // act
            const result = powell(start, f, defaultOptions);
            // assert
            expect(result.converged).toBe(true);
            expect(result.fx).toBeLessThan(1e-10);
        });

        it('should handle very large parameter values', () => {
            // arrange
            const f = (x: number[]) => (x[0] - 1e6) ** 2 + (x[1] - 1e6) ** 2;
            const start = [0, 0];
            const options = { ...defaultOptions, iterations: 500 };
            // act
            const result = powell(start, f, options);
            // assert
            expect(result.converged).toBe(true);
            expect(result.x[0]).toBeCloseTo(1e6, 1);
            expect(result.x[1]).toBeCloseTo(1e6, 1);
        });

        it('should handle mixed scale parameters', () => {
            // arrange
            const f = (x: number[]) => (x[0] - 1e-6) ** 2 + (x[1] - 1e6) ** 2;
            const start = [1, 1];
            const options = { ...defaultOptions, iterations: 500 };
            // act
            const result = powell(start, f, options);
            // assert
            expect(result.converged).toBe(true);
        });
    });
});
