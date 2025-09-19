import { powell } from './powell';

describe('algorithms / powell', () => {
    const defaultOptions = {
        relativeThreshold: 1e-6,
        absoluteThreshold: 1e-6,
        tolerance: 1e-6,
        iterations: 1000,
        traceEnabled: false,
    };

    it('should find the minimum of a simple quadratic function', () => {
        // arrange
        const quadratic = (x: number[]) => x[0] * x[0] + x[1] * x[1];
        const quadraticMinimum = [0, 0];
        const quadraticStart = [1, 1];
        // act
        const result = powell(quadraticStart, quadratic, defaultOptions);
        // assert
        expect(result.fx).toBeCloseTo(quadratic(quadraticMinimum), defaultOptions.tolerance);
        expect(result.x[0]).toBeCloseTo(quadraticMinimum[0], defaultOptions.tolerance);
        expect(result.x[1]).toBeCloseTo(quadraticMinimum[1], defaultOptions.tolerance);
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
        expect(result.fx).toBeCloseTo(rosenbrock(rosenbrockMinimum), defaultOptions.tolerance);
        expect(result.x[0]).toBeCloseTo(rosenbrockMinimum[0], defaultOptions.tolerance);
        expect(result.x[1]).toBeCloseTo(rosenbrockMinimum[1], defaultOptions.tolerance);
    });

    it("should find one of the minima of Himmelblau's function", () => {
        // arrange
        const himmelblau = (x: number[]) => (x[0] ** 2 + x[1] - 11) ** 2 + (x[0] + x[1] ** 2 - 7) ** 2;
        const himmelblauMinimum1 = [3, 2];
        const himmelblauStart1 = [0, 0];
        // act
        const result = powell(himmelblauStart1, himmelblau, defaultOptions);
        // assert
        expect(result.fx).toBeCloseTo(himmelblau(himmelblauMinimum1), defaultOptions.tolerance);
        expect(result.x[0]).toBeCloseTo(himmelblauMinimum1[0], defaultOptions.tolerance);
        expect(result.x[1]).toBeCloseTo(himmelblauMinimum1[1], defaultOptions.tolerance);
    });
});
