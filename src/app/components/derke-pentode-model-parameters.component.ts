import { CommonModule } from '@angular/common';
import {
    Component,
    EventEmitter,
    Input,
    Output
} from '@angular/core';
import { ToastService } from '../services/toast.service';
import { TubeInformation } from './tube-information';

@Component({
    selector: 'app-derke-pentode-model-parameters',
    templateUrl: './derke-pentode-model-parameters.component.html',
    styleUrl: './derke-pentode-model-parameters.component.scss',
    imports: [CommonModule],
})
export class DerkEPentodeModelParametersComponent {

    @Input() tube: TubeInformation | undefined = undefined;
    @Input() isCalculating = false;
    @Input() canCalculate = true;
    @Output() calculateRequested = new EventEmitter<void>();

    constructor(private toastService: ToastService) {}

    // Get/set secondary emission checkbox value
    get secondaryEmission(): boolean {
        return this.tube?.derkEModelParameters?.secondaryEmission || false;
    }

    set secondaryEmission(value: boolean) {
        if (this.tube) {
            if (!this.tube.derkEModelParameters) {
                this.tube.derkEModelParameters = {};
            }
            this.tube.derkEModelParameters.secondaryEmission = value;
        }
    }

    // Handle checkbox change event
    onSecondaryEmissionChange(event: Event): void {
        const checkbox = event.target as HTMLInputElement;
        this.secondaryEmission = checkbox.checked;

        // Invalidate the current model parameters since the calculation input has changed
        if (this.tube?.derkEModelParameters) {
            this.tube.derkEModelParameters.calculatedOn = undefined;
        }
    }

    // Computed properties for SPICE model template
    get spiceSubcktLine(): string {
        const cleanTubeName = (this.tube?.name || 'PENTODE').toUpperCase().replace(/[^A-Z0-9]/g, '_');
        return `.SUBCKT ${cleanTubeName} P G2 G1 K`;
    }

    get spiceCommentLine(): string {
        return `* ${this.tube?.name || 'PENTODE'} Pentode Model (Derk Reefman)`;
    }

    get spiceParamLine(): string {
        if (!this.tube?.derkEModelParameters)
            return '';
        const params = this.tube.derkEModelParameters;
        const mu = params.mu?.toFixed(3) || '0';
        const ex = params.ex?.toFixed(3) || '0';
        const kg1 = params.kg1?.toFixed(6) || '0';
        const kp = params.kp?.toFixed(6) || '0';
        const kvb = params.kvb?.toFixed(6) || '0';
        const kg2 = params.kg2?.toFixed(6) || '0';
        const ccg = this.tube.ccg1 || 0;
        const cgp = this.tube.cg1p || 0;
        const ccp = this.tube.ccp || 0;
        const rgi = 2000;
        return `MU=${mu} EX=${ex} KG1=${kg1} KP=${kp} KVB=${kvb} KG2=${kg2} CCG=${ccg} CGP=${cgp} CCP=${ccp} RGI=${rgi}`;
    }

    // Trigger calculation request to parent component
    calculateSpiceModelParameters() {
        this.calculateRequested.emit();
    }
}
