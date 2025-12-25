import { CommonModule } from '@angular/common';
import {
    Component,
    EventEmitter,
    inject,
    Input,
    Output
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { File as TubeFile } from '../files';
import { SerialService } from '../services/serial.service';

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
    @Input() tubeType: 'triode' | 'pentode' = 'triode';

    private serialService = inject(SerialService);
    importStatus = '';
    isImporting = false;

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
            label: 'Ia(Va, Vg) - Plate current vs Plate/Grid voltage',
            category: 'triode',
            measuredCurrents: { ia: true, is: false },
            sweptParam: { name: 'ep', symbol: 'Va', description: 'Plate Voltage' },
            seriesParam: { name: 'eg', symbol: 'Vg', description: 'Grid Voltage' },
            constantParams: [
                { name: 'eh', symbol: 'Vh', description: 'Heater Voltage', defaultValue: 6.3, quickValues: [6.3, 12.6] }
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
                { name: 'eh', symbol: 'Vh', description: 'Heater Voltage', defaultValue: 6.3, quickValues: [6.3, 12.6] }
            ]
        },
        'IPIS_VA_VG_VS_VH': {
            type: 'IPIS_VA_VG_VS_VH',
            label: 'Ia(Va, Vg), Is(Va, Vg) - Plate/Screen current vs Plate/Grid voltage',
            category: 'pentode',
            measuredCurrents: { ia: true, is: true },
            sweptParam: { name: 'ep', symbol: 'Va', description: 'Plate Voltage' },
            seriesParam: { name: 'eg', symbol: 'Vg', description: 'Grid Voltage' },
            constantParams: [
                { name: 'es', symbol: 'Vs', description: 'Screen Grid Voltage', defaultValue: 100 },
                { name: 'eh', symbol: 'Vh', description: 'Heater Voltage', defaultValue: 6.3, quickValues: [6.3, 12.6] }
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
                { name: 'eh', symbol: 'Vh', description: 'Heater Voltage', defaultValue: 6.3, quickValues: [6.3, 12.6] }
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
                { name: 'eh', symbol: 'Vh', description: 'Heater Voltage', defaultValue: 6.3, quickValues: [6.3, 12.6] }
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
                { name: 'eh', symbol: 'Vh', description: 'Heater Voltage', defaultValue: 6.3, quickValues: [6.3, 12.6] }
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
                { name: 'eh', symbol: 'Vh', description: 'Heater Voltage', defaultValue: 6.3, quickValues: [6.3, 12.6] }
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
                { name: 'eh', symbol: 'Vh', description: 'Heater Voltage', defaultValue: 6.3, quickValues: [6.3, 12.6] }
            ]
        },
        'IPIS_VAVS_VG_VH': {
            type: 'IPIS_VAVS_VG_VH',
            label: 'Ia(Va=Vs, Vg), Is(Va=Vs, Vg) - Plate/Screen tied together (Voltage sweep)',
            category: 'special',
            measuredCurrents: { ia: true, is: true },
            sweptParam: { name: 'ep', symbol: 'Va=Vs', description: 'Plate/Screen Voltage (tied)' },
            seriesParam: { name: 'eg', symbol: 'Vg', description: 'Grid Voltage' },
            constantParams: [
                { name: 'eh', symbol: 'Vh', description: 'Heater Voltage', defaultValue: 6.3, quickValues: [6.3, 12.6] }
            ]
        }
    };

    get availableMeasurements() {
        return Object.values(this.measurementConfigs).filter(config => {
            if (this.tubeType === 'triode') {
                return config.category === 'triode';
            }
            else {
                // Pentode/Tetrode: all measurement types are available
                return true;
            }
        });
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
        this.currentConfig = this.measurementConfigs[this.selectedMeasurementType] || null;

        if (this.currentConfig) {
            // Update measured currents
            this.measureIa = this.currentConfig.measuredCurrents.ia;
            this.measureIs = this.currentConfig.measuredCurrents.is;

            // Initialize constant values
            this.constantValues = {};
            this.currentConfig.constantParams.forEach(param => {
                if (param.defaultValue !== undefined) {
                    this.constantValues[param.name] = param.defaultValue;
                }
            });

            // Update discrete values
            this.updateDiscreteValuesArray();

            // Set default ranges based on swept parameter
            this.setDefaultRanges();
        }
    }

    setDefaultRanges() {
        if (!this.currentConfig) return;

        const symbol = this.currentConfig.sweptParam.symbol;

        // Set sensible defaults based on parameter type
        if (symbol.includes('Va') || symbol.includes('Vs')) {
            this.sweptMin = 0;
            this.sweptMax = 300;
            this.sweptSteps = 30;
        }
        else if (symbol.includes('Vg')) {
            this.sweptMin = -10;
            this.sweptMax = 0;
            this.sweptSteps = 20;
        }

        // Set default discrete values
        if (this.currentConfig.seriesParam.symbol.includes('Vg')) {
            this.discreteValues = '0, -2, -4, -6, -8, -10';
        }
        else if (this.currentConfig.seriesParam.symbol.includes('Va')) {
            this.discreteValues = '100, 150, 200, 250, 300';
        }
        else if (this.currentConfig.seriesParam.symbol.includes('Vs')) {
            this.discreteValues = '50, 75, 100, 125, 150';
        }

        this.updateDiscreteValuesArray();
    }

    updateDiscreteValuesArray() {
        const values = this.discreteValues
            .split(',')
            .map(v => parseFloat(v.trim()))
            .filter(v => !isNaN(v));
        this.discreteValuesArray = values;
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
}
