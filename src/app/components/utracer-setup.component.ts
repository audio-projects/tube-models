import { AdcData, Averaging, UTracerService } from '../services/utracer.service';
import { CommonModule } from '@angular/common';
import {
    Component,
    EventEmitter,
    inject,
    OnInit,
    Output
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { UTracerDebugComponent } from './utracer-debug.component';

@Component({
    selector: 'app-utracer-setup',
    templateUrl: './utracer-setup.component.html',
    styleUrl: './utracer-setup.component.scss',
    imports: [CommonModule, FormsModule, UTracerDebugComponent]
})
export class UTracerSetupComponent implements OnInit {

    @Output() closed = new EventEmitter<void>();

    uTracerService = inject(UTracerService);

    isReading = false;

    uTracerVersion!: string;

    powerSupplyVoltageGain!: number;

    plateVoltageGain!: number;
    screenVoltageGain!: number;
    plateCurrentGain!: number;
    screenCurrentGain!: number;

    negativeVoltageGain!: number;
    grid1VoltVoltageGain!: number;
    grid4VoltVoltageGain!: number;
    grid40VoltVoltageGain!: number;

    adcData: AdcData | null = null;
    averaging: Averaging = 0x40;

    ngOnInit() {
        // initialize settings
        this.uTracerVersion = this.uTracerService.hardwareVersion;
        this.powerSupplyVoltageGain = this.uTracerService.powerSupplyVoltageGain;
        this.plateVoltageGain = this.uTracerService.plateVoltageGain;
        this.screenVoltageGain = this.uTracerService.screenVoltageGain;
        this.plateCurrentGain = this.uTracerService.plateCurrentGain;
        this.screenCurrentGain = this.uTracerService.screenCurrentGain;

        this.negativeVoltageGain = this.uTracerService.negativeVoltageGain;
        this.grid1VoltVoltageGain = this.uTracerService.grid1VoltVoltageGain;
        this.grid4VoltVoltageGain = this.uTracerService.grid4VoltVoltageGain;
        this.grid40VoltVoltageGain = this.uTracerService.grid40VoltVoltageGain;
    }

    onVersionChange() {
        this.uTracerService.hardwareVersion = this.uTracerVersion;
    }

    onPlateVoltageGainChange() {
        this.uTracerService.plateVoltageGain = this.plateVoltageGain;
    }

    onScreenVoltageGainChange() {
        this.uTracerService.screenVoltageGain = this.screenVoltageGain;
    }

    onPlateCurrentGainChange() {
        this.uTracerService.plateCurrentGain = this.plateCurrentGain;
    }

    onScreenCurrentGainChange() {
        this.uTracerService.screenCurrentGain = this.screenCurrentGain;
    }


    onPowerSupplyVoltageGainChange() {
        this.uTracerService.powerSupplyVoltageGain = this.powerSupplyVoltageGain;
    }

    onNegativeVoltageGainChange() {
        this.uTracerService.negativeVoltageGain = this.negativeVoltageGain;
    }

    onGrid1VoltVoltageGainChange() {
        this.uTracerService.grid1VoltVoltageGain = this.grid1VoltVoltageGain;
    }

    onGrid4VoltVoltageGainChange() {
        this.uTracerService.grid4VoltVoltageGain = this.grid4VoltVoltageGain;
    }

    onGrid40VoltVoltageGainChange() {
        this.uTracerService.grid40VoltVoltageGain = this.grid40VoltVoltageGain;
    }

    async read() {
        try {
            // set reading state
            this.isReading = true;
            // reset uTracer
            await this.uTracerService.start(0, 0x40, 0, 0);
            // ping uTracer, read data
            this.adcData = await this.uTracerService.ping();
        }
        catch (error) {
            // log error
            console.error('Failed to ping uTracer:', error);
        }
        finally {
            // reset reading state
            this.isReading = false;
        }
    }

    close() {
        // close
        this.closed.emit();
    }
}
