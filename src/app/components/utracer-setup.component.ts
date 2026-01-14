import { AdcData, UTracerService } from '../services/utracer.service';
import { CommonModule } from '@angular/common';
import {
    Component,
    EventEmitter,
    inject,
    OnInit,
    Output
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ToastService } from '../services/toast.service';
import { UTracerDebugComponent } from './utracer-debug.component';
import { UTracerReaderService } from '../services/utracer-reader.service';

@Component({
    selector: 'app-utracer-setup',
    templateUrl: './utracer-setup.component.html',
    styleUrl: './utracer-setup.component.scss',
    imports: [CommonModule, FormsModule, UTracerDebugComponent],
    providers: [UTracerReaderService]
})
export class UTracerSetupComponent implements OnInit {

    @Output() closed = new EventEmitter<void>();

    uTracerService = inject(UTracerService);
    uTracerReaderService = inject(UTracerReaderService);
    private toastService = inject(ToastService);

    uTracerVersion!: string;

    powerSupplyVoltageGain!: number;

    plateVoltageGain!: number;
    plateSaturationVoltage!: number;
    screenVoltageGain!: number;
    screenSaturationVoltage!: number;

    plateCurrentGain!: number;
    screenCurrentGain!: number;

    gridSaturationVoltage!: number;
    grid4VoltVoltageGain!: number;
    grid40VoltVoltageGain!: number;

    // initial values for reset
    private initialPowerSupplyVoltageGain!: number;
    private initialPlateVoltageGain!: number;
    private initialPlateSaturationVoltage!: number;
    private initialScreenVoltageGain!: number;
    private initialScreenSaturationVoltage!: number;
    private initialPlateCurrentGain!: number;
    private initialScreenCurrentGain!: number;
    private initialGridSaturationVoltage!: number;
    private initialGrid4VoltVoltageGain!: number;
    private initialGrid40VoltVoltageGain!: number;

    adcData: AdcData | null = null;

    // voltages
    testGridVoltage = 0;
    testPlateVoltage = 0;
    testScreenVoltage = 0;
    testHeaterVoltage = 0;

    autoReadEnabled = false;

    heatingProgress = 0;
    heaterVoltage = 0;

    constructor() {
        // listen to errors
        this.uTracerReaderService.error$
            .pipe(takeUntilDestroyed())
            .subscribe(error => {
                // log error
                console.error('uTracer Reader Error:', error);
                // show user message
                this.toastService.error(error.message || 'An unknown error occurred in the uTracer Reader Service');
            });
        // listen to heater status updates
        this.uTracerReaderService.heater$
            .pipe(takeUntilDestroyed())
            .subscribe(status => {
                // heater voltage and progress
                this.heaterVoltage = status.voltage;
                this.heatingProgress = status.percentage;
            });
        // listen to adc data updates
        this.uTracerReaderService.adcData$
            .pipe(takeUntilDestroyed())
            .subscribe(adcData => this.adcData = adcData);
    }

    ngOnInit() {
        // initialize settings
        this.uTracerVersion = this.uTracerService.hardwareVersion;
        // voltage/current calibration
        this.powerSupplyVoltageGain = this.uTracerService.powerSupplyVoltageGain;
        this.plateVoltageGain = this.uTracerService.plateVoltageGain;
        this.plateSaturationVoltage = this.uTracerService.plateSaturationVoltage;
        this.screenVoltageGain = this.uTracerService.screenVoltageGain;
        this.screenSaturationVoltage = this.uTracerService.screenSaturationVoltage;
        this.plateCurrentGain = this.uTracerService.plateCurrentGain;
        this.screenCurrentGain = this.uTracerService.screenCurrentGain;
        // negative voltage calibration
        this.grid40VoltVoltageGain = this.uTracerService.grid40VoltVoltageGain;
        this.grid4VoltVoltageGain = this.uTracerService.grid4VoltVoltageGain;
        this.gridSaturationVoltage = this.uTracerService.gridSaturationVoltage;
        // store initial values
        this.initialPowerSupplyVoltageGain = this.powerSupplyVoltageGain;
        this.initialPlateVoltageGain = this.plateVoltageGain;
        this.initialPlateSaturationVoltage = this.plateSaturationVoltage;
        this.initialScreenVoltageGain = this.screenVoltageGain;
        this.initialScreenSaturationVoltage = this.screenSaturationVoltage;
        this.initialPlateCurrentGain = this.plateCurrentGain;
        this.initialScreenCurrentGain = this.screenCurrentGain;
        this.initialGridSaturationVoltage = this.gridSaturationVoltage;
        this.initialGrid4VoltVoltageGain = this.grid4VoltVoltageGain;
        this.initialGrid40VoltVoltageGain = this.grid40VoltVoltageGain;
        // schedule service initialization
        setTimeout(async () => await this.uTracerReaderService.initialize(), 100);
    }

