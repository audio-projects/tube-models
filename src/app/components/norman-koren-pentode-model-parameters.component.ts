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
    selector: 'app-norman-koren-pentode-model-parameters',
    templateUrl: './norman-koren-pentode-model-parameters.component.html',
    styleUrl: './norman-koren-pentode-model-parameters.component.scss',
    imports: [CommonModule],
})
export class NormanKorenPentodeModelParametersComponent {

    @Input() tube: TubeInformation | undefined = undefined;
    @Input() isCalculating = false;
    @Input() canCalculate = true;
    @Output() calculateRequested = new EventEmitter<void>();

    constructor(private modelService: ModelService) {}

    get spiceModel(): string {
        return `${this.modelService.getPentodeModel(this.tube).model}\n\n${this.modelService.getPentodeModelDefinition()}`;
    }

    // Trigger calculation request to parent component
    calculateSpiceModelParameters() {
        this.calculateRequested.emit();
    }
}
