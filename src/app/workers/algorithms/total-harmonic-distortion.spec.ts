import { totalHarmonicDistortion } from './total-harmonic-distortion';

describe('THD', () => {

    it('should return zero on non-distortion', () => {
        // arrange
        const pc = (eg: number) => 10 * eg;
        // act
        const thd = totalHarmonicDistortion(pc);
        // assert
        expect(thd).toBeCloseTo(0, 0.000001);
    });

    it('should return a known THD for a perfect square wave', () => {
        // arrange
        const pc = (eg: number) => eg > 0 ? 1 : -1;
        // act
        const thd = totalHarmonicDistortion(pc);
        // assert
        expect(thd).toBeCloseTo(100 * Math.sqrt(Math.PI * Math.PI / 8 - 1), 0.000001);
    });
});
