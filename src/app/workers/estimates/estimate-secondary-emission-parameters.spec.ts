import { Point } from '../../files';
import { findScreenCurrentFeaturePointsInSeries } from './estimate-secondary-emission-parameters';

describe('estimates / estimate secondary emission parameters', () => {

    it('it should detect maximum and inflection points', () => {
        // arrange
        const points: Point[] = [
            { ep: 0, is: 0, eg: -10, ip: 0 },
            { ep: 1, is: 1, eg: -10, ip: 0 },
            { ep: 2, is: 2, eg: -10, ip: 0 },
            { ep: 3, is: 1.5, eg: -10, ip: 0 }, // Inflection around here (concave up to down)
            { ep: 4, is: 2.5, eg: -10, ip: 0 },
            { ep: 5, is: 4, eg: -10, ip: 0 },   // Local Max around here
            { ep: 6, is: 3.5, eg: -10, ip: 0 },
            { ep: 7, is: 3, eg: -10, ip: 0 },
        ];
        // act
        const featurePoints = findScreenCurrentFeaturePointsInSeries(points, 0);
        // assert
        expect(featurePoints.length).toBe(2);
        expect(featurePoints[0].type).toBe('Inflection Point');
        expect(featurePoints[0].epmax).toBe(3);
        expect(featurePoints[1].type).toBe('Local Maximum');
        expect(featurePoints[1].epmax).toBe(5);
    });

    it('it should detect no maximum and no inflection points', () => {
        // arrange
        const points: Point[] = [
            { ep: 0, is: 0, eg: -10, ip: 0 },
            { ep: 1, is: 1, eg: -10, ip: 0 },
            { ep: 2, is: 2, eg: -10, ip: 0 },
            { ep: 3, is: 3, eg: -10, ip: 0 },
            { ep: 4, is: 4, eg: -10, ip: 0 },
            { ep: 5, is: 5, eg: -10, ip: 0 },
        ];
        // act
        const featurePoints = findScreenCurrentFeaturePointsInSeries(points, 0);
        // assert
        expect(featurePoints.length).toBe(0);
    });
});
