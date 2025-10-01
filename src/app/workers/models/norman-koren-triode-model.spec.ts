import { normanKorenTriodeModel } from './norman-koren-triode-model';

describe('models / normanKorenTriodeModel', () => {
    it('should evaluate model', () => {
        // act
        const result = normanKorenTriodeModel(1, 2, 3, 4, 5, 6, 7);
        // assert
        expect(result).toEqual({ ip: 226.47101577957528 });
    });
});
