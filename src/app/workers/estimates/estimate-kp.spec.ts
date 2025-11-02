import { estimateKp } from './estimate-kp';
import { File } from '../../files';
import { fileParserService } from '../../services/file-parser-service';
import { Initial } from '../initial';

describe('estimates / estimateKp', () => {

    it('it should estimate "kp" from ECC81.utd file', (done) => {
        // fetch test data
        fetch('/test-assets/ECC81.utd')
            .then((response) => response.text())
            .then((data) => {
                // parse file
                const file = fileParserService('ECC81.utd', data);
                if (file) {
                    // initial
                    const initial: Initial = { mu: 41.50982026143785, ex: 1.5262372799919646, kg1: 968.0718249400395 };
                    // estimate kp
                    estimateKp(initial, [file]);
                    // check result
                    expect(initial.kp).toBeCloseTo(166.26, 2);
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

    it('it should estimate "kp" from ECC83.utd file', (done) => {
        // fetch test data
        fetch('/test-assets/ECC83.utd')
            .then((response) => response.text())
            .then((data) => {
                // parse file
                const file = fileParserService('ECC83.utd', data);
                if (file) {
                    // initial
                    const initial: Initial = { mu: 94.93314285714287, ex: 0.6960953720193932, kg1: 622.4761422783655 };
                    // estimate kp
                    estimateKp(initial, [file]);
                    // check result
                    expect(initial.kp).toBeCloseTo(450.50, 2);
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

    it('it should estimate "kp" from EL500 files', (done) => {
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
                const initial: Initial = { mu: 4.82, ex: 0.86, kg1: 185.29 };
                // estimate kp
                estimateKp(initial, files);
                // check result
                expect(initial.kp).toBeCloseTo(20.43, 2);
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
