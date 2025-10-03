import { estimateKvb } from './estimate-kvb';
import { File } from '../../files';
import { fileParserService } from '../../services/file-parser-service';
import { Initial } from '../initial';

describe('estimates / estimateKvb', () => {

    it('it should estimate "kvb" from ECC81.utd file', (done) => {
        // fetch test data
        fetch('/test-assets/ECC81.utd')
            .then((response) => response.text())
            .then((data) => {
                // parse file
                const file = fileParserService('ECC81.utd', data);
                if (file) {
                    // initial
                    const initial: Initial = { mu: 41.50982026143785, ex: 1.5262372799919646, kg1: 968.0718249400395, kp: 238.17163161359613 };
                    // estimate kvb
                    estimateKvb(initial, [file], 2.5);
                    // check result
                    expect(initial.kvb).toBeCloseTo(20575.75, 2);
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

    it('it should estimate "kvb" from ECC83.utd file', (done) => {
        // fetch test data
        fetch('/test-assets/ECC83.utd')
            .then((response) => response.text())
            .then((data) => {
                // parse file
                const file = fileParserService('ECC83.utd', data);
                if (file) {
                    // initial
                    const initial: Initial = { mu: 94.5, ex: 0.70, kg1: 616.64, kp: 928.20 };
                    // estimate kvb
                    estimateKvb(initial, [file], 1);
                    // check result
                    expect(initial.kvb).toBeCloseTo(898932.43, 2);
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

    it('it should estimate "kvb" from EEL500 files', (done) => {
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
                const initial: Initial = { mu: 4.82, ex: 1.58, kg1: 863.17, kp: 76.78 };
                // estimate kvb
                estimateKvb(initial, files, 25);
                // check result
                expect(initial.kvb).toBeCloseTo(10548.03, 2);
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
