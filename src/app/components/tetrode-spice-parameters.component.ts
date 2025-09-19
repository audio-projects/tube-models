import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TubeInformation } from './tube-information';
import { File as TubeFile } from '../files';
import { normanKorenPentodeModelError } from '../workers/models/norman-koren-pentode-model-error';
import { ToastService } from '../services/toast.service';

@Component({
    selector: 'app-tetrode-spice-parameters',
    templateUrl: './tetrode-spice-parameters.component.html',
    styleUrl: './tetrode-spice-parameters.component.scss',
    imports: [CommonModule],
})
export class TetrodeSpiceParametersComponent {
    @Input() tube: TubeInformation | null = null;
    @Output() tubeChange = new EventEmitter<TubeInformation>();

    isCalculatingSpiceParameters = false;

    constructor(private toastService: ToastService) {}

    // Calculate SPICE model parameters for tetrodes
    public calculateSpiceModelParameters() {
        if (!this.tube || this.tube.type !== 'Tetrode' || !this.tube.files || this.tube.files.length === 0) {
            return;
        }

        // Check if we have tetrode measurement files (similar to pentode)
        const tetrodeFiles = this.tube.files.filter(f =>
            f.measurementType === 'IP_EP_EG_VS_VH' ||
            f.measurementType === 'IP_EG_EP_VS_VH' ||
            f.measurementType === 'IP_EP_ES_VG_VH' ||
            f.measurementType === 'IP_ES_EG_VA_VH'
        );

        if (tetrodeFiles.length === 0) {
            this.toastService.warning('No suitable tetrode measurement files found for SPICE model parameter calculation.', 'Missing Data');
            return;
        }

        // Set loading state
        this.isCalculatingSpiceParameters = true;

        // Use simplified optimization for tetrode (similar to pentode but optimized for beam power tubes)
        this.optimizeTetrodeParameters(tetrodeFiles);
    }

    private optimizeTetrodeParameters(files: TubeFile[]) {
        // Initial parameter estimates for tetrode (beam power tube characteristics)
        const mu = 8; // Lower mu for beam power tubes
        const ex = 1.5; // Higher exponent for beam tubes
        const kg1 = 1500;
        const kg2 = 5000; // Higher screen grid scaling
        const kp = 60; // Lower kp for beam tubes
        const kvb = 300; // Higher knee voltage for power tubes

        const egOffset = this.tube?.egOffset || 0;
        const maximumPlateDissipation = this.tube?.maximumPlateDissipation || 30; // Default 30W for tetrodes

        // Simple parameter optimization using grid search
        const bestParameters = { mu, ex, kg1, kg2, kp, kvb };
        let bestError = this.calculateError(files, mu, ex, kg1, kg2, kp, kvb, egOffset, maximumPlateDissipation);

        // Optimize mu (amplification factor) - beam tetrodes typically have lower mu
        for (let testMu = 5; testMu <= 15; testMu += 1) {
            const error = this.calculateError(files, testMu, ex, kg1, kg2, kp, kvb, egOffset, maximumPlateDissipation);
            if (error < bestError) {
                bestError = error;
                bestParameters.mu = testMu;
            }
        }

        // Optimize ex (exponent) - beam tubes tend to have higher exponents
        for (let testEx = 1.3; testEx <= 1.8; testEx += 0.05) {
            const error = this.calculateError(files, bestParameters.mu, testEx, kg1, kg2, kp, kvb, egOffset, maximumPlateDissipation);
            if (error < bestError) {
                bestError = error;
                bestParameters.ex = testEx;
            }
        }

        // Optimize kg1 (control grid scaling)
        for (let testKg1 = 800; testKg1 <= 2500; testKg1 += 100) {
            const error = this.calculateError(files, bestParameters.mu, bestParameters.ex, testKg1, kg2, kp, kvb, egOffset, maximumPlateDissipation);
            if (error < bestError) {
                bestError = error;
                bestParameters.kg1 = testKg1;
            }
        }

        // Optimize kg2 (screen grid scaling) - beam tetrodes have different screen characteristics
        for (let testKg2 = 3000; testKg2 <= 8000; testKg2 += 500) {
            const error = this.calculateError(files, bestParameters.mu, bestParameters.ex, bestParameters.kg1, testKg2, kp, kvb, egOffset, maximumPlateDissipation);
            if (error < bestError) {
                bestError = error;
                bestParameters.kg2 = testKg2;
            }
        }

        // Store the calculated parameters
        this.tube!.tetrodeSpiceModelParameters = {
            mu: bestParameters.mu,
            ex: bestParameters.ex,
            kg1: bestParameters.kg1,
            kg2: bestParameters.kg2,
            kp: bestParameters.kp,
            kvb: bestParameters.kvb,
            calculated: true,
            lastCalculated: new Date().toISOString()
        };

        this.isCalculatingSpiceParameters = false;
        this.tubeChange.emit(this.tube!);
        console.log('Tetrode SPICE model parameters calculated:', this.tube!.tetrodeSpiceModelParameters);
    }

    private calculateError(files: TubeFile[], mu: number, ex: number, kg1: number, kg2: number, kp: number, kvb: number, egOffset: number, maximumPlateDissipation: number): number {
        // Use the same error function as pentode but with tetrode-specific optimizations
        return normanKorenPentodeModelError(files, mu, kp, kvb, ex, kg1, kg2, egOffset, maximumPlateDissipation);
    }

    // Generate SPICE model text for copying
    generateSpiceModelText(): string {
        if (!this.tube?.tetrodeSpiceModelParameters?.calculated) {
            return '';
        }

        const params = this.tube.tetrodeSpiceModelParameters;
        const tubeName = this.tube.name || 'TETRODE';

        return `* ${tubeName} Beam Power Tetrode Model - Norman Koren Parameters
* Generated on ${new Date().toLocaleString()}
.SUBCKT ${tubeName} A G2 G1 C
* Anode Screen-Grid Control-Grid Cathode
E1 7 0 VALUE={G2*LOG(1+EXP(KP*(1/MU+V(G1,C)/G2)))/KP}
RE1 7 0 1G
G1 A C VALUE={IF(V(7)>=0, 1000*PWR(V(7),EX)*ATAN(V(A,C)/KVB)/KG1, 0)}
G2 G2 C VALUE={IF(V(G1,C)+G2/MU>0, 1000*PWR(V(G1,C)+G2/MU,EX)/KG2, 0)}
RCP A C 1G
RCS G2 C 1G
* Beam forming plates improve screen linearity
.PARAM MU=${params.mu?.toFixed(6)} EX=${params.ex?.toFixed(6)} KG1=${params.kg1?.toFixed(6)} KG2=${params.kg2?.toFixed(6)} KP=${params.kp?.toFixed(6)} KVB=${params.kvb?.toFixed(6)}
.ENDS ${tubeName}`;
    }

    // Copy SPICE model to clipboard
    copySpiceModel() {
        const spiceText = this.generateSpiceModelText();
        if (spiceText) {
            navigator.clipboard.writeText(spiceText).then(() => {
                this.toastService.success('Tetrode SPICE model copied to clipboard!', 'Copied');
            }).catch(() => {
                // Fallback for older browsers
                const textArea = document.createElement('textarea');
                textArea.value = spiceText;
                document.body.appendChild(textArea);
                textArea.select();
                document.execCommand('copy');
                document.body.removeChild(textArea);
                this.toastService.success('Tetrode SPICE model copied to clipboard!', 'Copied');
            });
        }
    }
}
