import { ipk } from './ipk';

describe('models / ipk', () => {

    it('should return a positive number when e1 is greater than 0', () => {
        // act
        const result = ipk(1, 2, 3, 4, 5, 2);
        // assert
        expect(result).toBeGreaterThan(0);
    });

    it('should return 0 when e1 is less than or equal to 0', () => {
        // act
        const result = ipk(-1, -2, -3, -4, -5, 2);
        // assert
        expect(result).toBe(0);
    });

    it('should handle edge cases with zero values', () => {
        // act
        const result = ipk(0, 0, 1, 1, 1, 1);
        // assert
        expect(result).toBe(0);
    });

    it('should handle large input values without errors', () => {
        // act
        const result = ipk(1000, 2000, 3000, 4000, 5000, 2);
        // assert
        expect(result).toBeGreaterThan(0);
    });

    it('should handle small input values without errors', () => {
        // act
        const result = ipk(0.001, 0.002, 0.003, 0.004, 0.005, 2);
        // assert
        expect(result).toBeGreaterThan(0);
    });
});
