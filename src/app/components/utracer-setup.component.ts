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

    // Test voltage controls
    testGridVoltage = 0;
    testPlateVoltage = 0;
    testScreenVoltage = 0;
    testHeaterVoltage = 0;
    voltagesActive = false;
    autoReadEnabled = false;
    autoReadInterval: ReturnType<typeof setInterval> | null = null;
    safetyTimeout: ReturnType<typeof setTimeout> | null = null;
    heatingProgress = 0;
    isHeating = false;

    ngOnInit() {
        // initialize settings
        this.uTracerVersion = this.uTracerService.hardwareVersion;
        // voltage/current calibration
        this.powerSupplyVoltageGain = this.uTracerService.powerSupplyVoltageGain;
        this.plateVoltageGain = this.uTracerService.plateVoltageGain;
        this.screenVoltageGain = this.uTracerService.screenVoltageGain;
        this.plateCurrentGain = this.uTracerService.plateCurrentGain;
        this.screenCurrentGain = this.uTracerService.screenCurrentGain;
        // negative voltage calibration
        this.negativeVoltageGain = this.uTracerService.negativeVoltageGain;
        this.grid1VoltVoltageGain = this.uTracerService.grid1VoltVoltageGain;
        this.grid4VoltVoltageGain = this.uTracerService.grid4VoltVoltageGain;
        this.grid40VoltVoltageGain = this.uTracerService.grid40VoltVoltageGain;
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

    /**
     * Apply test voltages to the uTracer hardware for calibration purposes
     * Heats the tube if heater voltage is set, then applies plate/screen/grid voltages
     * Starts auto-read and safety timeout after voltages are applied
     */
    async applyTestVoltages() {
        try {
            // confirm high voltage application
            if (this.testPlateVoltage > 100 || this.testScreenVoltage > 100) {
                // show confirmation dialog
                if (!confirm(`Warning: You are about to apply ${this.testPlateVoltage}V plate and ${this.testScreenVoltage}V screen voltage. Ensure tube can handle these voltages. Continue?`))
                    return;
            }
            // set reading state
            this.isReading = true;
            this.isHeating = true;
            this.heatingProgress = 0;
            // get utracer adc data
            this.adcData = await this.uTracerService.ping();
            // read voltages
            const powerSupplyVoltage = this.uTracerService.readPowerSupplyVoltage(this.adcData);
            const negativeVoltage = this.uTracerService.readNegativeVoltage(this.adcData);
            // start uTracer
            await this.uTracerService.start(0, 0x40, 0, 0);
            // heat tube if heater voltage is set
            if (this.testHeaterVoltage > 0) {
                // use 15 steps in the heating process (10s ramp up + 5s hold)
                for (let it = 1; it <= 15; it++) {
                    // voltage at iteration
                    const currentHeaterVoltage = Math.min((this.testHeaterVoltage * it) / 10, this.testHeaterVoltage);
                    // send utracer command
                    await this.uTracerService.setHeaterVoltage(powerSupplyVoltage, currentHeaterVoltage);
                    // update progress
                    this.heatingProgress = (it / 15) * 100;
                    // wait 1 second between steps
                    await new Promise(resolve => setTimeout(resolve, 1000));
                }
            }
            // heating complete
            this.isHeating = false;
            this.voltagesActive = true;
            // apply test voltages
            this.adcData = await this.uTracerService.measure(powerSupplyVoltage, negativeVoltage, this.testPlateVoltage, this.testScreenVoltage, this.testGridVoltage, this.testHeaterVoltage);
            // start safety timeout (60 seconds)
            this.resetSafetyTimeout();
            // start auto-read if enabled
            if (this.autoReadEnabled && !this.autoReadInterval)
                this.autoReadInterval = setInterval(() => this.autoRead(), 2000);
        }
        catch (error) {
            // log error
            console.error('Failed to apply test voltages:', error);
            // reset state
            this.voltagesActive = false;
            this.isHeating = false;
            try {
                // shutdown heater on error
                await this.uTracerService.setHeaterVoltage(0, 0);
            }
            catch (ex) {
                // ignore errors, only log in console
                console.error('Failed to shutdown heater:', ex);
            }
        }
        finally {
            // reset reading state
            this.isReading = false;
        }
    }

    /**
     * Automatically read ADC values while voltages are active
     * Called periodically when auto-read is enabled
     */
    async autoRead() {
        // check state
        if (!this.voltagesActive || this.isReading)
            return;

        try {
            // set reading state
            this.isReading = true;
            // ping uTracer
            this.adcData = await this.uTracerService.ping();
            // read voltages
            const powerSupplyVoltage = this.uTracerService.readPowerSupplyVoltage(this.adcData);
            const negativeVoltage = this.uTracerService.readNegativeVoltage(this.adcData);
            // measure with current test voltages
            this.adcData = await this.uTracerService.measure(powerSupplyVoltage, negativeVoltage, this.testPlateVoltage, this.testScreenVoltage, this.testGridVoltage, 0);
            // reset safety timeout
            this.resetSafetyTimeout();
        }
        catch (error) {
            // log error
            console.error('Auto-read failed:', error);
        }
        finally {
            // reset reading state
            this.isReading = false;
        }
    }

    /**
     * Stop all voltages and shutdown heater
     * Resets all test voltage values and clears timers
     */
    async stopAllVoltages() {
        try {
            // set reading state
            this.isReading = true;
            this.voltagesActive = false;
            // stop auto-read
            if (this.autoReadInterval) {
                clearInterval(this.autoReadInterval);
                this.autoReadInterval = null;
            }
            // clear safety timeout
            if (this.safetyTimeout) {
                clearTimeout(this.safetyTimeout);
                this.safetyTimeout = null;
            }
            // start uTracer
            await this.uTracerService.start(0, 0x40, 0, 0);
            // get supply voltages
            const pingData = await this.uTracerService.ping();
            const powerSupplyVoltage = this.uTracerService.readPowerSupplyVoltage(pingData);
            const negativeVoltage = this.uTracerService.readNegativeVoltage(pingData);
            // shutdown heater first
            await this.uTracerService.setHeaterVoltage(powerSupplyVoltage, 0);
            // set all voltages to 0
            this.adcData = await this.uTracerService.measure(powerSupplyVoltage, negativeVoltage, 0, 0, 0, 0);
            // reset test voltages
            this.testPlateVoltage = 0;
            this.testScreenVoltage = 0;
            this.testGridVoltage = 0;
            this.testHeaterVoltage = 0;
            this.heatingProgress = 0;
        }
        catch (error) {
            // log error
            console.error('Failed to stop voltages:', error);
        }
        finally {
            // reset reading state
            this.isReading = false;
        }
    }

    /**
     * Apply a preset configuration for common calibration test points
     * @param preset The preset configuration to apply ('grid-0.5', 'grid-2.5', 'grid-20', or 'safe')
     */
    applyPreset(preset: string) {
        // apply preset
        switch (preset) {
            case 'grid-0.5':
                // grid -0.5V calibration point (range 1: 0V to -1V)
                this.testGridVoltage = -0.5;
                this.testPlateVoltage = 0;
                this.testScreenVoltage = 0;
                break;
            case 'grid-2.5':
                // grid -2.5V calibration point (range 2: -1V to -4V)
                this.testGridVoltage = -2.5;
                this.testPlateVoltage = 0;
                this.testScreenVoltage = 0;
                break;
            case 'grid-20':
                // grid -20V calibration point (range 3: -4V to -40V)
                this.testGridVoltage = -20;
                this.testPlateVoltage = 0;
                this.testScreenVoltage = 0;
                break;
            case 'safe':
                // safe state - all voltages to 0
                this.testGridVoltage = 0;
                this.testPlateVoltage = 0;
                this.testScreenVoltage = 0;
                break;
        }
    }

    /**
     * Reset the safety timeout that automatically stops voltages after 60 seconds of inactivity
     * Called when voltages are applied or when auto-read updates measurements
     */
    resetSafetyTimeout() {
        // clear existing timeout
        if (this.safetyTimeout)
            clearTimeout(this.safetyTimeout);
        // set new timeout (60 seconds)
        this.safetyTimeout = setTimeout(() => {
            // log warning
            console.warn('Safety timeout triggered - stopping all voltages');
            // stop all voltages
            this.stopAllVoltages();
        }, 60000);
    }

    /**
     * Get the maximum voltage limit based on uTracer hardware version
     * @returns Maximum voltage in volts (300V for v3, 400V for v3+)
     */
    get maxVoltage(): number {
        return this.uTracerVersion === '3+' ? 400 : 300;
    }

    /**
     * Get the minimum allowed grid voltage based on negative supply voltage
     * @returns Minimum grid voltage (negative supply voltage or 0 if not available)
     */
    get minGridVoltage(): number {
        return this.adcData ? this.uTracerService.readNegativeVoltage(this.adcData) : 0;
    }

    /**
     * Get the maximum allowed heater voltage based on power supply voltage
     * @returns Maximum heater voltage (power supply voltage or 0 if not available)
     */
    get maxHeaterVoltage(): number {
        return this.adcData ? this.uTracerService.readPowerSupplyVoltage(this.adcData) : 0;
    }

    /**
     * Validate and clamp grid voltage to acceptable range
     */
    validateGridVoltage() {
        // clamp to 0 >= grid >= negative voltage
        if (this.testGridVoltage > 0)
            this.testGridVoltage = 0;
        if (this.testGridVoltage < this.minGridVoltage)
            this.testGridVoltage = this.minGridVoltage;
    }

    /**
     * Validate and clamp plate voltage to acceptable range
     */
    validatePlateVoltage() {
        // clamp to 0 <= plate <= max voltage
        if (this.testPlateVoltage < 0)
            this.testPlateVoltage = 0;
        if (this.testPlateVoltage > this.maxVoltage)
            this.testPlateVoltage = this.maxVoltage;
    }

    /**
     * Validate and clamp screen voltage to acceptable range
     */
    validateScreenVoltage() {
        // clamp to 0 <= screen <= max voltage
        if (this.testScreenVoltage < 0)
            this.testScreenVoltage = 0;
        if (this.testScreenVoltage > this.maxVoltage)
            this.testScreenVoltage = this.maxVoltage;
    }

    /**
     * Validate and clamp heater voltage to acceptable range
     */
    validateHeaterVoltage() {
        // clamp to 0 <= heater <= power supply voltage
        if (this.testHeaterVoltage < 0)
            this.testHeaterVoltage = 0;
        if (this.testHeaterVoltage > this.maxHeaterVoltage)
            this.testHeaterVoltage = this.maxHeaterVoltage;
    }

    close() {
        // stop auto-read if active
        if (this.autoReadInterval) {
            clearInterval(this.autoReadInterval);
            this.autoReadInterval = null;
        }
        // clear safety timeout
        if (this.safetyTimeout) {
            clearTimeout(this.safetyTimeout);
            this.safetyTimeout = null;
        }
        // close
        this.closed.emit();
    }
}
