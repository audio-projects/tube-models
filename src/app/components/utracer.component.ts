import { CommonModule } from '@angular/common';
import {
    Component,
    EventEmitter,
    inject,
    Input,
    Output
} from '@angular/core';
import { File as TubeFile } from '../files';
import { FormsModule } from '@angular/forms';
import { SerialService } from '../services/serial.service';
import { SettingsService } from '../services/settings.service';
import { TubeInformation } from './tube-information';

interface MeasurementConfig {
    type: string;
    label: string;
    category: 'triode' | 'pentode' | 'special';
    measuredCurrents: {
        ia: boolean;
        is: boolean;
    };
    sweptParam: {
        name: string;
        symbol: string;
        description: string;
    };
    seriesParam: {
        name: string;
        symbol: string;
        description: string;
    };
    constantParams: {
        name: string;
        symbol: string;
        description: string;
        defaultValue?: number;
        quickValues?: number[];
    }[];
}

@Component({
    selector: 'app-utracer',
    templateUrl: './utracer.component.html',
    styleUrl: './utracer.component.scss',
    imports: [CommonModule, FormsModule]
})
export class UTracerComponent {

    @Output() fileImported = new EventEmitter<TubeFile>();
    @Output() closed = new EventEmitter<void>();
    @Input() tube: TubeInformation | null = null;

    private serialService = inject(SerialService);
    private settingsService = inject(SettingsService);

    importStatus = '';
    isImporting = false;
    pingStatus = '';
    isPinging = false;

    // Measurement process state
    measurementState: 'idle' | 'heating' | 'ready' | 'measuring' = 'idle';
    heatingProgress = 0;
    heatingTimeSeconds = 10;
    private heatingInterval: ReturnType<typeof setInterval> | null = null;

    // Measurement configuration
    selectedMeasurementType = '';
    currentConfig: MeasurementConfig | null = null;

    // Form values
    measureIa = true;
    measureIs = false;
    sweptMin = 0;
    sweptMax = 300;
    sweptSteps = 20;
    sweptLogarithmic = false;
    discreteValues = '0, -2, -4, -6, -8, -10';
    discreteValuesArray: number[] = [];
    constantValues: Record<string, number> = {};

