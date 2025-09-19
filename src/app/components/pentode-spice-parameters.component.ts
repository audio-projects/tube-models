import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TubeInformation } from './tube-information';
import { File as TubeFile } from '../files';
import { normanKorenPentodeModelError } from '../workers/models/norman-koren-pentode-model-error';
import { ToastService } from '../services/toast.service';

@Component({
    selector: 'app-pentode-spice-parameters',
    templateUrl: './pentode-spice-parameters.component.html',
    styleUrl: './pentode-spice-parameters.component.scss',
    imports: [CommonModule],
})
export class PentodeSpiceParametersComponent {
    @Input() tube: TubeInformation | null = null;
    @Output() tubeChange = new EventEmitter<TubeInformation>();

    isCalculatingSpiceParameters = false;

    constructor(private toastService: ToastService) {}

    // Calculate SPICE model parameters for pentodes
    calculateSpiceModelParameters() {
        if (!this.tube || this.tube.type !== 'Pentode' || !this.tube.files || this.tube.files.length === 0) {
            return;
        }

        // Check if we have pentode measurement files
        const pentodeFiles = this.tube.files.filter(f =>
            f.measurementType === 'IP_EP_EG_VS_VH' ||
            f.measurementType === 'IP_EG_EP_VS_VH' ||
            f.measurementType === 'IP_EP_ES_VG_VH' ||
            f.measurementType === 'IP_ES_EG_VA_VH'
        );

        if (pentodeFiles.length === 0) {
            this.toastService.warning('No suitable pentode measurement files found for SPICE model parameter calculation.', 'Missing Data');
            return;
        }

        // Set loading state
        this.isCalculatingSpiceParameters = true;

        // Use simplified optimization for pentode (Norman Koren model)
        this.optimizePentodeParameters(pentodeFiles);
    }

    private optimizePentodeParameters(files: TubeFile[]) {
        // Initial parameter estimates for pentode
        const mu = 25;
        const ex = 1.35;
        const kg1 = 1000;
        const kg2 = 4000;
        const kp = 100;
        const kvb = 100; // Fixed for Norman Koren pentode model

        const egOffset = this.tube?.egOffset || 0;
        const maximumPlateDissipation = this.tube?.maximumPlateDissipation || 20; // Default 20W for pentodes

        // Simple parameter optimization using grid search
        const bestParameters = { mu, ex, kg1, kg2, kp, kvb };
        let bestError = this.calculateError(files, mu, ex, kg1, kg2, kp, kvb, egOffset, maximumPlateDissipation);

        // Optimize mu (amplification factor)
        for (let testMu = 10; testMu <= 50; testMu += 5) {
            const error = this.calculateError(files, testMu, ex, kg1, kg2, kp, kvb, egOffset, maximumPlateDissipation);
            if (error < bestError) {
                bestError = error;
                bestParameters.mu = testMu;
            }
        }

        // Optimize ex (exponent)
        for (let testEx = 1.2; testEx <= 1.6; testEx += 0.05) {
            const error = this.calculateError(files, bestParameters.mu, testEx, kg1, kg2, kp, kvb, egOffset, maximumPlateDissipation);
            if (error < bestError) {
                bestError = error;
                bestParameters.ex = testEx;
            }
        }

        // Optimize kg1 (grid scaling)
        for (let testKg1 = 500; testKg1 <= 2000; testKg1 += 100) {
            const error = this.calculateError(files, bestParameters.mu, bestParameters.ex, testKg1, kg2, kp, kvb, egOffset, maximumPlateDissipation);
            if (error < bestError) {
                bestError = error;
                bestParameters.kg1 = testKg1;
            }
        }

        // Optimize kg2 (screen grid scaling)
        for (let testKg2 = 2000; testKg2 <= 8000; testKg2 += 500) {
            const error = this.calculateError(files, bestParameters.mu, bestParameters.ex, bestParameters.kg1, testKg2, kp, kvb, egOffset, maximumPlateDissipation);
            if (error < bestError) {
                bestError = error;
                bestParameters.kg2 = testKg2;
            }
        }

        // Store the calculated parameters
        this.tube!.pentodeSpiceModelParameters = {
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
        console.log('Pentode SPICE model parameters calculated:', this.tube!.pentodeSpiceModelParameters);
    }

    private calculateError(files: TubeFile[], mu: number, ex: number, kg1: number, kg2: number, kp: number, kvb: number, egOffset: number, maximumPlateDissipation: number): number {
        return normanKorenPentodeModelError(files, mu, kp, kvb, ex, kg1, kg2, egOffset, maximumPlateDissipation);
    }

    // Generate SPICE model text for copying
    generateSpiceModelText(): string {
        if (!this.tube?.pentodeSpiceModelParameters?.calculated) {
            return '';
        }

        const params = this.tube.pentodeSpiceModelParameters;
        const tubeName = this.tube.name || 'PENTODE';

        return `* ${tubeName} Pentode Model - Norman Koren Parameters
* Generated on ${new Date().toLocaleString()}
.SUBCKT ${tubeName} A G2 G1 C
* Anode Screen-Grid Control-Grid Cathode
E1 7 0 VALUE={G2*LOG(1+EXP(KP*(1/MU+V(G1,C)/G2)))/KP}
RE1 7 0 1G
G1 A C VALUE={IF(V(7)>=0, 1000*PWR(V(7),EX)*ATAN(V(A,C)/KVB)/KG1, 0)}
G2 G2 C VALUE={IF(V(G1,C)+G2/MU>0, 1000*PWR(V(G1,C)+G2/MU,EX)/KG2, 0)}
RCP A C 1G
RCS G2 C 1G
.PARAM MU=${params.mu?.toFixed(6)} EX=${params.ex?.toFixed(6)} KG1=${params.kg1?.toFixed(6)} KG2=${params.kg2?.toFixed(6)} KP=${params.kp?.toFixed(6)} KVB=${params.kvb?.toFixed(6)}
.ENDS ${tubeName}`;
    }

    // Copy SPICE model to clipboard
    copySpiceModel() {
        const spiceText = this.generateSpiceModelText();
        if (spiceText) {
            navigator.clipboard.writeText(spiceText).then(() => {
                this.toastService.success('Pentode SPICE model copied to clipboard!', 'Copied');
            }).catch(() => {
                // Fallback for older browsers
                const textArea = document.createElement('textarea');
                textArea.value = spiceText;
                document.body.appendChild(textArea);
                textArea.select();
                document.execCommand('copy');
                document.body.removeChild(textArea);
                this.toastService.success('Pentode SPICE model copied to clipboard!', 'Copied');
            });
        }
    }
}
