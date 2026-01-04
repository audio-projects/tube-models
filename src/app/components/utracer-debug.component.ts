import { AdcData, Averaging, UTracerService } from '../services/utracer.service';
import { Component, inject, Input } from '@angular/core';

@Component({
    selector: 'app-utracer-debug',
    templateUrl: './utracer-debug.component.html',
    styleUrl: './utracer-debug.component.scss',
    imports: []
})
export class UTracerDebugComponent {

    @Input() adcData: AdcData | null = null;
    @Input() averaging: Averaging = 0x40;
    @Input() details = false;
    @Input() alwaysShow = false;

    uTracerService = inject(UTracerService);
}
