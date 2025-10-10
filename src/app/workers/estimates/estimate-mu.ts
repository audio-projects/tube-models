import { File, Point } from '../../files';
import { Trace } from '../trace';
import { Initial } from '../initial';

// estimateMu
export const estimateMu = function (initial: Initial, files: File[], maxW: number, trace?: Trace) {
    // check we need to estimate mu
    if (!initial.mu) {
        // maximum plate current for reference
        let maxIp = 0;
        // collect all non-zero currents for dynamic threshold calculation
        const allCurrents: number[] = [];
        // loop files to find maximum current and collect all currents
        for (const file of files) {
            // loop series
            for (const series of file.series) {
                // loop points
                for (const p of series.points) {
                    // check point meets plate power criteria
                    if (p.ip * p.ep * 1e-3 < maxW) {
                        // update maxIp (plate current only)
                        maxIp = Math.max(p.ip, maxIp);
                        // collect non-zero plate currents for percentile analysis
                        if (p.ip > 0) {
                            allCurrents.push(p.ip);
                        }
                    }
                }
            }
        }
        // sort currents for percentile calculation
        allCurrents.sort((a, b) => a - b);
        // calculate cutoff threshold using multi-criteria approach
        const measurementNoise = 0.02; // mA - typical uTracer precision floor
        const percentileThreshold = allCurrents.length > 0 ? allCurrents[Math.floor(allCurrents.length * 0.05)] : measurementNoise;
        const maxPercentageThreshold = 0.02 * maxIp; // maximum 2% of max current
        // use the most restrictive (smallest) threshold, but never below measurement noise
        const ipCutoff = Math.max(
            measurementNoise,
            Math.min(percentileThreshold, maxPercentageThreshold)
        );
        // mu points at cutoff
        const mup: Point[] = [];
        // trace
        if (trace) {
            // mu
            trace.estimates.mu = {
                maxIp: maxIp,
                ip: ipCutoff,
                points: mup,
            };
        }
        // calculated mu's (sum)
        let muSum = 0;
        let muCount = 0;
        // loop files
        for (const f of files) {
            // check measurement type (triode and pentode plate characteristics)
            if (f.measurementType === 'IP_VA_VG_VH' || f.measurementType === 'IPIS_VAVS_VG_VH' || f.measurementType === 'IPIS_VA_VG_VS_VH' || f.measurementType === 'IPIS_VG_VA_VS_VH' || f.measurementType === 'IPIS_VG_VAVS_VH') {
                // loop series
                for (const s of f.series) {
                    // grid voltage for this series
                    const eg = (s.eg ?? 0) + f.egOffset;
                    // skip positive grid voltages (not cutoff region)
                    if (eg >= 0)
                        continue;
                    // find points with minimal plate current (near cutoff)
                    for (const p of s.points) {
                        // check if point is in cutoff region (plate current only)
                        if (p.ip <= ipCutoff && p.ip > 0) {
                            // check point meets plate power criteria
                            if (p.ip * p.ep * 1e-3 < maxW) {
                                // add cutoff point for mu calculation
                                mup.push({
                                    ip: p.ip,
                                    ep: p.ep,
                                    eg: eg,
                                });
                            }
                        }
                    }
                }
            }
        }
        // calculate mu from cutoff points using mu = -Va/Vg
        for (const p of mup) {
            // mu estimation formula: mu = -Va/Vg at cutoff
            const muEstimate = -p.ep / p.eg;
            // ensure physically reasonable mu (typical range 1-200)
            if (muEstimate > 1 && muEstimate < 200) {
                muSum += muEstimate;
                muCount++;
            }
        }
        // calculate mu (average of estimates, or default if none found)
        initial.mu = muCount > 0 ? muSum / muCount : 50;
    }
};
