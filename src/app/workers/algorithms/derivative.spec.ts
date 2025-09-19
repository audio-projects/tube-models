import { derivative } from './derivative';
import { subset, index, MathCollection, MathType, multiply, sin, exp, pow } from 'mathjs';
import { valueAt, Vector } from './vector';

function expectMatrixToBeCloseTo(actual: MathType, expected: number[][], tolerance = 1e-6) {
    // loop rows
    for (let i = 0; i < expected.length; i++) {
        // row
        const row = expected[i];
        // loop columns
        for (let j = 0; j < row.length; j++) {
            // value
            const actualValue = subset(actual as MathCollection, index(i, j));
            // compare
            expect(Number(actualValue)).toBeCloseTo(row[j], tolerance);
        }
    }
}

describe('derivative', () => {

    describe('1D input, 1D output functions', () => {

        it('should compute derivative of f(x) = x^2', () => {
            // f(x) = x^2, derivative: f'(x) = 2x
            const f = (x: Vector): Vector => [multiply(valueAt(x, 0), valueAt(x, 0))] as MathCollection;
            const x = [2.0];
            // act
            const [jacobian] = derivative(f, x);
            // assert [[4.0]]
            expectMatrixToBeCloseTo(jacobian, [[4.0]], 1e-6);
        });

        it('should compute derivative of f(x) = 3x^3 + 2x^2 + x + 1', () => {
            // f(x) = 3x^3 + 2x^2 + x + 1, derivative: f'(x) = 9x^2 + 4x + 1
            const f = (x: Vector): Vector => {
                const x0 = valueAt(x, 0) as unknown as number;
                return [3 * x0 ** 3 + 2 * x0 ** 2 + x0 + 1] as MathCollection;
            };
            const x = [1.5]; // Test point
            // act
            const [jacobian] = derivative(f, x);
            // assert
            expectMatrixToBeCloseTo(jacobian, [[27.25]], 1e-6);
        });

        it('should compute derivative of f(x) = sin(x)', () => {
            // f(x) = sin(x), derivative: f'(x) = cos(x)
            const f = (x: Vector): Vector => [sin(valueAt(x, 0) as unknown as number)];
            const x = [Math.PI / 4]; // Test point: π/4
            // act
            const [jacobian] = derivative(f, x);
            // assert f'(π/4) = cos(π/4) = √2/2 ≈ 0.7071
            expectMatrixToBeCloseTo(jacobian, [[Math.cos(Math.PI / 4)]], 1e-6);
        });

        it('should compute derivative of f(x) = e^x', () => {
            // f(x) = e^x, derivative: f'(x) = e^x
            const f = (x: Vector): Vector => [exp(valueAt(x, 0) as unknown as number)];
            const x = [1.0]; // Test point
            // act
            const [jacobian] = derivative(f, x);
            // assert f'(1) = e^1 ≈ 2.7183
            expectMatrixToBeCloseTo(jacobian, [[Math.exp(1.0)]], 1e-6);
        });

        it('should compute derivative with different orders', () => {
            // f(x) = x^3, derivative: f'(x) = 3x^2
            const f = (x: Vector): Vector => [pow(valueAt(x, 0) as unknown as number, 3) as number];
            const x = [2.0]; // Test point
            const expected = [[12.0]]; // f'(2) = 3 * 2^2 = 12
            // Test order 1
            const [jacobian1] = derivative(f, x, { order: 1 });
            // assert
            expectMatrixToBeCloseTo(jacobian1, expected, 1e-4);
            // Test order 2 (default)
            const [jacobian2] = derivative(f, x, { order: 2 });
            // assert
            expectMatrixToBeCloseTo(jacobian2, expected, 1e-6);
            // Test order 4
            const [jacobian4] = derivative(f, x, { order: 4 });
            // assert
            expectMatrixToBeCloseTo(jacobian4, expected, 1e-8);
        });

        it('should compute both Jacobian and Hessian when requested', () => {
            // Target function: f(x) = x^3
            // Analytical derivative: f'(x) = 3x^2
            // Analytical second derivative: f''(x) = 6x
            const f = (x: Vector): Vector => [pow(valueAt(x, 0) as unknown as number, 3) as number];
            const x = [2.0]; // Test point
            // act
            const [jacobian, hessian] = derivative(f, x, { hessian: true });
            // assert Jacobian: [[12.0]] (f'(2) = 3 * 2^2 = 12)
            expectMatrixToBeCloseTo(jacobian, [[12.0]], 1e-6);
            // assert Hessian: [[12.0]] (f''(2) = 6 * 2 = 12)
            expectMatrixToBeCloseTo(hessian!, [[12.0]], 1e-4);
        });

        it('should handle custom step size', () => {
            // Target function: f(x) = x^2
            // Analytical derivative: f'(x) = 2x
            const f = (x: Vector): Vector => [multiply(valueAt(x, 0), valueAt(x, 0))] as MathCollection;
            const x = [3.0]; // Test point
            // act
            const [jacobian] = derivative(f, x, { h: 1e-8 });
            // assert f'(3) = 2 * 3 = 6
            expectMatrixToBeCloseTo(jacobian, [[6.0]], 1e-6);
        });

        it('should use provided initial function value for order 1', () => {
            // Target function: f(x) = x^2
            // Analytical derivative: f'(x) = 2x
            const f = (x: Vector): Vector => [multiply(valueAt(x, 0), valueAt(x, 0))] as MathCollection;
            const x = [2.0]; // Test point
            const fx = f(x); // Pre-computed function value
            // act
            const [jacobian] = derivative(f, x, { order: 1, fx });
            // assert f'(2) = 2 * 2 = 4
            expectMatrixToBeCloseTo(jacobian, [[4.0]], 1e-4);
        });
    });

    describe('edge cases', () => {

        it('should handle function at zero', () => {
            // arrange
            const f = (x: Vector): Vector => [multiply(valueAt(x, 0), valueAt(x, 0))] as MathCollection;
            const x = [0.0];
            // act
            const [jacobian] = derivative(f, x);
            // assert f'(0) = 2 * 0 = 0
            expectMatrixToBeCloseTo(jacobian, [[0.0]], 1e-6);
        });

        it('should handle negative input values', () => {
            const f = (x: Vector): Vector => [pow(valueAt(x, 0) as unknown as number, 3) as number];
            const x = [-2.0];
            // act
            const [jacobian] = derivative(f, x);
            // assert f'(-2) = 3 * (-2)^2 = 3 * 4 = 12
            expectMatrixToBeCloseTo(jacobian, [[12.0]], 1e-6);
        });

        it('should handle very small input values', () => {
            const f = (x: Vector): Vector => [multiply(valueAt(x, 0), valueAt(x, 0))] as MathCollection;
            const x = [1e-6];
            // act
            const [jacobian] = derivative(f, x);
            // assert f'(1e-6) = 2 * 1e-6 = 2e-6
            expectMatrixToBeCloseTo(jacobian, [[2e-6]], 1e-9);
        });
    });

    describe('linear function', () => {

        it('should compute derivative of f(x) = 5x + 3', () => {
            // Target function: f(x) = 5x + 3
            // Analytical derivative: f'(x) = 5
            const f = (x: Vector): Vector => {
                const x0 = valueAt(x, 0) as unknown as number;
                return [5 * x0 + 3] as MathCollection;
            };
            const x = [10.0]; // Test point (should work for any x)
            // act
            const [jacobian] = derivative(f, x);
            // assert f'(x) = 5 for any x
            expectMatrixToBeCloseTo(jacobian, [[5.0]], 1e-6);
        });
    });

    describe('constant function', () => {

        it('should compute derivative of f(x) = 42', () => {
            // Target function: f(x) = 42 (constant)
            // Analytical derivative: f'(x) = 0
            const f = (): Vector => [42];
            const x = [5.0]; // Test point (should work for any x)
            // act
            const [jacobian] = derivative(f, x);
            // assert f'(x) = 0 for any x
            expectMatrixToBeCloseTo(jacobian, [[0.0]], 1e-6);
        });
    });

    describe('composite functions', () => {

        it('should compute derivative of f(x) = (x^2 + 1)^2', () => {
            // Target function: f(x) = (x^2 + 1)^2
            // Analytical derivative: f'(x) = 2(x^2 + 1) * 2x = 4x(x^2 + 1)
            const f = (x: Vector): Vector => {
                const x0 = valueAt(x, 0) as unknown as number;
                const inner = x0 * x0 + 1;
                return [inner * inner] as MathCollection;
            };
            const x = [2.0]; // Test point
            // act
            const [jacobian] = derivative(f, x);
            // assert f'(2) = 4 * 2 * (2^2 + 1) = 8 * (4 + 1) = 8 * 5 = 40
            expectMatrixToBeCloseTo(jacobian, [[40.0]], 1e-6);
        });
    });

    describe('multi-dimensional functions', () => {

        it('should compute Jacobian of f(x,y,z) = [x²+y²+z², xy+yz+xz] with 3 inputs and 2 outputs', () => {
            // Target function: f(x,y,z) = [x²+y²+z², xy+yz+xz]
            // Analytical Jacobian at point (1,2,3):
            // ∂f₁/∂x = 2x = 2,  ∂f₁/∂y = 2y = 4,  ∂f₁/∂z = 2z = 6
            // ∂f₂/∂x = y+z = 5, ∂f₂/∂y = x+z = 4, ∂f₂/∂z = x+y = 3
            // Expected Jacobian: [[2, 4, 6], [5, 4, 3]]
            const f = (x: Vector): Vector => {
                const x0 = valueAt(x, 0) as unknown as number;
                const x1 = valueAt(x, 1) as unknown as number;
                const x2 = valueAt(x, 2) as unknown as number;

                const f1 = x0 * x0 + x1 * x1 + x2 * x2;  // x² + y² + z²
                const f2 = x0 * x1 + x1 * x2 + x0 * x2;  // xy + yz + xz

                return [f1, f2];
            };
            const x = [1.0, 2.0, 3.0]; // Test point (x=1, y=2, z=3)
            // act
            const [jacobian] = derivative(f, x);
            // assert Jacobian is 2x3 matrix with expected values
            expectMatrixToBeCloseTo(jacobian, [
                [2.0, 4.0, 6.0],  // ∂f₁/∂x, ∂f₁/∂y, ∂f₁/∂z
                [5.0, 4.0, 3.0]   // ∂f₂/∂x, ∂f₂/∂y, ∂f₂/∂z
            ], 1e-6);
        });

        it('should compute Hessian of f(x,y,z) = [x²+y²+z², xy+yz+xz] with 3 inputs and 2 outputs', () => {
            // Target function: f(x,y,z) = [x²+y²+z², xy+yz+xz]
            // Analytical Hessian at any point:
            // For f₁ = x²+y²+z²: H₁ = [[2,0,0], [0,2,0], [0,0,2]]
            // For f₂ = xy+yz+xz: H₂ = [[0,1,1], [1,0,1], [1,1,0]]
            // Flattened Hessian should be: [2,0,0,0,2,0,0,0,2, 0,1,1,1,0,1,1,1,0]
            const f = (x: Vector): Vector => {
                const x0 = valueAt(x, 0) as unknown as number;
                const x1 = valueAt(x, 1) as unknown as number;
                const x2 = valueAt(x, 2) as unknown as number;

                const f1 = x0 * x0 + x1 * x1 + x2 * x2;  // x² + y² + z²
                const f2 = x0 * x1 + x1 * x2 + x0 * x2;  // xy + yz + xz

                return [f1, f2];
            };
            const x = [1.0, 2.0, 3.0]; // Test point (x=1, y=2, z=3)
            // act
            const [, hessian] = derivative(f, x, { hessian: true });
            // assert Hessian is computed (6x3 matrix for flattened 2 functions × 3×3 second derivatives)
            expect(hessian).toBeDefined();
            // The Hessian is flattened, so we expect specific values at key positions
            // f₁ Hessian diagonal elements (positions 0,4,8): should be 2,2,2
            expectMatrixToBeCloseTo(hessian!, [
                [2.0, 0.0, 0.0],  // ∂²f₁/∂x², ∂²f₁/∂x∂y, ∂²f₁/∂x∂z
                [0.0, 2.0, 0.0],  // ∂²f₁/∂y∂x, ∂²f₁/∂y², ∂²f₁/∂y∂z
                [0.0, 0.0, 2.0],  // ∂²f₁/∂z∂x, ∂²f₁/∂z∂y, ∂²f₁/∂z²
                [0.0, 1.0, 1.0],  // ∂²f₂/∂x², ∂²f₂/∂x∂y, ∂²f₂/∂x∂z
                [1.0, 0.0, 1.0],  // ∂²f₂/∂y∂x, ∂²f₂/∂y², ∂²f₂/∂y∂z
                [1.0, 1.0, 0.0]   // ∂²f₂/∂z∂x, ∂²f₂/∂z∂y, ∂²f₂/∂z²
            ], 1e-4);
        });
    });
});
