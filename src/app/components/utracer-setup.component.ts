import { AdcData, UTracerResponse, UTracerService } from '../services/utracer.service';
import { CommonModule } from '@angular/common';
import {
    Component,
    EventEmitter,
    inject,
    OnInit,
    Output
} from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
    selector: 'app-utracer-setup',
    templateUrl: './utracer-setup.component.html',
    styleUrl: './utracer-setup.component.scss',
    imports: [CommonModule, FormsModule]
})
export class UTracerSetupComponent implements OnInit {

    @Output() closed = new EventEmitter<void>();

    uTracerService = inject(UTracerService);

    isReading = false;

    uTracerVersion!: string;
    plateVoltageGain!: number;
    screenVoltageGain!: number;
    plateCurrentGain!: number;
    screenCurrentGain!: number;
    powerSupplyVoltageFactor!: number;
    saturationVoltageFactor!: number;
    grid40VoltVoltageFactor!: number;
    grid4VoltVoltageFactor!: number;
    gridSaturationVoltageFactor!: number;

    adcData: AdcData | null = null;

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
        this.saturationVoltageFactor = this.uTracerService.saturationVoltageFactor;
        this.grid40VoltVoltageFactor = this.uTracerService.grid40VoltVoltageFactor;
        this.grid4VoltVoltageFactor = this.uTracerService.grid4VoltVoltageFactor;
        this.gridSaturationVoltageFactor = this.uTracerService.gridSaturationVoltageFactor;
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

    onSaturationVoltageFactorChange() {
        this.uTracerService.saturationVoltageFactor = this.saturationVoltageFactor;
    }

    onGrid40VoltVoltageFactorChange() {
        this.uTracerService.grid40VoltVoltageFactor = this.grid40VoltVoltageFactor;
    }

    onGrid4VoltVoltageFactorChange() {
        this.uTracerService.grid4VoltVoltageFactor = this.grid4VoltVoltageFactor;
    }

    onGridSaturationVoltageFactorChange() {
        this.uTracerService.gridSaturationVoltageFactor = this.gridSaturationVoltageFactor;
    }

    get computedPowerSupplyVoltage(): number {
        // after reading
        if (this.adcData === null)
            return 0;
        // use service method
        return this.uTracerService.readPowerSupplyVoltage(this.adcData);
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
