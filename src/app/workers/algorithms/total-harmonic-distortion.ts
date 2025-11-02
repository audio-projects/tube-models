import { complex, Complex, fft } from 'mathjs';

export const totalHarmonicDistortion = function (plateCharacteristics: (eg: number) => number): number {
    // value used in calculations
    const pi2 = Math.PI * 2;
    // assumming 512 points in a cycle (must be even, ideally a power of 2)
    const interval = pi2 / 512;
    // ip array
    const ips: Complex[] = [];
    // loop
    for (let t = 0; t < pi2; t += interval) {
        // grid voltage
        const eg = Math.sin(t);
        // evaluate the plate characteristics
        ips.push(complex(plateCharacteristics(eg), 0));
    }
    // perform FFT on the ip array
    const r: Complex[] = fft(ips);
    // fundamental magnitude
    const r1 = Math.sqrt(r[1].re * r[1].re + r[1].im * r[1].im);
    // sum of squares of harmonics
    let sum = 0;
    // loop harmonics until Nyquist frequency
    for (let h = 2; h < r.length / 2; h++)
        sum += r[h].re * r[h].re + r[h].im * r[h].im;
    // thd = 48.343%
    return 100 * Math.sqrt(sum) / r1;
};
