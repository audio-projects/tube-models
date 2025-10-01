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
                    // check result
                    expect(initial.ex).toBeCloseTo(1.40, 0.01);
                    expect(initial.kg1).toBeCloseTo(303.7, 0.1);
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

    // it('it should estimate "ex/kg1" from EL500_triode.utd file', (done) => {
    //     // fetch test data
    //     fetch('/test-assets/EL500_triode.utd')
    //         .then((response) => response.text())
    //         .then((data) => {
    //             // parse file
    //             const file = fileParserService('EL500_triode.utd', data);
    //             if (file) {
    //                 // initial
    //                 const initial: Initial = {mu: 4};
    //                 // estimate ex/kg1
    //                 estimateExKg1(initial, [file], 1);
    //                 // check result
    //                 expect(initial.ex).toBeCloseTo(6.96, 0.01);
    //                 expect(initial.kg1).toBeCloseTo(533.5, 0.1);
    //                 // done
    //                 done();
    //                 // exit
    //                 return;
    //             }
    //             // fail
    //             fail('Failed to parse test data');
    //             // done
    //             done();
    //         })
    //         .catch((error) => {
    //             // fail
    //             fail('Failed to fetch test data: ' + error);
    //             // done
    //             done();
    //         });
    // });
});
