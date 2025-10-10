import { estimateExKg1 } from './estimate-ex-kg1';
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
                    estimateExKg1(initial, [file], 2.5);
                    // check result (Derk Reefman linear regression method)
                    expect(initial.ex).toBeCloseTo(0.58, 1);
                    expect(initial.kg1).toBeCloseTo(276.6, 1);
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

    it('it should estimate "ex/kg1" from EL500_triode.utd file', (done) => {
        // fetch test data
        fetch('/test-assets/EL500_triode.utd')
            .then((response) => response.text())
            .then((data) => {
                // parse file
                const file = fileParserService('EL500_triode.utd', data);
                if (file) {
                    // egOffset
                    file.egOffset = -25;
                    // initial
                    const initial: Initial = {mu: 4};
                    // estimate ex/kg1
                    estimateExKg1(initial, [file], 25);
                    // check result (Derk Reefman linear regression method)
                    expect(initial.ex).toBeCloseTo(2.46, 1);
                    expect(initial.kg1).toBeCloseTo(66435.8, 1);
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