    // Measurement type configurations
    private measurementConfigs: Record<string, MeasurementConfig> = {
        'IP_VA_VG_VH': {
            type: 'IP_VA_VG_VH',
            label: 'Ia(Va, Vg) - Plate current vs Plate/Grid voltage (*)',
            category: 'triode',
            measuredCurrents: { ia: true, is: false },
            sweptParam: { name: 'ep', symbol: 'Va', description: 'Plate Voltage' },
            seriesParam: { name: 'eg', symbol: 'Vg', description: 'Grid Voltage' },
            constantParams: [
                { name: 'eh', symbol: 'Vh', description: 'Heater Voltage', defaultValue: 0 }
            ]
        },
        'IP_VG_VA_VH': {
            type: 'IP_VG_VA_VH',
            label: 'Ia(Vg, Va) - Plate current vs Grid/Plate voltage',
            category: 'triode',
            measuredCurrents: { ia: true, is: false },
            sweptParam: { name: 'eg', symbol: 'Vg', description: 'Grid Voltage' },
            seriesParam: { name: 'ep', symbol: 'Va', description: 'Plate Voltage' },
            constantParams: [
                { name: 'eh', symbol: 'Vh', description: 'Heater Voltage', defaultValue: 0 }
            ]
        },
        'IPIS_VA_VG_VS_VH': {
            type: 'IPIS_VA_VG_VS_VH',
            label: 'Ia(Va, Vg), Is(Va, Vg) - Plate/Screen current vs Plate/Grid voltage (*)',
            category: 'pentode',
            measuredCurrents: { ia: true, is: true },
            sweptParam: { name: 'ep', symbol: 'Va', description: 'Plate Voltage' },
            seriesParam: { name: 'eg', symbol: 'Vg', description: 'Grid Voltage' },
            constantParams: [
                { name: 'es', symbol: 'Vs', description: 'Screen Grid Voltage', defaultValue: 100 },
                { name: 'eh', symbol: 'Vh', description: 'Heater Voltage', defaultValue: 0 }
            ]
        },
        'IPIS_VG_VA_VS_VH': {
            type: 'IPIS_VG_VA_VS_VH',
            label: 'Ia(Vg, Va), Is(Vg, Va) - Plate/Screen current vs Grid/Plate voltage',
            category: 'pentode',
            measuredCurrents: { ia: true, is: true },
            sweptParam: { name: 'eg', symbol: 'Vg', description: 'Grid Voltage' },
            seriesParam: { name: 'ep', symbol: 'Va', description: 'Plate Voltage' },
            constantParams: [
                { name: 'es', symbol: 'Vs', description: 'Screen Grid Voltage', defaultValue: 100 },
                { name: 'eh', symbol: 'Vh', description: 'Heater Voltage', defaultValue: 0 }
            ]
        },
        'IPIS_VS_VG_VA_VH': {
            type: 'IPIS_VS_VG_VA_VH',
            label: 'Ia(Vs, Vg), Is(Vs, Vg) - Plate/Screen current vs Screen/Grid voltage',
            category: 'pentode',
            measuredCurrents: { ia: true, is: true },
            sweptParam: { name: 'es', symbol: 'Vs', description: 'Screen Grid Voltage' },
            seriesParam: { name: 'eg', symbol: 'Vg', description: 'Grid Voltage' },
            constantParams: [
                { name: 'ep', symbol: 'Va', description: 'Plate Voltage', defaultValue: 200 },
                { name: 'eh', symbol: 'Vh', description: 'Heater Voltage', defaultValue: 0 }
            ]
        },
        'IPIS_VG_VS_VA_VH': {
            type: 'IPIS_VG_VS_VA_VH',
            label: 'Ia(Vg, Vs), Is(Vg, Vs) - Plate/Screen current vs Grid/Screen voltage',
            category: 'pentode',
            measuredCurrents: { ia: true, is: true },
            sweptParam: { name: 'eg', symbol: 'Vg', description: 'Grid Voltage' },
            seriesParam: { name: 'es', symbol: 'Vs', description: 'Screen Grid Voltage' },
            constantParams: [
                { name: 'ep', symbol: 'Va', description: 'Plate Voltage', defaultValue: 200 },
                { name: 'eh', symbol: 'Vh', description: 'Heater Voltage', defaultValue: 0 }
            ]
        },
        'IPIS_VA_VS_VG_VH': {
            type: 'IPIS_VA_VS_VG_VH',
            label: 'Ia(Va, Vs), Is(Va, Vs) - Plate/Screen current vs Plate/Screen voltage',
            category: 'pentode',
            measuredCurrents: { ia: true, is: true },
            sweptParam: { name: 'ep', symbol: 'Va', description: 'Plate Voltage' },
            seriesParam: { name: 'es', symbol: 'Vs', description: 'Screen Grid Voltage' },
            constantParams: [
                { name: 'eg', symbol: 'Vg', description: 'Grid Voltage', defaultValue: -2 },
                { name: 'eh', symbol: 'Vh', description: 'Heater Voltage', defaultValue: 0 }
            ]
        },
        'IPIS_VG_VAVS_VH': {
            type: 'IPIS_VG_VAVS_VH',
            label: 'Ia(Vg, Va=Vs), Is(Vg, Va=Vs) - Plate/Screen tied together (Grid sweep)',
            category: 'special',
            measuredCurrents: { ia: true, is: true },
            sweptParam: { name: 'eg', symbol: 'Vg', description: 'Grid Voltage' },
            seriesParam: { name: 'ep', symbol: 'Va=Vs', description: 'Plate/Screen Voltage (tied)' },
            constantParams: [
                { name: 'eh', symbol: 'Vh', description: 'Heater Voltage', defaultValue: 0 }
            ]
        },
        'IPIS_VAVS_VG_VH': {
            type: 'IPIS_VAVS_VG_VH',
            label: 'Ia(Va=Vs, Vg), Is(Va=Vs, Vg) - Plate/Screen tied together (Voltage sweep) (*)',
            category: 'special',
            measuredCurrents: { ia: true, is: true },
            sweptParam: { name: 'ep', symbol: 'Va=Vs', description: 'Plate/Screen Voltage (tied)' },
            seriesParam: { name: 'eg', symbol: 'Vg', description: 'Grid Voltage' },
            constantParams: [
                { name: 'eh', symbol: 'Vh', description: 'Heater Voltage', defaultValue: 0 }
            ]
        }
    };

