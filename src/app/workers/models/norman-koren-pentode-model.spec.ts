import { normanKorenPentodeModel } from './norman-koren-pentode-model';

describe('models / normanKorenPentodeModel', () => {
    it('should evaluate model', () => {
        // act
        const result = normanKorenPentodeModel(1, 2, 3, 4, 5, 6, 7, 8, 9);
        // assert
        expect(result.ip).toBeCloseTo(17637.616879093654);
        expect(result.is).toBeCloseTo(89242.33528888892);
    });
});
