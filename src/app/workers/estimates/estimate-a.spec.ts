import { estimateA } from './estimate-a';
import { fileParserService } from '../../services/file-parser-service';
import { Initial } from '../initial';
import { File } from '../../files';

describe('estimates / estimateA', () => {

    it('it should estimate "a" from EL500 files', (done) => {
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
                const initial: Initial = { mu: 4.82, ex: 1.58, kg1: 863.17, kp: 76.78, kvb: 10323.40 };
                // estimate a
                estimateA(initial, files, 25);
                // check result
                expect(initial.a).toBeCloseTo(0.0011, 4);
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

    it('it should estimate "a" from EF80 files', (done) => {
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
                const initial: Initial = { mu: 56, ex: 1.18, kp: 315, kg1: 126.0, kvb: 4155 };
                // estimate a
                estimateA(initial, files, 100);
                // check result
                expect(initial.a).toBeCloseTo(0.00041, 4);
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
