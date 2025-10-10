import { estimateExKg1 } from './estimate-ex-kg1';
import { estimateKg2 } from './estimate-kg2';
import { estimateKp } from './estimate-kp';
import { estimateMu } from './estimate-mu';
import { File } from '../../files';
import { Initial } from '../initial';
import { Trace } from '../trace';

export const estimatePentodeParameters = function (initial: Initial, files: File[], maxW: number, trace?: Trace): Initial {
    // initialize trace
    if (trace) {
        // estimates
        trace.estimates = trace.estimates || {};
    }
    // estimate mu
    estimateMu(initial, files, maxW, trace);
    // extimate ex and kg1
    estimateExKg1(initial, files, maxW, trace);
    // estimate kp
    estimateKp(initial, files, maxW, trace);
    // kvb is not estimated for pentodes, it uses a hardcoded value
    initial.kvb = 100;
    // estimate kg2
    estimateKg2(initial, files, maxW, trace);
    // return estimates
    return {
        kp: initial.kp,
        mu: initial.mu,
        ex: initial.ex,
        kvb: initial.kvb,
        kg1: initial.kg1,
        kg2: initial.kg2
    };
};
