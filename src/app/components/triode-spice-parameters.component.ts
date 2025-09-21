import { CommonModule } from '@angular/common';
import {
    Component,
    EventEmitter,
    Input,
    Output
} from '@angular/core';
import { ToastService } from '../services/toast.service';

export interface TriodeModelParameters {
    mu?: number;
    ex?: number;
    kg1?: number;
    kg2?: number;
    kp?: number;
    kvb?: number;
    calculated?: boolean;
    lastCalculated?: string;
}

@Component({
    selector: 'app-triode-spice-parameters',
    templateUrl: './triode-spice-parameters.component.html',
    styleUrl: './triode-spice-parameters.component.scss',
    imports: [CommonModule],
})
export class TriodeSpiceParametersComponent {

    @Input() triodeModelParameters: TriodeModelParameters | undefined = undefined;
    @Input() tubeName = 'TRIODE';
    @Input() isCalculating = false;
    @Input() canCalculate = true;
    @Output() calculateRequested = new EventEmitter<void>();

    constructor(private toastService: ToastService) {}

    // Computed properties for SPICE model template
    get spiceSubcktLine(): string {
        const cleanTubeName = (this.tubeName || 'TRIODE').toUpperCase().replace(/[^A-Z0-9]/g, '_');
        return `.SUBCKT ${cleanTubeName} P G K`;
    }

    get spiceCommentLine(): string {
        return `* ${this.tubeName} Triode Model (Norman Koren)`;
    }

    get spiceParamLine(): string {
        if (!this.triodeModelParameters) return '';
        const mu = this.triodeModelParameters.mu?.toFixed(3) || '0';
        const ex = this.triodeModelParameters.ex?.toFixed(3) || '0';
        const kg1 = this.triodeModelParameters.kg1?.toFixed(6) || '0';
        const kp = this.triodeModelParameters.kp?.toFixed(6) || '0';
        const kvb = this.triodeModelParameters.kvb?.toFixed(6) || '0';
        return `.PARAM MU=${mu} EX=${ex} KG1=${kg1} KP=${kp} KVB=${kvb}`;
    }

    // Trigger calculation request to parent component
    calculateSpiceModelParameters() {
        this.calculateRequested.emit();
    }
}