    onReset() {
        // reset all gains to initial values
        this.powerSupplyVoltageGain = this.initialPowerSupplyVoltageGain;
        this.plateVoltageGain = this.initialPlateVoltageGain;
        this.plateSaturationVoltage = this.initialPlateSaturationVoltage;
        this.screenVoltageGain = this.initialScreenVoltageGain;
        this.plateCurrentGain = this.initialPlateCurrentGain;
        this.screenCurrentGain = this.initialScreenCurrentGain;
        this.gridSaturationVoltage = this.initialGridSaturationVoltage;
        this.grid4VoltVoltageGain = this.initialGrid4VoltVoltageGain;
        this.grid40VoltVoltageGain = this.initialGrid40VoltVoltageGain;
        // apply changes
        this.onPowerSupplyVoltageGainChange();
        this.onPlateVoltageGainChange();
        this.onPlateSaturationVoltageChange();
        this.onScreenVoltageGainChange();
        this.onScreenSaturationVoltageChange();
        this.onPlateCurrentGainChange();
        this.onScreenCurrentGainChange();
        this.onGridSaturationVoltageChange();
        this.onGrid4VoltVoltageGainChange();
        this.onGrid40VoltVoltageGainChange();
    }

    onVersionChange() {
        // update uTracer version
        this.uTracerService.hardwareVersion = this.uTracerVersion;
        // reset test voltages (might be out of range for new version)
        this.testPlateVoltage = 0;
        this.testScreenVoltage = 0;
        this.testGridVoltage = 0;
        this.testHeaterVoltage = 0;
        this.heatingProgress = 0;
    }

    onPlateVoltageGainChange() {
        this.uTracerService.plateVoltageGain = this.plateVoltageGain;
    }

    onPlateSaturationVoltageChange() {
        this.uTracerService.plateSaturationVoltage = this.plateSaturationVoltage;
    }

    onScreenVoltageGainChange() {
        this.uTracerService.screenVoltageGain = this.screenVoltageGain;
    }

    onScreenSaturationVoltageChange() {
        this.uTracerService.screenSaturationVoltage = this.screenSaturationVoltage;
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

    onGridSaturationVoltageChange() {
        this.uTracerService.gridSaturationVoltage = this.gridSaturationVoltage;
    }

    onGrid4VoltVoltageGainChange() {
        this.uTracerService.grid4VoltVoltageGain = this.grid4VoltVoltageGain;
    }

    onGrid40VoltVoltageGainChange() {
        this.uTracerService.grid40VoltVoltageGain = this.grid40VoltVoltageGain;
    }

    get maximumHighVoltage(): number {
        return this.uTracerService.maximumHighVoltage;
    }

    async onRead() {
        // check we need to configure voltages
        if (this.testGridVoltage !== 0 || this.testPlateVoltage !== 0 || this.testScreenVoltage !== 0 || this.testHeaterVoltage !== 0) {
            // check state
            if (this.uTracerReaderService.state === 'idle') {
                // start heating tube
                await this.uTracerReaderService.start(0, 0x40, 0x08, 0x08, this.testHeaterVoltage);
            }
            // check state is ready for measurements, we should have adc data
            if (this.uTracerReaderService.state === 'ready' && this.adcData) {
                // check we need to measure currents
                if (this.testPlateVoltage !== 0 || this.testScreenVoltage !== 0 || this.testGridVoltage !== 0) {
                    // perform measurement
                    await this.uTracerReaderService.measure(this.adcData.positivePowerSupplyVoltage, 0x40, this.testPlateVoltage, this.testScreenVoltage, this.testGridVoltage, this.testHeaterVoltage);
                    // exit
                    return;
                }
            }
        }
        // read adc data
        await this.uTracerReaderService.read();
    }

    onAbort() {
        // abort current operation
        this.uTracerReaderService.abort();
    }

    validateGridVoltage() {
        // clamp to negative voltage <= grid <= 0
        if (this.testGridVoltage > 0)
            this.testGridVoltage = 0;
        // it cannot go below this value
        if (!this.adcData || this.testGridVoltage < this.adcData.negativePowerSupplyVoltage)
            this.testGridVoltage = Math.ceil(this.adcData?.negativePowerSupplyVoltage || 0);
    }

    validatePlateVoltage() {
        // clamp to 0 <= plate <= max voltage
        if (this.testPlateVoltage < 0)
            this.testPlateVoltage = 0;
        // it cannot go above this value
        if (this.testPlateVoltage > this.maximumHighVoltage)
            this.testPlateVoltage = Math.floor(this.maximumHighVoltage);
    }

    validateScreenVoltage() {
        // clamp to 0 <= screen <= max voltage
        if (this.testScreenVoltage < 0)
            this.testScreenVoltage = 0;
        // it cannot go above this value
        if (this.testScreenVoltage > this.maximumHighVoltage)
            this.testScreenVoltage = Math.floor(this.maximumHighVoltage);
    }

    validateHeaterVoltage() {
        // clamp to 0 <= heater <= power supply voltage
        if (this.testHeaterVoltage < 0)
            this.testHeaterVoltage = 0;
        // it cannot go above power supply voltage
        if (!this.adcData || this.testHeaterVoltage > this.adcData.positivePowerSupplyVoltage)
            this.testHeaterVoltage = this.adcData?.positivePowerSupplyVoltage || 0;
    }

    async onClose(): Promise<void> {
        // stop reader service
        await this.uTracerReaderService.stop();
        // close
        this.closed.emit();
    }
}
