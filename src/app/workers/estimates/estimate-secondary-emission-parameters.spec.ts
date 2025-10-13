import { fileParserService } from '../../services/file-parser-service';
import { findScreenCurrentFeaturePointsInSeries } from './estimate-secondary-emission-parameters';
import { Point } from '../../files';

describe('estimates / estimate secondary emission parameters', () => {

    it('it should process EL500_300.utd file', (done) => {
        // fetch test data
        fetch('/test-assets/EL500_300.utd')
            .then((response) => response.text())
            .then((data) => {
                // parse file
                const file = fileParserService('EL500_300.utd', data);
                if (file) {
                    // act
                    const featurePoints = findScreenCurrentFeaturePointsInSeries(file.series.filter(series => series.eg === -13)[0].points, 0);
                    // assert - should detect 8 feature points total
                    expect(featurePoints.length).toBe(8);
                    // Check for local minimum at secondary emission crossover
                    const minimum = featurePoints.find(fp => fp.type === 'Local Minimum');
                    expect(minimum).toBeDefined();
                    expect(minimum?.epmax).toBeCloseTo(65.74, 1);
                    expect(minimum?.is).toBeCloseTo(15.08, 1);
                    // Check for local maximums
                    const maximums = featurePoints.filter(fp => fp.type === 'Local Maximum');
                    expect(maximums.length).toBe(2);
                    expect(maximums[0]?.epmax).toBeCloseTo(194.42, 1);
                    expect(maximums[0]?.is).toBeCloseTo(30.83, 1);
                    expect(maximums[1]?.epmax).toBeCloseTo(204.64, 1);
                    expect(maximums[1]?.is).toBeCloseTo(31.43, 1);
                    // Check for inflection points
                    const inflections = featurePoints.filter(fp => fp.type === 'Inflection Point');
                    expect(inflections.length).toBe(5);
                    // Verify each inflection point location
                    expect(inflections[0]?.epmax).toBeCloseTo(18.27, 1);
                    expect(inflections[0]?.is).toBeCloseTo(71.04, 1);
                    expect(inflections[1]?.epmax).toBeCloseTo(105.33, 1);
                    expect(inflections[1]?.is).toBeCloseTo(19.69, 1);
                    expect(inflections[2]?.epmax).toBeCloseTo(135.03, 1);
                    expect(inflections[2]?.is).toBeCloseTo(23.53, 1);
                    expect(inflections[3]?.epmax).toBeCloseTo(154.48, 1);
                    expect(inflections[3]?.is).toBeCloseTo(26.38, 1);
                    expect(inflections[4]?.epmax).toBeCloseTo(243.56, 1);
                    expect(inflections[4]?.is).toBeCloseTo(18.48, 1);
                    // done
                    done();
                    // exit
                    return;
                }
                // fail
                fail('Failed to parse test data');
                // done
                done();
            })
            .catch((error) => {
                // fail
                fail('Failed to fetch test data: ' + error);
                // done
                done();
            });
    });

    it('it should detect local minimum (secondary emission crossover)', () => {
        // arrange - realistic secondary emission curve: high → low → high
        const points: Point[] = [
            { ep: 10, is: 100, eg: -10, ip: 0 },  // High at low Va
            { ep: 20, is: 80, eg: -10, ip: 0 },
            { ep: 30, is: 60, eg: -10, ip: 0 },
            { ep: 40, is: 40, eg: -10, ip: 0 },
            { ep: 50, is: 25, eg: -10, ip: 0 },
            { ep: 60, is: 18, eg: -10, ip: 0 },   // Approaching minimum
            { ep: 70, is: 15, eg: -10, ip: 0 },   // Local Minimum (crossover)
            { ep: 80, is: 18, eg: -10, ip: 0 },
            { ep: 90, is: 25, eg: -10, ip: 0 },
            { ep: 100, is: 30, eg: -10, ip: 0 },  // Rising again
        ];
        // act
        const featurePoints = findScreenCurrentFeaturePointsInSeries(points, 0);
        // assert
        expect(featurePoints.length).toBeGreaterThanOrEqual(1);
        const minimum = featurePoints.find(fp => fp.type === 'Local Minimum');
        expect(minimum).toBeDefined();
        expect(minimum?.epmax).toBe(70);
        expect(minimum?.is).toBe(15);
    });

    it('it should detect maximum and minimum points with realistic slopes', () => {
        // arrange - data with clear negative slope before minimum
        const points: Point[] = [
            { ep: 0, is: 10, eg: -10, ip: 0, es: 300 },
            { ep: 1, is: 8, eg: -10, ip: 0, es: 300 },   // Decreasing (slope < 0)
            { ep: 2, is: 5, eg: -10, ip: 0, es: 300 },   // Still decreasing
            { ep: 3, is: 3, eg: -10, ip: 0, es: 300 },   // Local Minimum (d1 changes - to +)
            { ep: 4, is: 5, eg: -10, ip: 0, es: 300 },   // Increasing (slope > 0)
            { ep: 5, is: 9, eg: -10, ip: 0, es: 300 },   // Still increasing
            { ep: 6, is: 11, eg: -10, ip: 0, es: 300 },  // Local Maximum (d1 changes + to -)
            { ep: 7, is: 9, eg: -10, ip: 0, es: 300 },   // Decreasing
            { ep: 8, is: 6, eg: -10, ip: 0, es: 300 },
        ];
        // act
        const featurePoints = findScreenCurrentFeaturePointsInSeries(points, 0);
        // assert - detects minimum at ep=3, then maximum at ep=6
        expect(featurePoints.length).toBeGreaterThanOrEqual(2);
        const minimum = featurePoints.find(fp => fp.type === 'Local Minimum');
        const maximum = featurePoints.find(fp => fp.type === 'Local Maximum');
        expect(minimum).toBeDefined();
        expect(minimum?.epmax).toBe(3);
        expect(minimum?.is).toBe(3);
        expect(maximum).toBeDefined();
        expect(maximum?.epmax).toBe(6);
        expect(maximum?.is).toBe(11);
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