    get availableMeasurements() {
        // filter measurements based on tube type
        return Object.values(this.measurementConfigs)
            // filter triode vs pentode/tetrode
            .filter(config => this.tube?.type === 'Triode' ? config.category === 'triode' : config.category === 'pentode' || config.category === 'special');
    }

    get triodeMeasurements() {
        return this.availableMeasurements.filter(m => m.category === 'triode');
    }

    get pentodeMeasurements() {
        return this.availableMeasurements.filter(m => m.category === 'pentode');
    }

    get specialMeasurements() {
        return this.availableMeasurements.filter(m => m.category === 'special');
    }

    onMeasurementTypeChange() {
        // select config
        this.currentConfig = this.measurementConfigs[this.selectedMeasurementType] || null;
        if (this.currentConfig) {
            // update measured currents
            this.measureIa = this.currentConfig.measuredCurrents.ia;
            this.measureIs = this.currentConfig.measuredCurrents.is;
            // initialize constant values
            this.constantValues = {};
            this.currentConfig.constantParams
                .forEach(param => {
                    // check for special case of heater voltage
                    if (param.name === 'eh') {
                        // set heater voltage from tube data
                        this.constantValues[param.name] = this.calculateInitialHeaterVoltage();
                    }
                    else if (param.defaultValue !== undefined) {
                        // use default value
                        this.constantValues[param.name] = param.defaultValue;
                    }
                });
            // update discrete values
            this.updateDiscreteValuesArray();
            // set default ranges based on swept parameter
            this.setDefaultRanges();
        }
    }

    private calculateInitialHeaterVoltage(): number {
        // default
        if (!this.tube)
            return 0;
        // values from tube data
        const minHeater = this.tube.minimumHeaterVoltage;
        const maxHeater = this.tube.maximumHeaterVoltage;
        // average if both defined
        if (minHeater && maxHeater)
            return (minHeater + maxHeater) / 2;
        // min
        if (minHeater)
            return minHeater;
        // max
        if (maxHeater)
            return maxHeater;
        // fallback
        return 0;
    }

    setDefaultRanges() {
        // validate config is set
        if (!this.currentConfig)
            return;
        // x axis parameter
        const symbol = this.currentConfig.sweptParam.symbol;
        // set sensible defaults based on parameter type
        if (symbol.includes('Va') && symbol.includes('Vs')) {
            this.sweptMin = 0;
            this.sweptMax = Math.min(this.getMaxVoltageForParameter('Va'), this.getMaxVoltageForParameter('Vs'));
            this.sweptSteps = 50;
        }
        else if (symbol.includes('Va')) {
            this.sweptMin = 0;
            this.sweptMax = this.getMaxVoltageForParameter('Va');
            this.sweptSteps = 50;
        }
        else if (symbol.includes('Vs')) {
            this.sweptMin = 0;
            this.sweptMax = this.getMaxVoltageForParameter('Vs');
            this.sweptSteps = 50;
        }
        else if (symbol.includes('Vg')) {
            this.sweptMin = -10;
            this.sweptMax = 0;
            this.sweptSteps = 20;
        }
        // series parameter
        const series = this.currentConfig.seriesParam.symbol;
        // set default values for series parameter
        if (series.includes('Va') && series.includes('Vs')) {
            // max
            const max = Math.min(this.getMaxVoltageForParameter('Va'), this.getMaxVoltageForParameter('Vs'));
            // discrete values
            this.discreteValues = this.generateDiscreteValues(Math.round(max / 2), max, 6);
        }
        else if (series.includes('Va')) {
            // max
            const max = this.getMaxVoltageForParameter('Va');
            // discrete values
            this.discreteValues = this.generateDiscreteValues(Math.round(max / 2), max, 6);
        }
        else if (series.includes('Vs')) {
            // max
            const max = this.getMaxVoltageForParameter('Vs');
            // discrete values
            this.discreteValues = this.generateDiscreteValues(Math.round(max / 2), max, 6);
        }
        else if (series.includes('Vg')) {
            // discrete values
            this.discreteValues = '0, -2, -4, -6, -8, -10';
        }
        // process values
        this.updateDiscreteValuesArray();
    }

