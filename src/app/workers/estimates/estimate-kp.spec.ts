import { estimateKp } from './estimate-kp';
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
                    estimateKp(initial, [file], 2.5);
                    // check result
                    expect(initial.kp).toBeCloseTo(238.17163161359613);
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
                    estimateKp(initial, [file], 1);
                    // check result
                    expect(initial.kp).toBeCloseTo(975.3102522459169);
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
});
