import { estimateExKg1 } from './estimate-ex-kg1';
import { File } from '../../files';
import { fileParserService } from '../../services/file-parser-service';
import { Initial } from '../initial';

describe('estimates / estimateExKg1', () => {

    it('it should estimate "ex/kg1" from ECC81.utd file', (done) => {
        // fetch test data
        fetch('/test-assets/ECC81.utd')
            .then((response) => response.text())
            .then((data) => {
                // parse file
                const file = fileParserService('ECC81.utd', data);
                if (file) {
                    // initial
                    const initial: Initial = { mu: 56 };
                    // estimate ex/kg1
                    estimateExKg1(initial, [file]);
                    // check result (Derk Reefman linear regression method)
                    expect(initial.ex).toBeCloseTo(0.58, 1);
                    expect(initial.kg1).toBeCloseTo(275.77, 2);
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

    it('it should estimate "ex/kg1" from EL500 files', (done) => {
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
                const initial: Initial = { mu: 4.82 };
                // estimate ex/kg1
                estimateExKg1(initial, files);
                // check result (Derk Reefman linear regression method)
                expect(initial.ex).toBeCloseTo(0.86, 1);
                expect(initial.kg1).toBeCloseTo(188.49, 2);
                // done
                done();
                // exit
                return;
            })
            .catch((error) => {
                // fail
                fail('Failed to fetch test data: ' + error);
                // done
                done();
            });
    });
});
