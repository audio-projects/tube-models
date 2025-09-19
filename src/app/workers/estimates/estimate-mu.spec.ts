import { estimateMu } from './estimate-mu';
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
                    estimateMu(initial, [file], 2.5, 0);
                    // check result
                    expect(initial.mu).toBeCloseTo(41.50982026143785, 0.1);
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
                    estimateMu(initial, [file], 2.5, 0);
                    // check result
                    expect(initial.mu).toBeCloseTo(14.56, 0.1);
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
                    estimateMu(initial, [file], 1, 0);
                    // check result
                    expect(initial.mu).toBeCloseTo(93.8, 0.1);
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

    it('it should estimate "mu" from EL500_triode.utd file', (done) => {
        // fetch test data
        fetch('/test-assets/EL500_triode.utd')
            .then((response) => response.text())
            .then((data) => {
                // parse file
                const file = fileParserService('EL500_triode.utd', data);
                if (file) {
                    // initial
                    const initial: Initial = {};
                    // estimate mu
                    estimateMu(initial, [file], 1, 0);
                    // check result
                    expect(initial.mu).toBeCloseTo(4.0, 0.1);
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

    it('it should estimate "mu" from pf86_triode.utd file', (done) => {
        // fetch test data
        fetch('/test-assets/pf86_triode.utd')
            .then((response) => response.text())
            .then((data) => {
                // parse file
                const file = fileParserService('pf86_triode.utd', data);
                if (file) {
                    // initial
                    const initial: Initial = {};
                    // estimate mu
                    estimateMu(initial, [file], 1, 0);
                    // check result
                    expect(initial.mu).toBeCloseTo(33.5, 0.1);
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
