import { derkEModel } from './derke-model';
import { PentodeModelResult } from './pentode-model-result';

describe('models / derkEModel', () => {

    it('should calculate ip and is correctly with secondary emission enabled', () => {
        // act
        const result: PentodeModelResult = derkEModel(
            100, // ep
            50,  // eg
            20,  // es
            1.5, // kp
            100, // mu
            200, // kvb
            1.2, // ex
            0.8, // kg1
            1.0, // kg2
            0.5, // a
            0.3, // alphaS
            0.02, // beta
            true, // secondaryEmission
            0.1, // s
            0.05, // alphaP
            2.0, // lambda
            0.1, // v
            0.2  // w
        );
        // assert
        expect(result.ip).toBeDefined();
        expect(result.is).toBeDefined();
        expect(result.ip).toBeGreaterThan(0);
        expect(result.is).toBeGreaterThan(0);
    });

    it('should calculate ip and is correctly with secondary emission disabled', () => {
        // act
        const result: PentodeModelResult = derkEModel(
            100, // ep
            50,  // eg
            20,  // es
            1.5, // kp
            100, // mu
            200, // kvb
            1.2, // ex
            0.8, // kg1
            1.0, // kg2
            0.5, // a
            0.3, // alphaS
            0.02, // beta
            false, // secondaryEmission
            0, // s
            0, // alphaP
            0, // lambda
            0, // v
            0  // w
        );
        // assert
        expect(result.ip).toBeDefined();
        expect(result.is).toBeDefined();
        expect(result.ip).toBeGreaterThan(0);
        expect(result.is).toBeGreaterThan(0);
    });
});
