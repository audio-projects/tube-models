import { File } from '../../files';
import { Initial } from '../initial';
import { normanKorenTriodeModelError } from '../models/norman-koren-triode-model-error';
import { Trace } from '../trace';

export const estimateKvb = function (initial: Initial, files: File[], maxW: number, trace?: Trace) {
    // check we need to estimate kvb
    if (!initial.kvb) {
        // mu, kp, kg1, and ex must be initialized
        if (!initial.kp || !initial.mu || !initial.ex || !initial.kg1) {
            // cannot estimate kvb without these parameters
            throw new Error('Cannot estimate kvb without kp, mu, ex and kg1');
        }
        // initialize trace
        if (trace) {
            // estimates
            trace.estimates.kvb = {
                average: [],
            };
        }
        // mu, kp, kg1, and ex for calculations
        const mu = initial.mu;
        const kp = initial.kp;
        const kg1 = initial.kg1;
        const ex = initial.ex;
        // Empirical approach: Test candidate Kvb values and find the one that
        // best matches the measured data using the Norman Koren Triode model
        // Doubling sequence from 50 to 3200
        //
        const candidateKvbs = [50, 100, 200, 400, 800, 3200];
        let bestKvb = 1000;
        let bestError = Infinity;
        // loop kvb candidates
        for (const kvbCandidate of candidateKvbs) {
            // Use the normanKorenTriodeModelError function to calculate RMS error
            // This is the same error function used by the optimizer
            const rmsError = normanKorenTriodeModelError(files, kp, mu, kvbCandidate, ex, kg1, maxW).rmse;
            // compare error
            if (rmsError < bestError) {
                bestError = rmsError;
                bestKvb = kvbCandidate;
            }
        }
        // Use the best candidate as our estimate
        initial.kvb = bestKvb;
    }
};
