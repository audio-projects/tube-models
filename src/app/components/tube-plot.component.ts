import {
    AfterViewInit,
    Component,
    ElementRef,
    Input,
    OnChanges,
    OnDestroy,
    SimpleChanges,
    ViewChild
} from '@angular/core';
import { Chart, ChartConfiguration, registerables } from 'chart.js';
import { CommonModule } from '@angular/common';
import { File as TubeFile, Point, Series } from '../files';
import { FormsModule } from '@angular/forms';
import { normanKorenTriodeModel } from '../workers/models/norman-koren-triode-model';
import { TubeInformation } from './tube-information';

Chart.register(...registerables);

@Component({
    selector: 'app-tube-plot',
    standalone: true,
    imports: [CommonModule, FormsModule],
    template: `
    <div class="tube-plot-container">
      <div *ngIf="file" class="mb-3">
        <h5 class="fw-bold">
          <i class="bi bi-graph-up me-2"></i>{{ file.name }}
        </h5>
        <p class="text-muted mb-2">
          {{ getMeasurementTypeDescription() }}
          <span *ngIf="file.series.length > 0">
            • {{ file.series.length }} series • {{ getTotalPointsCount() }} points
          </span>
        </p>

        <!-- Model Selection Dropdown -->
        <div class="mb-3" *ngIf="availableModels.length > 0">
          <label for="modelSelect" class="form-label fw-bold">
            <i class="bi bi-gear me-1"></i>Compare with Model
          </label>
          <select class="form-select form-select-sm" id="modelSelect"
                  [(ngModel)]="selectedModel"
                  (ngModelChange)="onModelSelectionChange()">
            <option value="">No Model Selected</option>
            <option *ngFor="let model of availableModels" [value]="model.key">
              {{ model.name }}
            </option>
          </select>
        </div>
      </div>

      <div class="chart-container" style="position: relative; height: 400px;">
        <canvas #chartCanvas></canvas>
      </div>

      <div *ngIf="!file" class="text-center py-4">
        <i class="bi bi-graph-up display-6 text-muted"></i>
        <p class="text-muted mt-2 mb-0">No file selected</p>
        <small class="text-muted">Select a file to view its data points</small>
      </div>
    </div>
  `,
    styles: [`
    .tube-plot-container {
      width: 100%;
    }
    .chart-container {
      width: 100%;
      height: 400px;
    }
  `]
})
export class TubePlotComponent implements OnChanges, AfterViewInit, OnDestroy {

    @Input() file: TubeFile | null = null;
    @Input() tube: TubeInformation | null = null;
    @ViewChild('chartCanvas') chartCanvas!: ElementRef<HTMLCanvasElement>;

    private chart: Chart | null = null;
    private viewInitialized = false;
    selectedModel = '';
    availableModels: { key: string, name: string }[] = [];

    ngAfterViewInit() {
        this.viewInitialized = true;
        this.updateAvailableModels();
        if (this.file) {
            this.createChart();
        }
    }

    ngOnChanges(changes: SimpleChanges) {
        // Update available models when tube changes
        if (changes['tube']) {
            this.updateAvailableModels();
        }

        if ((changes['file'] || changes['tube']) && this.viewInitialized) {
            if (this.file) {
                this.createChart();
            }
            else {
                this.destroyChart();
            }
        }
    }

    private createChart() {
        if (!this.file || !this.chartCanvas || this.file.measurementType === 'UNKNOWN') {
            return;
        }

        this.destroyChart();

        const { xField, yField, xLabel, yLabel } = this.getAxesForMeasurementType();
        const datasets = this.createDatasets(xField, yField);
        const { xMin, xMax, yMin, yMax } = this.calculateAxisRanges(xField, yField);

        const config: ChartConfiguration = {
            type: 'scatter',
            data: { datasets },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: `${this.file.name} - ${this.getMeasurementTypeDescription()}`
                    },
                    legend: {
                        display: true,
                        position: 'top',
                        labels: {
                            filter: function(legendItem) {
                                // Hide legend items with empty labels (model curves)
                                return legendItem.text !== '';
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        display: true,
                        title: {
                            display: true,
                            text: xLabel
                        },
                        min: xMin,
                        max: xMax,
                        type: 'linear'
                    },
                    y: {
                        display: true,
                        title: {
                            display: true,
                            text: yLabel
                        },
                        min: yMin,
                        max: yMax,
                        type: 'linear'
                    }
                },
                elements: {
                    point: {
                        radius: 2
                    }
                }
            }
        };

