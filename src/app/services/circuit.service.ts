import { Injectable } from '@angular/core';
import { TubeInformation } from '../components/tube-information';
import { File } from '../files';
import { ModelService } from './model.service';

@Injectable({
    providedIn: 'root'
})
export class CircuitService {

    constructor(private modelService: ModelService) { }

    generateTriodePlateCharacteristicsCircuit(tube: TubeInformation, file: File, model: {name: string, model: string}, definition: string): string {
        // check if this is a plate characteristics measurement
        if (file.measurementType !== 'IP_VA_VG_VH' && file.measurementType !== 'IPIS_VAVS_VG_VH') {
            // response
            return `* Error: File "${file.name}" is not a plate characteristics measurement\n` +
                   `* Expected measurement type: IP_VA_VG_VH (Ia vs Va with constant Vg)\n` +
                   `* Actual measurement type: ${file.measurementType} (${file.measurementTypeLabel})\n` +
                   `* Please select a file with plate characteristics data.`;
        }
        // check model
        if (!model)
            return '* Error: No triode model parameters available for this tube';
        // find max plate voltage (Va) from all points in all series
        let maxVa = -Infinity;
        // loop through series and points
        for (const series of file.series) {
            // loop series points
            for (const point of series.points) {
                if (point.ep > maxVa)
                    maxVa = point.ep;
            }
        }
        // Round to nearest integer
        maxVa = Math.ceil(maxVa);
        // Extract grid voltages from series (assuming plate characteristics where Vg is constant per series)
        const gridVoltages: number[] = [];
        // loop series
        for (const series of file.series) {
            // Check if grid voltage (Vg) is defined
            if (series.eg !== undefined)
                gridVoltages.push(series.eg + file.egOffset);
        }
        // Sort grid voltages in ascending order
        gridVoltages.sort((a, b) => a - b);
        // Determine grid voltage sweep range
        const minVg = gridVoltages.length > 0 ? gridVoltages[0] : -3.5;
        const maxVg = gridVoltages.length > 0 ? gridVoltages[gridVoltages.length - 1] : -1.5;
        // Calculate step size (ideally matching the spacing between series)
        let vgStep = 0.5;
        if (gridVoltages.length > 1) {
            const steps = gridVoltages.slice(1).map((v, i) => v - gridVoltages[i]);
            vgStep = Math.min(...steps.filter(s => s > 0));
        }
        // Build the circuit
        const lines: string[] = [];
        // circuit
        lines.push(`* Plate Characteristics`);
        lines.push('V1 1 0 0');
        lines.push('R1 1 G 10       ; Grid coupling resistor');
        lines.push('R2 G 0 1Meg     ; Grid leak resistor');
        lines.push('R3 K 0 0.01     ; Cathode sense resistor');
        lines.push('V2 2 0 0');
        lines.push('R4 2 P 1        ; Plate series resistor');
        lines.push(`X1 P G K ${model.name}`);
        lines.push('.control');
        lines.push(`    dc V2 0 ${maxVa} 1 V1 ${minVg.toFixed(1)} ${maxVg.toFixed(1)} ${vgStep.toFixed(1)}`);
        lines.push('    save v(2) v(P) i(R4)');
        lines.push('    gnuplot dc v(2)-v(P)');
        lines.push('.endc');
        lines.push('.end');
        lines.push('');
        lines.push(model.model);
        lines.push('');
        lines.push(definition);
        lines.push('');
        // return result
        return lines.join('\n');
    }

    generatePentodePlateCharacteristicsCircuit(tube: TubeInformation, file: File, model: {name: string, model: string}, definition: string): string {
        // check if this is a plate characteristics measurement
        if (file.measurementType !== 'IPIS_VA_VG_VS_VH') {
            // response
            return `* Error: File "${file.name}" is not a plate characteristics measurement\n` +
                   `* Expected measurement type: IPIS_VA_VG_VS_VH (Ia vs Va with constant Vg)\n` +
                   `* Actual measurement type: ${file.measurementType} (${file.measurementTypeLabel})\n` +
                   `* Please select a file with plate characteristics data.`;
        }
        // check model
        if (!model)
            return '* Error: No pentode model parameters available for this tube';
        // find max plate voltage (Va) from all points in all series
        let maxVa = -Infinity;
        // loop through series and points
        for (const series of file.series) {
            // loop series points
            for (const point of series.points) {
                if (point.ep > maxVa)
                    maxVa = point.ep;
            }
        }
        // Round to nearest integer
        maxVa = Math.ceil(maxVa);
        // Extract grid voltages from series (assuming plate characteristics where Vg is constant per series)
        const gridVoltages: number[] = [];
        // loop series
        for (const series of file.series) {
            // Check if grid voltage (Vg) is defined
            if (series.eg !== undefined)
                gridVoltages.push(series.eg + file.egOffset);
        }
        // Sort grid voltages in ascending order
        gridVoltages.sort((a, b) => a - b);
        // Determine grid voltage sweep range
        const minVg = gridVoltages.length > 0 ? gridVoltages[0] : -3.5;
        const maxVg = gridVoltages.length > 0 ? gridVoltages[gridVoltages.length - 1] : -1.5;
        // Calculate step size (ideally matching the spacing between series)
        let vgStep = 0.5;
        if (gridVoltages.length > 1) {
            const steps = gridVoltages.slice(1).map((v, i) => v - gridVoltages[i]);
            vgStep = Math.min(...steps.filter(s => s > 0));
        }
        // Build the circuit
        const lines: string[] = [];
        // circuit
        lines.push(`* Plate Characteristics`);
        lines.push('V1 1 0 0');
        lines.push('R1 1 G 10       ; Grid coupling resistor');
        lines.push('R2 G 0 1Meg     ; Grid leak resistor');
        lines.push('R3 K 0 0.01     ; Cathode sense resistor');
        lines.push('V2 2 0 0');
        lines.push('R4 2 P 1        ; Plate series resistor');
        lines.push(`V3 3 0 ${file.es?.toFixed(0)}`);
        lines.push('R5 3 S 1        ; Screen series resistor');
        lines.push(`X1 P G K S ${model.name}`);
        lines.push('.control');
        lines.push(`    dc V2 0 ${maxVa} 1 V1 ${minVg.toFixed(1)} ${maxVg.toFixed(1)} ${vgStep.toFixed(1)}`);
        lines.push('    save v(2) v(P) v(S) i(R4) i(R5)');
        lines.push('    gnuplot dc v(2)-v(P) v(3)-v(S)');
        lines.push('.endc');
        lines.push('.end');
        lines.push('');
        lines.push(model.model);
        lines.push('');
        lines.push(definition);
        lines.push('');
        // return result
        return lines.join('\n');
    }
}
