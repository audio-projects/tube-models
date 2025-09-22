import { estimateKg2 } from './estimate-kg2';
import { estimateTriodeParameters } from './estimate-triode-parameters';
import { File } from '../../files';
import { Initial } from '../initial';
import { Trace } from '../trace';

export const estimatePentodeParameters = function (files: File[], initial: Initial, maxW: number, trace?: Trace): Initial {
    // estimate triode parameters first
    initial = estimateTriodeParameters(files, initial, maxW, trace);
    // initialize trace
    if (trace) {
        // estimates
        trace.estimates = trace.estimates || {};
    }
    // estimate kg2
    estimateKg2(initial, files, maxW, trace);
    // return estimates (for Koren pentode models we use a hardcoded KVB=100)
    return {
        mu: initial.mu,
        kg1: initial.kg1,
        kp: initial.kp,
        ex: initial.ex,
        kvb: 100,
        kg2: initial.kg2
    };
};
