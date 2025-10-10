import { estimateExKg1 } from './estimate-ex-kg1';
import { estimateKp } from './estimate-kp';
import { estimateKvb } from './estimate-kvb';
import { estimateMu } from './estimate-mu';
import { File } from '../../files';
import { Initial } from '../initial';
import { Trace } from '../trace';

export const estimateTriodeParameters = function (initial: Initial, files: File[], maxW: number, trace?: Trace): Initial {
    // initialize trace
    if (trace) {
        // estimates
        trace.estimates = trace.estimates || {};
    }
    if (files.length > 0) {
        // estimate mu
        estimateMu(initial, files, maxW, trace);
        // estimate ex and kg1
        estimateExKg1(initial, files, maxW, trace);
        // estimate kp
        estimateKp(initial, files, maxW, trace);
        // estimate kvb
        estimateKvb(initial, files, maxW, trace);
        // return estimates
        return initial;
    }
    // nothing we can do here!
    return {
        kp: 100,
        mu: 50,
        kvb: 1000,
        ex: 1.2,
        kg1: 1000,
    };
};
