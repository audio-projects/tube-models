import { estimateExKg1 } from './estimate-ex-kg1';
import { estimateKp } from './estimate-kp';
import { estimateKvb } from './estimate-kvb';
import { estimateMu } from './estimate-mu';
import { File } from '../../files';
import { Initial } from '../initial';
import { Trace } from '../trace';

export const estimateTriodeParameters = function (files: File[], initial: Initial, maxW: number, trace?: Trace): Initial {
    // initialize trace
    if (trace) {
        // estimates
        trace.estimates = trace.estimates || {};
    }
    // triode files
    const triodeFiles: File[] = [];
    // loop files
    for (const f of files) {
        // find a file that correspond to triode characteristics
        if (f.measurementType === 'IP_VA_VG_VH' || f.measurementType === 'IP_VG_VA_VH' || f.measurementType === 'IPIS_VG_VAVS_VH' || f.measurementType === 'IPIS_VAVS_VG_VH') {
            // it is a triode like graph, use it
            triodeFiles.push(f);
        }
    }
    // check we have at leat one file
    if (triodeFiles.length > 0) {
        // estimate mu (use all files)
        estimateMu(initial, files, maxW, trace);
        // extimate ex and kg1
        estimateExKg1(initial, triodeFiles, maxW, trace);
        // estimate kp
        estimateKp(initial, triodeFiles, maxW, trace);
        // estimate kvb
        estimateKvb(initial, triodeFiles, maxW, trace);
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