    private getMaxVoltageForParameter(param: 'Va' | 'Vs'): number {
        // plate
        if (param === 'Va') {
            // max plate voltage
            return this.tube?.maximumPlateVoltage ?? 300;
        }
        // for screen voltage, use max grid 2 voltage
        return this.tube?.maximumGrid2Voltage ?? 300;
    }

    private generateDiscreteValues(min: number, max: number, count: number): string {
        // step
        const step = (max - min) / (count - 1);
        // values in series
        const values: number[] = [];
        // generate values
        for (let i = 0; i < count; i++)
            values.push(Math.round(min + step * i));
        // join
        return values.join(', ');
    }

    updateDiscreteValuesArray() {
        // use int numbers
        this.discreteValuesArray = this.discreteValues
            .split(',')
            .map(v => parseFloat(v.trim()))
            .filter(v => !isNaN(v));
    }

    onDiscreteValuesChange() {
        this.updateDiscreteValuesArray();
    }

    setConstantValue(paramName: string, value: number) {
        this.constantValues[paramName] = value;
    }

    startMeasurement() {
        // Validate that measurement type is selected
        if (!this.currentConfig) {
            return;
        }

        // Start heating process
        this.measurementState = 'heating';
        this.heatingProgress = 0;
        this.isImporting = true;

        // TODO: Send heating command via serial port
        console.log('Sending heating command to uTracer...');

        // Simulate heating progress (10 seconds)
        const startTime = Date.now();
        this.heatingInterval = setInterval(() => {
            const elapsed = (Date.now() - startTime) / 1000;
            this.heatingProgress = Math.min((elapsed / this.heatingTimeSeconds) * 100, 100);

            if (this.heatingProgress >= 100) {
                this.completeHeating();
            }
        }, 100); // Update every 100ms for smooth progress
    }

    private completeHeating() {
        if (this.heatingInterval) {
            clearInterval(this.heatingInterval);
            this.heatingInterval = null;
        }
        this.heatingProgress = 100;
        this.measurementState = 'ready';
        console.log('Heating complete. Ready to measure.');
    }

    measureData() {
        if (this.measurementState !== 'ready') {
            return;
        }

        this.measurementState = 'measuring';

        // TODO: Send measurement commands via serial port
        console.log('Starting measurement with config:', {
            type: this.currentConfig?.type,
            sweptMin: this.sweptMin,
            sweptMax: this.sweptMax,
            sweptSteps: this.sweptSteps,
            sweptLogarithmic: this.sweptLogarithmic,
            discreteValues: this.discreteValuesArray,
            constantValues: this.constantValues,
            measureIa: this.measureIa,
            measureIs: this.measureIs
        });

        // For now, simulate measurement completion after a short delay
        setTimeout(() => {
            console.log('Measurement complete (simulated)');
            this.resetMeasurement();
        }, 3000);
    }

    abortMeasurement() {
        // Stop heating if in progress
        if (this.heatingInterval) {
            clearInterval(this.heatingInterval);
            this.heatingInterval = null;
        }

        // TODO: Send abort command via serial port
        console.log('Aborting measurement...');

        this.resetMeasurement();
    }

    private resetMeasurement() {
        this.measurementState = 'idle';
        this.heatingProgress = 0;
        this.isImporting = false;

        if (this.heatingInterval) {
            clearInterval(this.heatingInterval);
            this.heatingInterval = null;
        }
    }

    isFormValid(): boolean {
        return !!this.currentConfig && this.discreteValuesArray.length > 0;
    }

    close() {
        // Abort measurement if in progress
        if (this.measurementState !== 'idle') {
            this.abortMeasurement();
        }
        this.closed.emit();
    }

    cancel() {
        this.close();
    }

    async testPing(): Promise<void> {
        this.isPinging = true;
        this.pingStatus = 'Pinging uTracer...';

        try {
            await this.serialService.ping();
            this.pingStatus = 'Ping successful! ✓';
            setTimeout(() => {
                this.pingStatus = '';
            }, 3000);
        }
        catch (error) {
            this.pingStatus = `Ping failed: ${error}`;
        }
        finally {
            this.isPinging = false;
        }
    }
}
