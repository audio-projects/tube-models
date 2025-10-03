import { estimateMu } from './estimate-mu';
import { File } from '../../files';
import { fileParserService } from '../../services/file-parser-service';
import { Initial } from '../initial';

describe('estimates / estimateMu', () => {

    it('it should estimate "mu" from ECC81.utd file', (done) => {
        // fetch test data
        fetch('/test-assets/ECC81.utd')
            .then((response) => response.text())
            .then((data) => {
                // parse file
                const file = fileParserService('ECC81.utd', data);
                if (file) {
                    // initial
                    const initial: Initial = {};
                    // estimate mu
                    estimateMu(initial, [file], 2.5);
                    // check result
                    expect(initial.mu).toBeCloseTo(41.57, 2);
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

    it('it should estimate "mu" from ECC82.utd file', (done) => {
        // fetch test data
        fetch('/test-assets/ECC82.utd')
            .then((response) => response.text())
            .then((data) => {
                // parse file
                const file = fileParserService('ECC82.utd', data);
                if (file) {
                    // initial
                    const initial: Initial = {};
                    // estimate mu
                    estimateMu(initial, [file], 2.5);
                    // check result
                    expect(initial.mu).toBeCloseTo(14.56, 2);
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

    it('it should estimate "mu" from ECC83.utd file', (done) => {
        // fetch test data
        fetch('/test-assets/ECC83.utd')
            .then((response) => response.text())
            .then((data) => {
                // parse file
                const file = fileParserService('ECC83.utd', data);
                if (file) {
                    // initial
                    const initial: Initial = {};
                    // estimate mu
                    estimateMu(initial, [file], 1);
                    // check result
                    expect(initial.mu).toBeCloseTo(93.82, 2);
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

    it('it should estimate "mu" from EL500 files', (done) => {
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
                const initial: Initial = {};
                // estimate mu
                estimateMu(initial, files, 25);
                // check result
                expect(initial.mu).toBeCloseTo(4.82, 2);
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