        this.chart = new Chart(this.chartCanvas.nativeElement, config);
    }

    private destroyChart() {
        if (this.chart) {
            this.chart.destroy();
            this.chart = null;
        }
    }

    private getAxesForMeasurementType(): { xField: string, yField: string, xLabel: string, yLabel: string } {
        if (!this.file) {
            return { xField: 'ep', yField: 'ip', xLabel: 'Voltage', yLabel: 'Current' };
        }

        switch (this.file.measurementType) {
            case 'IP_EP_EG_VH':
            case 'IP_EP_EG_VS_VH':
                return {
                    xField: 'ep',
                    yField: 'ip',
                    xLabel: 'Plate Voltage (V)',
                    yLabel: 'Plate Current (mA)'
                };
            case 'IP_EG_EP_VH':
            case 'IP_EG_EP_VS_VH':
                return {
                    xField: 'eg',
                    yField: 'ip',
                    xLabel: 'Grid Voltage (V)',
                    yLabel: 'Plate Current (mA)'
                };
            default:
                return {
                    xField: 'ep',
                    yField: 'ip',
                    xLabel: 'Voltage (V)',
                    yLabel: 'Current (mA)'
                };
        }
    }

    private createDatasets(xField: string, yField: string) {
        if (!this.file) {
            return [];
        }

        const colors = [
            '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF',
            '#FF9F40', '#FF6384', '#C9CBCF', '#4BC0C0', '#FF6384'
        ];

        // Show lines connecting points when no model is selected
        const showLines = this.selectedModel === '' || this.selectedModel === null;

        const datasets = this.file.series.map((series, index) => {
            const data = series.points
                .filter(point => this.getPointValue(point, xField) !== undefined && this.getPointValue(point, yField) !== undefined)
                .map(point => ({
                    x: this.getPointValue(point, xField) as number,
                    y: this.getPointValue(point, yField) as number
                }))
                .sort((a, b) => a.x - b.x);

            const seriesLabel = this.getSeriesLabel(series, index);

            return {
                label: seriesLabel,
                data: data,
                borderColor: colors[index % colors.length],
                backgroundColor: colors[index % colors.length],
                fill: false,
                pointRadius: showLines ? 3 : 4,
                pointHoverRadius: showLines ? 5 : 6,
                showLine: showLines,
                tension: 0.1
            };
        });

        // Add model curves if a model is selected
        if (this.selectedModel && this.tube) {
            console.log('Adding model datasets for selected model:', this.selectedModel);
            const modelDatasets = this.createModelDatasets(xField, yField);
            console.log('Model datasets created:', modelDatasets);
            datasets.push(...modelDatasets);
        }

        console.log('Final datasets for chart:', datasets);
        return datasets;
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    private createModelDatasets(_xField: string, _yField: string) {
        console.log('createModelDatasets called', { selectedModel: this.selectedModel, hasTube: !!this.tube, hasFile: !!this.file });

        if (!this.file || !this.tube || !this.selectedModel) return [];

        const colors = [
            '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF',
            '#FF9F40', '#FF6384', '#C9CBCF', '#4BC0C0', '#FF6384'
        ];

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const modelDatasets: any[] = [];

        if (this.selectedModel === 'norman-koren-triode') {
            // Check if we have triode model parameters (could be on pentode tube operating in triode mode)
            if (this.tube.triodeModelParameters?.calculatedOn) {
                console.log('✓ Triode parameters found and calculated');
                console.log('File measurement type:', this.file!.measurementType);
                console.log('Number of data series:', this.file!.series.length);                // Generate model curves for each series
                this.file.series.forEach((series, index) => {
                    let modelData: { x: number; y: number }[] = [];

                    if (this.file!.measurementType === 'plate_characteristics' ||
                        this.file!.measurementType === 'pentode_plate_characteristics' ||
                        this.file!.measurementType === 'IP_EP_EG_VS_VH' ||
                        this.file!.measurementType === 'IP_EP_EG_VH' ||
                        this.file!.measurementType === 'IP_EPES_EG_VH') {
                        console.log('Generating plate characteristic curve for series', index);
                        modelData = this.generatePlateCharacteristicCurve(series);
                    }
                    else if (this.file!.measurementType === 'transfer_characteristics' ||
                             this.file!.measurementType === 'pentode_transfer_characteristics' ||
                             this.file!.measurementType === 'IP_EG_EP_VS_VH' ||
                             this.file!.measurementType === 'IP_EG_EP_VH' ||
                             this.file!.measurementType === 'IP_EG_EPES_VH') {
                        console.log('Generating transfer characteristic curve for series', index);
                        modelData = this.generateTransferCharacteristicCurve(series);
                    }
                    else {
                        console.log('Measurement type not supported for model generation:', this.file!.measurementType);
                    }

                    console.log(`Model data generated for series ${index}:`, modelData.length, 'points');

                    if (modelData.length > 0) {
                        const color = colors[index % colors.length];

                        modelDatasets.push({
                            label: '', // Empty label to hide from legend
                            data: modelData,
                            backgroundColor: color,
                            borderColor: color,
                            showLine: true,
                            fill: false,
                            tension: 0.1,
                            pointRadius: 0,  // No points for model lines
                            borderWidth: 2,
                            borderDash: [5, 5] // Dashed line for model
                        });
                    }
                });
            }
            else {
                console.log('✗ No calculated triode parameters found');
                console.log('Available tube parameters:', {
                    triode: this.tube.triodeModelParameters,
                    pentode: this.tube.pentodeSpiceModelParameters,
                    tetrode: this.tube.tetrodeSpiceModelParameters
                });
            }
        }
        else {
            console.log('Selected model is not norman-koren-triode:', this.selectedModel);
        }

        return modelDatasets;
    }

    private generatePlateCharacteristicCurve(series: Series): { x: number; y: number }[] {
        console.log('generatePlateCharacteristicCurve called for series:', series);

        if (!this.tube?.triodeModelParameters?.calculatedOn) {
            console.log('No calculated triode parameters available');
            return [];
        }

        const points: { x: number; y: number }[] = [];
        const params = this.tube.triodeModelParameters;

        console.log('Using triode parameters:', params);

        // Check if all required parameters are available
        if (!params.mu || !params.ex || !params.kg1 || !params.kp || !params.kvb) {
            console.log('Missing required parameters:', { mu: params.mu, ex: params.ex, kg1: params.kg1, kp: params.kp, kvb: params.kvb });
            return [];
        }

        // Use the grid voltage from the series
        const gridVoltage = series.eg || 0;

        // Generate points from 0 to a reasonable plate voltage
        const maxPlateVoltage = Math.max(300, ...series.points.map(p => p.ep || 0));
        const stepSize = maxPlateVoltage / 100;

        for (let plateVoltage = 0; plateVoltage <= maxPlateVoltage; plateVoltage += stepSize) {
            try {
                const result = normanKorenTriodeModel(
                    plateVoltage,
                    gridVoltage,
                    params.kp,
                    params.mu,
                    params.kvb,
                    params.ex,
                    params.kg1
                );

                if (result.ip >= 0 && isFinite(result.ip)) {
                    points.push({
                        x: plateVoltage,
                        y: result.ip
                    });
                }
            }
            catch {
                // Skip invalid points
                continue;
            }
        }

        console.log(`Generated ${points.length} points for plate characteristic curve`);
        return points;
    }

    private generateTransferCharacteristicCurve(series: Series): { x: number; y: number }[] {
        if (!this.tube?.triodeModelParameters?.calculatedOn) return [];

        const points: { x: number; y: number }[] = [];
        const params = this.tube.triodeModelParameters;

        // Check if all required parameters are available
        if (!params.mu || !params.ex || !params.kg1 || !params.kp || !params.kvb) {
            return [];
        }

        // Use the plate voltage from the series
        const plateVoltage = series.ep || 250;

        // Generate points for grid voltage range
        const minGridVoltage = Math.min(-10, ...series.points.map(p => p.eg || 0));
        const maxGridVoltage = Math.max(0, ...series.points.map(p => p.eg || 0));
        const stepSize = (maxGridVoltage - minGridVoltage) / 100;

        for (let gridVoltage = minGridVoltage; gridVoltage <= maxGridVoltage; gridVoltage += stepSize) {
            try {
                const result = normanKorenTriodeModel(
                    plateVoltage,
                    gridVoltage,
                    params.kp,
                    params.mu,
                    params.kvb,
                    params.ex,
                    params.kg1
                );

                if (result.ip >= 0 && isFinite(result.ip)) {
                    points.push({
                        x: gridVoltage,
                        y: result.ip
                    });
                }
            }
            catch {
                // Skip invalid points
                continue;
            }
        }

        console.log(`Generated ${points.length} points for transfer characteristic curve`);
        return points;
    }

    // Helper method to safely access Point properties by string key
    private getPointValue(point: Point, fieldName: string): number | undefined {
        switch (fieldName) {
            case 'ip': return point.ip;
            case 'is': return point.is;
            case 'ep': return point.ep;
            case 'eg': return point.eg;
            case 'es': return point.es;
            case 'eh': return point.eh;
            case 'index': return point.index;
            default: return undefined;
        }
    }

    private getSeriesLabel(series: Series, index: number): string {
    // Try to determine the series label based on the measurement type
        if (series.eg !== undefined) {
            return `Vg = ${series.eg}V`;
        }
        if (series.ep !== undefined) {
            return `Va = ${series.ep}V`;
        }
        if (series.es !== undefined) {
            return `Vs = ${series.es}V`;
        }
        if (series.eh !== undefined) {
            return `Vh = ${series.eh}V`;
        }
        return `Series ${index + 1}`;
    }

    private calculateAxisRanges(xField: string, yField: string): { xMin: number, xMax: number, yMin: number, yMax: number } {
        if (!this.file || this.file.series.length === 0) {
            return { xMin: 0, xMax: 100, yMin: 0, yMax: 100 };
        }

        let xMin = Number.MAX_VALUE;
        let xMax = Number.MIN_VALUE;
        let yMin = Number.MAX_VALUE;
        let yMax = Number.MIN_VALUE;

        // Find the actual min/max values from all data points
        for (const series of this.file.series) {
            for (const point of series.points) {
                const xValue = this.getPointValue(point, xField);
                const yValue = this.getPointValue(point, yField);

                if (xValue !== undefined) {
                    xMin = Math.min(xMin, xValue);
                    xMax = Math.max(xMax, xValue);
                }

                if (yValue !== undefined) {
                    yMin = Math.min(yMin, yValue);
                    yMax = Math.max(yMax, yValue);
                }
            }
        }

        // Add some padding to the ranges (10% on each side)
        const xRange = xMax - xMin;
        const yRange = yMax - yMin;

        // Handle edge cases where min equals max (single value)
        const xPadding = xRange > 0 ? xRange * 0.1 : Math.abs(xMax) * 0.1 || 1;
        const yPadding = yRange > 0 ? yRange * 0.1 : Math.abs(yMax) * 0.1 || 1;

        // For voltage axes, ensure we start from a reasonable minimum
        if (xField === 'ep' || xField === 'es') {
            // Plate/Screen voltage - start from 0 or slightly below minimum
            xMin = Math.max(0, xMin - xPadding);
        }
        else if (xField === 'eg') {
            // Grid voltage - can be negative, so allow the natural range
            xMin = xMin - xPadding;
        }
        else {
            xMin = xMin - xPadding;
        }

        // For current axes, typically start from 0
        if (yField === 'ip' || yField === 'is') {
            yMin = Math.max(0, yMin - yPadding);
        }
        else {
            yMin = yMin - yPadding;
        }

        return {
            xMin: Math.round(xMin * 100) / 100,
            xMax: Math.round((xMax + xPadding) * 100) / 100,
            yMin: Math.round(yMin * 100) / 100,
            yMax: Math.round((yMax + yPadding) * 100) / 100
        };
    }

    getMeasurementTypeDescription(): string {
        if (!this.file) return '';

        const descriptions: Record<string, string> = {
            'IP_EP_EG_VH': 'Plate Characteristics (Triode)',
            'IP_EP_EG_VS_VH': 'Plate Characteristics (Pentode)',
            'IP_EG_EP_VH': 'Transfer Characteristics (Triode)',
            'IP_EG_EP_VS_VH': 'Transfer Characteristics (Pentode)',
            'UNKNOWN': 'Unknown Measurement Type'
        };

        return descriptions[this.file.measurementType] || this.file.measurementType;
    }

    getTotalPointsCount(): number {
        if (!this.file) return 0;
        return this.file.series.reduce((total, series) => total + series.points.length, 0);
    }

    onModelSelectionChange() {
        // Handle model selection change
        console.log('Selected model:', this.selectedModel);

        // Recreate the chart to update line visibility
        if (this.file && this.viewInitialized) {
            this.createChart();
        }
    }

    private updateAvailableModels() {
        console.log('updateAvailableModels called', { tube: this.tube });
        this.availableModels = [];

        if (this.tube) {
            console.log('Tube triode parameters:', this.tube.triodeModelParameters);

            // Add triode model if calculated
            if (this.tube.triodeModelParameters?.calculatedOn) {
                console.log('Adding Norman Koren Triode Model to available models');
                this.availableModels.push({
                    key: 'norman-koren-triode',
                    name: 'Norman Koren Triode Model'
                });
            }

            // Add pentode model if calculated
            if (this.tube.pentodeSpiceModelParameters?.calculatedOn) {
                this.availableModels.push({
                    key: 'norman-koren-pentode',
                    name: 'Norman Koren Pentode Model'
                });
            }

            // Add tetrode model if calculated
            if (this.tube.tetrodeSpiceModelParameters?.calculatedOn) {
                this.availableModels.push({
                    key: 'norman-koren-tetrode',
                    name: 'Norman Koren Tetrode Model'
                });
            }
        }

        console.log('Available models after update:', this.availableModels);
    }

    ngOnDestroy() {
        this.destroyChart();
    }
}
