import { normanKorenNewPentodeModel } from './norman-koren-new-pentode-model';

describe('models / normanKorenNewPentodeModel', () => {
    it('should evaluate model', () => {
        // act
        const result = normanKorenNewPentodeModel(1, 2, 3, 4, 5, 6, 7, 8, 9);
        // assert
        expect(result.ip).toBeCloseTo(4999.33184971318);
        expect(result.is).toBeCloseTo(26908.181177385566);
    });
});
