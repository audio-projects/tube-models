import { derkModel } from './derk-model';
import { PentodeModelResult } from './pentode-model-result';

describe('models / derkModel', () => {

    it('should calculate ip and is correctly with valid inputs', () => {
        // arrange
        const ep = 100;
        const eg = 50;
        const es = 20;
        const kp = 1.5;
        const mu = 2.0;
        const kvb = 0.5;
        const ex = 1.2;
        const kg1 = 0.8;
        const kg2 = 1.0;
        const a = 0.9;
        const alphaS = 0.7;
        const beta = 0.3;
        const secondaryEmission = true;
        const s = 0.1;
        const alphaP = 0.05;
        const lambda = 1.1;
        const v = 0.02;
        const w = 0.01;
        // act
        const result: PentodeModelResult = derkModel(ep, eg, es, kp, mu, kvb, ex, kg1, kg2, a, alphaS, beta, secondaryEmission, s, alphaP, lambda, v, w);
        // assert
        expect(result.ip).toBeCloseTo(15376510.748734979);
        expect(result.is).toBeCloseTo(140162.23895345372);
    });

    it('should handle cases where secondaryEmission is false', () => {
        // arrange
        const ep = 100;
        const eg = 50;
        const es = 20;
        const kp = 1.5;
        const mu = 2.0;
        const kvb = 0.5;
        const ex = 1.2;
        const kg1 = 0.8;
        const kg2 = 1.0;
        const a = 0.9;
        const alphaS = 0.7;
        const beta = 0.3;
        const secondaryEmission = false;
        const s = 0;
        const alphaP = 0;
        const lambda = 0;
        const v = 0;
        const w = 0;
        // act
        const result: PentodeModelResult = derkModel(ep, eg, es, kp, mu, kvb, ex, kg1, kg2, a, alphaS, beta, secondaryEmission, s, alphaP, lambda, v, w);
        // assert
        expect(result.ip).toBeCloseTo(15377200.241577415);
        expect(result.is).toBeCloseTo(139472.7461110169);
    });
});
