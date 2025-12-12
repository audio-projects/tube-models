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
    selector: 'app-norman-koren-triode-model-parameters',
    templateUrl: './norman-koren-triode-model-parameters.component.html',
    styleUrl: './norman-koren-triode-model-parameters.component.scss',
    imports: [CommonModule],
})
export class NormanKorenTriodeModelParametersComponent {

    @Input() tube: TubeInformation | undefined = undefined;
    @Input() isCalculating = false;
    @Input() canCalculate = true;
    @Output() calculateRequested = new EventEmitter<void>();
    private modelService = inject(ModelService);

    get spiceModel(): string {
        return `${this.modelService.getTriodeModel(this.tube).model}\n\n${this.modelService.getTriodeModelDefinition()}`;
    }

    // Trigger calculation request to parent component
    calculateSpiceModelParameters() {
        this.calculateRequested.emit();
    }

    // Reset model parameters
    resetParameters() {
        if (this.tube) {
            delete this.tube.triodeModelParameters;
        }
    }
}
