import { CommonModule } from '@angular/common';
import {
    Component,
    EventEmitter,
    inject,
    OnInit,
    Output
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { UTracerService, UTracerResponse } from '../services/utracer.service';

@Component({
    selector: 'app-utracer-setup',
    templateUrl: './utracer-setup.component.html',
    styleUrl: './utracer-setup.component.scss',
    imports: [CommonModule, FormsModule]
})
export class UTracerSetupComponent implements OnInit {

    @Output() closed = new EventEmitter<void>();

    private uTracerService = inject(UTracerService);

    isReading = false;

    uTracerVersion!: string;
    plateVoltageGain!: number;
    screenVoltageGain!: number;
    plateCurrentGain!: number;
    screenCurrentGain!: number;
    powerSupplyVoltageFactor!: number;

    // read values
    plateVoltage: number | null = null;
    screenVoltage: number | null = null;
    plateCurrentAfterPGA: number | null = null;
    screenCurrentAfterPGA: number | null = null;
    powerSupplyVoltage: number | null = null;
    negativeVoltage: number | null = null;

    ngOnInit() {
        // initialize settings
        this.uTracerVersion = this.uTracerService.hardwareVersion;
        this.plateVoltageGain = this.uTracerService.plateVoltageGain;
        this.screenVoltageGain = this.uTracerService.screenVoltageGain;
        this.plateCurrentGain = this.uTracerService.plateCurrentGain;
        this.screenCurrentGain = this.uTracerService.screenCurrentGain;
        this.powerSupplyVoltageFactor = this.uTracerService.powerSupplyVoltageFactor;
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

    onPowerSupplyVoltageFactorChange() {
        this.uTracerService.powerSupplyVoltageFactor = this.powerSupplyVoltageFactor;
    }

    async read() {
        try {
            // set reading state
            this.isReading = true;
            // reset uTracer
            await this.uTracerService.start(0, 0x40, 0, 0);
            // ping uTracer, read data
            const response: UTracerResponse = await this.uTracerService.ping();
            // read values
            this.plateVoltage = response.plateVoltage;
            this.screenVoltage = response.screenVoltage;
            this.plateCurrentAfterPGA = response.plateCurrentAfterPGA;
            this.screenCurrentAfterPGA = response.screenCurrentAfterPGA;
            this.powerSupplyVoltage = response.powerSupplyVoltage;
            this.negativeVoltage = response.negativeVoltage;
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
