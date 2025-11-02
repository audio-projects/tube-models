import { Initial } from '../initial';
import { ipk } from '../models/ipk';
import { ScreenCurrentFeaturePoint } from './screen-current-feature-point';
import { Trace } from '../trace';

// estimateDerkS
export const estimateDerkS = function (initial: Initial, screenCurrentFeaturePoints: ScreenCurrentFeaturePoint[], trace?: Trace) {
    // check we need to estimate S
    if (!initial.s) {
        // mu must be initialized
        if (!initial.kp || !initial.mu || !initial.kvb || !initial.ex || !initial.kg2 || !initial.alphaS || !initial.beta ) {
            // cannot estimate ex and kg1 without mu
            throw new Error('Cannot estimate s without kp, mu, kvb, ex, kg2, alphaS, beta');
        }
        // initialize trace if needed
        if (trace) {
            // estimates
            trace.estimates = trace.estimates || {};
            // secondaryEmission
            trace.estimates.secondaryEmission = trace.estimates.secondaryEmission || {};
            // s
            trace.estimates.secondaryEmission.s = {average: []};
        }
        // average
        let sum = 0;
        let count = 0;
        // loop screenCurrentFeaturePoints
        for (const p of screenCurrentFeaturePoints) {
            // ipk
            const ip = ipk(p.eg, p.es, initial.kp, initial.mu, initial.kvb, initial.ex);
            // calculate Psec estimate @ Vamax
            const Psec = p.is * 1e-3 * initial.kg2 / ip - (1 + initial.alphaS / (1 + initial.beta * p.epmax));
            // calculate s
            const s = initial.kg2 * Psec / (2 * p.epmax * ip);
            if (s >= 0) {
            // update amounts for average
                sum += s;
                count++;
                // update trace
                if (trace?.estimates?.secondaryEmission?.s)
                    trace.estimates.secondaryEmission.s.average.push(s);
            }
        }
        // calculate initial
        initial.s = count > 0 ? sum / count : 0.05;
        // update trace
        if (trace?.estimates?.secondaryEmission?.s)
            trace.estimates.secondaryEmission.s.s = initial.s;
    }
};
