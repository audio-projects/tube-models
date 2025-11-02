import { estimateKg2 } from './estimate-kg2';
import { fileParserService } from '../../services/file-parser-service';
import { Initial } from '../initial';
import { File } from '../../files';

describe('estimates / estimateKg2', () => {

    it('it should estimate "kg2" with no files', () => {
        // initial
        const initial: Initial = { mu: 56, ex: 1.4, kp: 100, kvb: 1000 };
        // estimate kg2
        estimateKg2(initial, []);
        // check result
        expect(initial.kg2).toBeCloseTo(1000, 2);
    });

    it('it should estimate "kg2" from EF80 files', (done) => {
        // files
        const fileNames = ['EF80_200.utd', 'EF80_250.utd', 'EF80_300.utd', 'EF80_triode.utd'];
        // fetch all files
        Promise.all(fileNames.map((fileName) => fetch('/test-assets/' + fileName)))
            .then((responses) => Promise.all(responses.map((response) => response.text())))
            .then((data) => {
                // files
                const files: File[] = [];
                // loop file data
                for (let i = 0; i < data.length; i++) {
                    // parse file content
                    const file = fileParserService(fileNames[i], data[i]);
                    if (file)
                        files.push(file);
                }
                // initial
                const initial: Initial = { mu: 56, ex: 1.18, kp: 315, kvb: 4155 };
                // estimate kg2
                estimateKg2(initial, files);
                // check result
                expect(initial.kg2).toBeCloseTo(638.46, 2);
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

    it('it should estimate "kg2" from EL500 files', (done) => {
        // files
        const fileNames = ['EL500_200.utd', 'EL500_250.utd', 'EL500_300.utd', 'EL500_triode.utd'];
        // fetch all files
        Promise.all(fileNames.map((fileName) => fetch('/test-assets/' + fileName)))
            .then((responses) => Promise.all(responses.map((response) => response.text())))
            .then((data) => {
                // files
                const files: File[] = [];
                // loop file data
                for (let i = 0; i < data.length; i++) {
                    // parse file content
                    const file = fileParserService(fileNames[i], data[i]);
                    if (file) {
                        // update egOffset
                        file.egOffset = -25;
                        // add file
                        files.push(file);
                    }
                }
                // initial
                const initial: Initial = { mu: 5.5, ex: 1.59, kp: 54.05, kvb: 6122.6 };
                // estimate kg2
                estimateKg2(initial, files);
                // check result
                expect(initial.kg2).toBeCloseTo(11428.22, 2);
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
});
