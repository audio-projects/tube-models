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
    selector: 'app-triode-model-parameters',
    templateUrl: './triode-model-parameters.component.html',
    styleUrl: './triode-model-parameters.component.scss',
    imports: [CommonModule],
})
export class TriodeModelParametersComponent {

    @Input() tube: TubeInformation | undefined = undefined;
    @Input() isCalculating = false;
    @Input() canCalculate = true;
    @Output() calculateRequested = new EventEmitter<void>();

    constructor(private toastService: ToastService) {}

    // Computed properties for SPICE model template
    get spiceSubcktLine(): string {
        const cleanTubeName = (this.tube?.name || 'TRIODE').toUpperCase().replace(/[^A-Z0-9]/g, '_');
        return `.SUBCKT ${cleanTubeName} P G K`;
    }

    get spiceCommentLine(): string {
        return `* ${this.tube?.name || 'TRIODE'} Triode Model (Norman Koren)`;
    }

    get spiceParamLine(): string {
        if (!this.tube?.triodeModelParameters) return '';
        const params = this.tube.triodeModelParameters;
        const mu = params.mu?.toFixed(3) || '0';
        const ex = params.ex?.toFixed(3) || '0';
        const kg1 = params.kg1?.toFixed(6) || '0';
        const kp = params.kp?.toFixed(6) || '0';
        const kvb = params.kvb?.toFixed(6) || '0';
        const ccg = this.tube.ccg1 || 0;
        const cgp = this.tube.cg1p || 0;
        const ccp = this.tube.ccp || 0;
        const rgi = 2000;
        return `.PARAM MU=${mu} EX=${ex} KG1=${kg1} KP=${kp} KVB=${kvb} CCG=${ccg} CGP=${cgp} CCP=${ccp} RGI=${rgi}`;
    }

    // Trigger calculation request to parent component
    calculateSpiceModelParameters() {
        this.calculateRequested.emit();
    }
}
