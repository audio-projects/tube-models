import { File, Point } from '../../files';
import { Initial } from '../initial';
import { Trace } from '../trace';

// estimateMu
export const estimateMu = function (initial: Initial, files: File[], trace?: Trace) {
    // check we need to estimate mu
    if (!initial.mu) {
        // maximum plate current
        let maxIp = 0;
        // loop files
        for (const file of files) {
            // loop series
            for (const series of file.series) {
                // loop points
                for (const p of series.points) {
                    // update maxIp
                    maxIp = Math.max(p.ip, maxIp);
                }
            }
        }
        // find ip to estimate Mu
        const ipmu = 0.05 * maxIp;
        // mu points
        const mup: Point[] = [];
        // trace
        if (trace) {
            // mu
            trace.estimates.mu = {
                maxIp: maxIp,
                ip: ipmu,
                points: mup,
            };
        }
        // calculated mu's (sum)
        let muSum = 0;
        let muCount = 0;
        // loop files
        for (const f of files) {
            // loop series
            for (const s of f.series) {
                // series points must be sorted by the X axis (EP)
                s.points.sort((p1, p2) => p1.ep - p2.ep);
                // points around ipmu
                let lower = null,
                    upper = null;
                    // loop points
                for (let m = 0; (!lower || !upper || upper.ip < ipmu) && m < s.points.length; m++) {
                    lower = upper;
                    upper = {
                        ip: s.points[m].ip + (s.points[m].is ?? 0),
                        ep: s.points[m].ep,
                        eg: (s.eg ?? 0) + f.egOffset,
                    };
                }
                // check data is available
                if (lower && upper && lower.ip <= ipmu && upper.ip >= ipmu) {
                    // slope & intercept (y = mx + n)
                    const slope = (upper.ip - lower.ip) / (upper.ep - lower.ep);
                    const n = upper.ip - slope * upper.ep;
                    // extrapolate point for ipmu
                    mup.push({
                        ip: ipmu,
                        eg: lower.eg,
                        ep: (ipmu - n) / slope,
                    });
                }
            }
        }
        // check we have at least two points to estimate value
        if (mup.length > 1) {
            // sort by |eg|
            mup.sort((p1, p2) => Math.abs(p1.eg) - Math.abs(p2.eg));
            // use first two points (low |eg|)
            muSum -= (mup[1].ep - mup[0].ep) / (mup[1].eg - mup[0].eg);
            muCount++;
        }
        // calculate mu
        initial.mu = muCount > 0 ? muSum / muCount : 50;
    }
};
