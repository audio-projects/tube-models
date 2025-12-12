import { CommonModule } from '@angular/common';
import {
    Component,
    EventEmitter,
    Input,
    Output,
    inject
} from '@angular/core';
import { ModelService } from '../services/model.service';
import { TubeInformation } from './tube-information';

@Component({
    selector: 'app-derk-pentode-model-parameters',
    templateUrl: './derk-pentode-model-parameters.component.html',
    styleUrl: './derk-pentode-model-parameters.component.scss',
    imports: [CommonModule],
})
export class DerkPentodeModelParametersComponent {

    @Input() tube: TubeInformation | undefined = undefined;
    @Input() isCalculating = false;
    @Input() canCalculate = true;
    @Output() calculateRequested = new EventEmitter<void>();
    private modelService = inject(ModelService);

    get spiceModel(): string {
        return `${this.modelService.getDerkModel(this.tube).model}\n\n${this.modelService.getDerkModelDefinition(this.tube?.derkModelParameters?.secondaryEmission || false)}`;
    }

    // Get/set secondary emission checkbox value
    get secondaryEmission(): boolean {
        return this.tube?.derkModelParameters?.secondaryEmission || false;
    }

    set secondaryEmission(value: boolean) {
        if (this.tube) {
            if (!this.tube.derkModelParameters) {
                this.tube.derkModelParameters = {};
            }
            this.tube.derkModelParameters.secondaryEmission = value;
        }
    }

    // Handle checkbox change event
    onSecondaryEmissionChange(event: Event): void {
        const checkbox = event.target as HTMLInputElement;
        this.secondaryEmission = checkbox.checked;

        // Invalidate the current model parameters since the calculation input has changed
        if (this.tube?.derkModelParameters) {
            this.tube.derkModelParameters.calculatedOn = undefined;
        }
    }

    // Trigger calculation request to parent component
    calculateSpiceModelParameters() {
        this.calculateRequested.emit();
    }

    // Reset model parameters
    resetParameters() {
        if (this.tube) {
            delete this.tube.derkModelParameters;
        }
    }
}
