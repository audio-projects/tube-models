import { CommonModule } from '@angular/common';
import {
    Component,
    EventEmitter,
    Input,
    Output
} from '@angular/core';
import { ModelService } from '../services/model.service';
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

    constructor(private modelService: ModelService) {}

    get spiceModel(): string {
        return `${this.modelService.getDerkEModel(this.tube)}\n\n${this.modelService.getDerkEModelDefinition(this.tube?.derkEModelParameters?.secondaryEmission || false)}`;
    }

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


    // Trigger calculation request to parent component
    calculateSpiceModelParameters() {
        this.calculateRequested.emit();
    }
}
