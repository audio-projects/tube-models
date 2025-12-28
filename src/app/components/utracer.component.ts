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
import { Averaging, Compliance, UTracerResponse, UTracerService } from '../services/utracer.service';
import { ToastService } from '../services/toast.service';
import { TubeInformation } from './tube-information';
import { UTracerSetupComponent } from './utracer-setup.component';
import { string } from 'mathjs';

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
    imports: [CommonModule, FormsModule, UTracerSetupComponent]
})
export class UTracerComponent {

    @Output() fileImported = new EventEmitter<TubeFile>();
    @Output() closed = new EventEmitter<void>();
    @Input() tube: TubeInformation | null = null;

    private uTracerService = inject(UTracerService);
    private toast = inject(ToastService);

    importStatus = '';
    isImporting = false;
    pingStatus = '';
    isPinging = false;
    showSetupModal = false;

    // measurement process state
    measurementState: 'idle' | 'heating' | 'ready' | 'measuring' = 'idle';
    heatingProgress = 0;
    stop = false;
    abortController: AbortController | null = null;

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

    // Additional measurement settings
    compliance: Compliance = 200;
    average: Averaging = 0x40;
    iaRange = 'Automatic';
    isRange = 'Automatic';

    // Dropdown options
    complianceOptions = [
        { label: '200mA', value: 200 },
        { label: '175mA', value: 175 },
        { label: '150mA', value: 150 },
        { label: '125mA', value: 125 },
        { label: '100mA', value: 100 },
        { label: '75mA', value: 75 },
        { label: '50mA', value: 50 },
        { label: '25mA', value: 25 },
        { label: 'Off', value: 0 }
    ];

    averageOptions = [
        { label: 'None', value: 0 },
        { label: '2X', value: 2 },
        { label: '4X', value: 4 },
        { label: '8X', value: 8 },
        { label: '16X', value: 16 },
        { label: '32X', value: 32 },
        { label: 'Automatic', value: 0x40 }
    ];

    rangeOptions = [
        '0-200mA',
        '0-100mA',
        '0-40mA',
        '0-20mA',
        '0-10mA',
        '0-5mA',
        '0-2mA',
        '0-1mA',
        'Automatic'
    ];

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
                { name: 'es', symbol: 'Vs', description: 'Screen Grid Voltage', defaultValue: 100 }
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
                { name: 'es', symbol: 'Vs', description: 'Screen Grid Voltage', defaultValue: 100 }
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
                { name: 'ep', symbol: 'Va', description: 'Plate Voltage', defaultValue: 200 }
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
                { name: 'ep', symbol: 'Va', description: 'Plate Voltage', defaultValue: 200 }
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
                { name: 'eg', symbol: 'Vg', description: 'Grid Voltage', defaultValue: -2 }
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
            this.constantValues = {
                eh: this.calculateInitialHeaterVoltage()
            };
            // default values for other constant params
            this.currentConfig.constantParams
                .forEach(param => this.constantValues[param.name] = param.defaultValue ?? 0);
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

    async checkProgress(signal: AbortSignal): Promise<void> {
        // check for abort signal
        return signal.aborted ? Promise.reject(signal.reason || 'Stopped') : Promise.resolve();
    }

    async startMeasurement(): Promise<void> {
        try {
            // validate that measurement type is selected
            if (!this.currentConfig)
                return;
            // check state
            if (this.measurementState !== 'idle')
                return;
            // state
            this.heatingProgress = 0;
            this.measurementState = 'heating';
            this.abortController = new AbortController();
            // signal
            const signal = this.abortController.signal;
            // reset uTracer
            await this.uTracerService.start(0, 0, 0, 0);
            // check progress
            await this.checkProgress(signal);
            // ping uTracer, read data
            const response: UTracerResponse = await this.uTracerService.ping();
            // check progress
            await this.checkProgress(signal);
            // heater value
            const eh = this.constantValues['eh'] || 0;
            // use 15 steps in the heating process (10s ramp up + 5s hold)
            for (let it = 1; it <= 15; it++) {
                // voltage at iteration
                const voltage = Math.min((eh * it) / 10, eh);
                // send utracer command
                await this.uTracerService.setHeaterVoltage(voltage, response.powerSupplyVoltage);
                // check progress
                await this.checkProgress(signal);
                // update progress
                this.heatingProgress = (it / 15) * 100;
                // wait 1 second between steps
                await new Promise(resolve => setTimeout(resolve, 1000));
                // check progress
                await this.checkProgress(signal);
            }
            // update state
            this.measurementState = 'ready';
        }
        catch (error) {
            try {
                // shutdown heater
                await this.uTracerService.setHeaterVoltage(0, 0);
            }
            catch (error) {
                // ignore errors, only log in console
                console.error('Failed to shut down heater: ', error);
                // show user message
                this.toast.error('Failed to shut down heater after error');
            }
            // reset state
            this.measurementState = 'idle';
            this.abortController = null;
            // show user message
            this.toast.warning(typeof error === 'string' ? error : 'Stopped');
        }
    }

    async measureData() {
        if (this.measurementState !== 'ready') {
            return;
        }

    }

    abortMeasurement() {
        // check we can abort measurement
        if (this.abortController != null) {
            // indicate stop
            this.abortController.abort('Cancelled by user');
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

    async cancel(): Promise<void> {
        // check current state, this is only called if ready
        if (this.measurementState !== 'ready')
            return;

        try {
            // heater is on, shut it down
            await this.uTracerService.setHeaterVoltage(0, 0);
        }
        catch (error) {
            // ignore errors, only log in console
            console.error('Failed to shut down heater: ', error);
            // show user message
            this.toast.error('Failed to shut down heater after cancel');
        }
        finally {
            // nothing is running at the moment, just reset state
            this.measurementState = 'idle';
            this.abortController = null;
        }
    }

    showSetup() {
        this.showSetupModal = true;
    }

    closeSetup() {
        this.showSetupModal = false;
    }
}
