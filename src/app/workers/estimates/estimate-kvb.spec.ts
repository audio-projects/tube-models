import { estimateKvb } from './estimate-kvb';
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
                    expect(initial.kvb).toBeCloseTo(20575.74, 0.01);
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
                    expect(initial.kvb).toBeCloseTo(898932.43, 0.01);
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

    it('it should estimate "kvb" from EL500_triode.utd file', (done) => {
        // fetch test data
        fetch('/test-assets/EL500_triode.utd')
            .then((response) => response.text())
            .then((data) => {
                // parse file
                const file = fileParserService('EL500_triode.utd', data);
                if (file) {
                    // initial
                    const initial: Initial = { mu: 4.85, ex: 6.83, kg1: 782237010890.1022, kp: 10.10 };
                    // estimate kvb
                    estimateKvb(initial, [file], 1);
                    // check result
                    expect(initial.kvb).toBeCloseTo(7668.71, 0.01);
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
