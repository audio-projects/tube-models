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
    selector: 'app-pentode-model-parameters',
    templateUrl: './pentode-model-parameters.component.html',
    styleUrl: './pentode-model-parameters.component.scss',
    imports: [CommonModule],
})
export class PentodeModelParametersComponent {

    @Input() tube: TubeInformation | undefined = undefined;
    @Input() isCalculating = false;
    @Input() canCalculate = true;
    @Output() calculateRequested = new EventEmitter<void>();

    constructor(private toastService: ToastService) {}

    // Computed properties for SPICE model template
    get spiceSubcktLine(): string {
        const cleanTubeName = (this.tube?.name || 'PENTODE').toUpperCase().replace(/[^A-Z0-9]/g, '_');
        return `.SUBCKT ${cleanTubeName} P G2 G1 K`;
    }

    get spiceCommentLine(): string {
        return `* ${this.tube?.name || 'PENTODE'} Pentode Model (Norman Koren)`;
    }

    get spiceParamLine(): string {
        if (!this.tube?.pentodeModelParameters) return '';
        const params = this.tube.pentodeModelParameters;
        const mu = params.mu?.toFixed(3) || '0';
        const ex = params.ex?.toFixed(3) || '0';
        const kg1 = params.kg1?.toFixed(6) || '0';
        const kg2 = params.kg2?.toFixed(6) || '0';
        const kp = params.kp?.toFixed(6) || '0';
        const kvb = params.kvb?.toFixed(6) || '0';
        const ccg1 = this.tube.ccg1 || 0;
        const ccg2 = this.tube.ccg2 || 0;
        const cg1p = this.tube.cg1p || 0;
        const cg2p = this.tube.cg2p || 0;
        const ccp = this.tube.ccp || 0;
        const rgi = 2000;
        return `.PARAM MU=${mu} EX=${ex} KG1=${kg1} KG2=${kg2} KP=${kp} KVB=${kvb} CCG1=${ccg1} CCG2=${ccg2} CG1P=${cg1p} CG2P=${cg2p} CCP=${ccp} RGI=${rgi}`;
    }

    // Trigger calculation request to parent component
    calculateSpiceModelParameters() {
        this.calculateRequested.emit();
    }
}
