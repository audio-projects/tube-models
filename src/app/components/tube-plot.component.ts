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
import { CircuitService } from '../services/circuit.service';
import { CommonModule } from '@angular/common';
import { derkEModel } from '../workers/models/derke-model';
import { derkEModelError } from '../workers/models/derke-model-error';
import { derkModel } from '../workers/models/derk-model';
import { derkModelError } from '../workers/models/derk-model-error';
import {
    File as TubeFile,
    File,
    Point,
    Series
} from '../files';
import { FormsModule } from '@angular/forms';
import { ModelService } from '../services/model.service';
import { normanKorenNewPentodeModel } from '../workers/models/norman-koren-new-pentode-model';
import { normanKorenNewPentodeModelError } from '../workers/models/norman-koren-new-pentode-model-error';
import { normanKorenTriodeModel } from '../workers/models/norman-koren-triode-model';
import { normanKorenTriodeModelError } from '../workers/models/norman-koren-triode-model-error';
import { TubeInformation } from './tube-information';

Chart.register(...registerables);

@Component({
    selector: 'app-tube-plot',
    standalone: true,
    imports: [CommonModule, FormsModule],
    template: `
        <div class="tube-plot-container">
            <div *ngIf="file" class="mb-3">
                <h5 class="fw-bold"><i class="bi bi-graph-up me-2"></i>{{ file.name }}</h5>
                <p class="text-muted mb-2">
                    {{ this.file.measurementTypeLabel }}
                    <span *ngIf="file.series.length > 0"> • {{ file.series.length }} series • {{ getTotalPointsCount() }} points </span>
                </p>

                <!-- Model Selection Dropdown -->
                <div class="mb-3" *ngIf="availableModels.length > 0">
                    <label for="modelSelect" class="form-label fw-bold"> <i class="bi bi-gear me-1"></i>Compare with Model </label>
                    <div class="d-flex gap-2 align-items-center">
                        <select class="form-select form-select-sm flex-grow-1" id="modelSelect" [(ngModel)]="selectedModel" (ngModelChange)="onModelSelectionChange()">
                            <option value="">No Model Selected</option>
                            <option *ngFor="let model of availableModels" [value]="model.key">
                                {{ model.name }}
                            </option>
                        </select>
                        <button *ngIf="selectedModel && canGenerateCircuit()" class="btn btn-sm btn-outline-primary d-flex align-items-center" style="height: fit-content; padding: 0.25rem 0.5rem;" (click)="downloadCircuit()" title="Download SPICE circuit file">
                            <i class="bi bi-download me-1"></i>Circuit
                        </button>
                    </div>
                </div>
            </div>

            <div class="chart-container" style="position: relative; height: 400px;">
                <canvas #chartCanvas></canvas>
            </div>

            <!-- Model RMSE Display -->
            <div *ngIf="modelRmse !== null" class="alert alert-info mt-3 mb-0" role="alert">
                <i class="bi bi-info-circle me-2"></i>
                <strong>Model Fit Quality (current file):</strong> Root Mean Square Error (RMSE) = <strong>{{ modelRmse.toFixed(4) }}</strong> mA
            </div>

            <div *ngIf="!file" class="text-center py-4">
                <i class="bi bi-graph-up display-6 text-muted"></i>
                <p class="text-muted mt-2 mb-0">No file selected</p>
                <small class="text-muted">Select a file to view its data points</small>
            </div>
        </div>
    `,
    styles: [
        `
            .tube-plot-container {
                width: 100%;
            }
            .chart-container {
                width: 100%;
                height: 400px;
            }
        `,
    ],
})
export class TubePlotComponent implements OnChanges, AfterViewInit, OnDestroy {

    @Input() file: TubeFile | null = null;
    @Input() tube: TubeInformation | null = null;
    @ViewChild('chartCanvas') chartCanvas!: ElementRef<HTMLCanvasElement>;

    private chart: Chart | null = null;
    private viewInitialized = false;
    selectedModel = '';
    availableModels: { key: string; name: string }[] = [];
    modelRmse: number | null = null;

    constructor(private circuitService: CircuitService, private modelService: ModelService) { }

    ngAfterViewInit() {
        // update flag
        this.viewInitialized = true;
        // intialize tube models
        this.updateAvailableModels();
        // create chart if file is present
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
        // check we can create the chart
        if (!this.file || !this.chartCanvas || this.file.measurementType === 'UNKNOWN') {
            return;
        }
        // Destroy existing chart if any
        this.destroyChart();

        const axesConfig = this.getAxesForMeasurementType();
        const datasets = this.createDatasets(axesConfig);

        // Calculate axis ranges based on measurement type
        let axisRanges;
        const { yComponent } = this.parseMeasurementType(this.file.measurementType);
        const isCombined = this.isCombinedCurrentMeasurement(yComponent, this.file.measurementType);

        if (isCombined) {
            // For VAVS cases, calculate ranges based on combined current (ip + is)
            axisRanges = this.calculateCombinedCurrentAxisRanges(axesConfig.xField);
        }
        else if (axesConfig.hasDualYAxis) {
            // For dual Y-axis measurements, calculate ranges for both Y-axes
            axisRanges = this.calculateDualAxisRanges(axesConfig.xField, axesConfig.yField, axesConfig.rightYField!);
        }
        else {
            const ranges = this.calculateAxisRanges(axesConfig.xField, axesConfig.yField);
            axisRanges = {
                xMin: ranges.xMin,
                xMax: ranges.xMax,
                yMin: ranges.yMin,
                yMax: ranges.yMax,
            };
        }

        // Build scales configuration
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const scales: any = {
            x: {
                display: true,
                title: {
                    display: true,
                    text: axesConfig.xLabel,
                },
                min: axisRanges.xMin,
                max: axisRanges.xMax,
                type: 'linear',
            },
            y: {
                display: true,
                position: 'left',
                title: {
                    display: true,
                    text: axesConfig.yLabel,
                },
                min: axisRanges.yMin,
                max: axisRanges.yMax,
                type: 'linear',
            },
        };

        // Add right Y-axis for dual axis measurements
        if (axesConfig.hasDualYAxis) {
            const dualAxisRanges = axisRanges as {
                xMin: number;
                xMax: number;
                yMin: number;
                yMax: number;
                rightYMin: number;
                rightYMax: number;
            };
            scales.y1 = {
                display: true,
                position: 'right',
                title: {
                    display: true,
                    text: axesConfig.rightYLabel,
                },
                min: dualAxisRanges.rightYMin,
                max: dualAxisRanges.rightYMax,
                type: 'linear',
                // Grid lines only for left axis to avoid overlap
                grid: {
                    drawOnChartArea: false,
                },
            };
        }

        const config: ChartConfiguration = {
            type: 'scatter',
            data: { datasets },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: {
                    mode: 'index',
                    intersect: false,
                },
                plugins: {
                    title: {
                        display: true,
                        text: `${this.file.name} - ${this.file.measurementTypeLabel}`,
                    },
                    legend: {
                        display: true,
                        position: 'top',
                        labels: {
                            filter: function (legendItem) {
                                // Hide legend items with empty labels (model curves)
                                return legendItem.text !== '';
                            },
                        },
                    },
                },
                scales,
                elements: {
                    point: {
                        radius: 2,
                    },
                },
            },
        };

        this.chart = new Chart(this.chartCanvas.nativeElement, config);
    }

    private destroyChart() {
        if (this.chart) {
            this.chart.destroy();
            this.chart = null;
        }
    }

    private getAxesForMeasurementType(): { xField: string; yField: string; xLabel: string; yLabel: string; hasDualYAxis: boolean; rightYField?: string; rightYLabel?: string } {
        if (!this.file?.measurementType) {
            return {
                xField: 'ep',
                yField: 'ip',
                xLabel: 'Voltage (V)',
                yLabel: 'Current (mA)',
                hasDualYAxis: false,
            };
        }

        // Parse the new measurement type format (Y_X_SERIES)
        const { yComponent, xComponent } = this.parseMeasurementType(this.file.measurementType);

        // Get X-axis configuration
        const xField = this.getFieldFromComponent(xComponent);
        const xLabel = this.getLabelFromComponent(xComponent);

        // Get Y-axis configuration (may be dual)
        const yAxisConfig = this.getYAxisConfig(yComponent);

        if (yAxisConfig.hasDualAxis) {
            return {
                xField,
                yField: yAxisConfig.leftAxis,
                xLabel,
                yLabel: yAxisConfig.leftLabel,
                hasDualYAxis: true,
                rightYField: yAxisConfig.rightAxis,
                rightYLabel: yAxisConfig.rightLabel,
            };
        }
        else {
            return {
                xField,
                yField: yAxisConfig.leftAxis,
                xLabel,
                yLabel: yAxisConfig.leftLabel,
                hasDualYAxis: false,
            };
        }
    }

    private createDatasets(axesConfig: ReturnType<typeof this.getAxesForMeasurementType>) {
        // check file is selected
        if (!this.file)
            return [];
        // colors
        const colors = ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40', '#FF6384', '#C9CBCF', '#4BC0C0', '#FF6384'];
        // Show lines connecting points when no model is selected
        const showLines = this.selectedModel === '' || this.selectedModel === null;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const datasets: any[] = [];
        // Parse measurement type to determine curve generation method
        const { yComponent, xComponent } = this.parseMeasurementType(this.file!.measurementType);
        const measurementTypeCategory = this.getMeasurementTypeFromComponents(yComponent, xComponent);
        // min & max x axis values
        let minX = Number.MAX_VALUE;
        let maxX = Number.MIN_VALUE;
        // process series
        for (let i = 0; i < this.file.series.length; i++) {
            // current series
            const series = this.file.series[i];
            // update min and max X values
            series.points.forEach((point) => {
                // x value
                const xValue = this.getPointValue(point, axesConfig.xField);
                if (xValue !== undefined) {
                    minX = Math.min(minX, xValue);
                    maxX = Math.max(maxX, xValue);
                }
            });
            // series color
            const color = colors[i % colors.length];
            // label
            const seriesLabel = this.getSeriesLabel(series, i);
            // Check if this is a combined current measurement (VAVS case)
            const { yComponent } = this.parseMeasurementType(this.file!.measurementType);
            const isCombined = this.isCombinedCurrentMeasurement(yComponent, this.file!.measurementType);
            //  check Y axis is combining both currents
            if (isCombined) {
                // Create combined current dataset (ip + is)
                const combinedData = series.points
                    .filter((point) => this.getPointValue(point, axesConfig.xField) !== undefined && this.getPointValue(point, 'ip') !== undefined && this.getPointValue(point, 'is') !== undefined)
                    .map((point) => {
                        let xValue = this.getPointValue(point, axesConfig.xField) as number;
                        const ipValue = this.getPointValue(point, 'ip') as number;
                        const isValue = this.getPointValue(point, 'is') as number;
                        const yValue = ipValue + isValue; // Combined current

                        // Apply egOffset to grid voltage values when plotting
                        if (axesConfig.xField === 'eg') {
                            xValue += this.file!.egOffset;
                        }

                        return { x: xValue, y: yValue };
                    })
                    .sort((a, b) => a.x - b.x);

                if (combinedData.length > 0) {
                    datasets.push({
                        label: seriesLabel,
                        data: combinedData,
                        borderColor: color,
                        backgroundColor: color,
                        showLine: showLines,
                        fill: false,
                        tension: 0.1,
                        pointRadius: 2,
                        pointHoverRadius: 3,
                        yAxisID: 'y', // Single axis for combined measurement
                    });
                }
            }
            else {
                // Create primary Y-axis dataset (left axis)
                const primaryData = series.points
                    .filter((point) => this.getPointValue(point, axesConfig.xField) !== undefined && this.getPointValue(point, axesConfig.yField) !== undefined)
                    .map((point) => {
                        // x, y values
                        let xValue = this.getPointValue(point, axesConfig.xField) as number;
                        let yValue = this.getPointValue(point, axesConfig.yField) as number;
                        // Apply egOffset to grid voltage values when plotting
                        if (axesConfig.xField === 'eg')
                            xValue += this.file!.egOffset;
                        if (axesConfig.yField === 'eg')
                            yValue += this.file!.egOffset;
                        // Create data point
                        return { x: xValue, y: yValue };
                    })
                    .sort((a, b) => a.x - b.x);

                if (primaryData.length > 0) {
                    // append dataset
                    datasets.push({
                        label: seriesLabel, // Same series label for both axes
                        data: primaryData,
                        borderColor: color,
                        backgroundColor: color,
                        fill: false,
                        pointRadius: 2,
                        pointHoverRadius: 3,
                        showLine: showLines,
                        tension: 0.1,
                        yAxisID: 'y', // Left axis
                    });
                }
            }

            // Create secondary Y-axis dataset (right axis) if dual axis
            if (axesConfig.hasDualYAxis && axesConfig.rightYField) {
                // secondary Y-axis dataset
                const secondaryData = series.points
                    .filter((point) => this.getPointValue(point, axesConfig.xField) !== undefined && this.getPointValue(point, axesConfig.rightYField!) !== undefined)
                    .map((point) => {
                        // x, y values
                        let xValue = this.getPointValue(point, axesConfig.xField) as number;
                        let yValue = this.getPointValue(point, axesConfig.rightYField!) as number;
                        // Apply egOffset to grid voltage values when plotting
                        if (axesConfig.xField === 'eg')
                            xValue += this.file!.egOffset;
                        if (axesConfig.rightYField === 'eg')
                            yValue += this.file!.egOffset;
                        // Create data point
                        return { x: xValue, y: yValue };
                    })
                    .sort((a, b) => a.x - b.x);

                if (secondaryData.length > 0) {
                    // create dataset
                    datasets.push({
                        label: '', // Empty label to hide from legend (same series as primary)
                        data: secondaryData,
                        borderColor: color,
                        backgroundColor: color,
                        borderDash: [2, 1], // Dashed line to distinguish from primary
                        fill: false,
                        pointRadius: 2,
                        pointHoverRadius: 3,
                        showLine: showLines,
                        tension: 0.1,
                        yAxisID: 'y1', // Right axis
                    });
                }
            }
            // Add model curves if a model is selected
            if (this.selectedModel && this.tube) {
                // append model datasets
                datasets.push(...this.createModelDatasets(color, isCombined, axesConfig, series, measurementTypeCategory));
            }
        }
        // plate dissipation line for plate curves
        if (this.tube?.maximumPlateDissipation && measurementTypeCategory === 'plate') {
            // maximum plate dissipation line
            datasets.push(...this.createMaximumPlateDissipationDatasets(minX, maxX) );
        }
        // calculate and store RMS error for model
        this.modelRmse = this.selectedModel && this.tube ? this.calculateModelRootMeanSquareError(this.file) : null;
        // datasets
        return datasets;
    }

    private createModelDatasets(color: string, isCombined: boolean, axesConfig: ReturnType<typeof this.getAxesForMeasurementType>, series: Series, measurementTypeCategory: string) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const modelDatasets: any[] = [];
        // Initialize model data array
        let modelData: { x: number; y1: number; y2: number }[] = [];
        // Generate model data based on measurement type
        if (measurementTypeCategory === 'plate') {
            // plate characteristic curve
            modelData = this.generatePlateCharacteristicCurve(series);
        }
        else if (measurementTypeCategory === 'transfer') {
            // transfer characteristic curve
            modelData = this.generateTransferCharacteristicCurve(series);
        }
        // Log model data info
        if (modelData.length > 0) {
            // check we are combining both currents in a single dataset
            if (isCombined) {
                // create combined dataset
                modelDatasets.push({
                    label: '', // Empty label to hide from legend
                    data: modelData.map((point) => ({ x: point.x, y: point.y1 + point.y2 })),
                    borderColor: color,
                    backgroundColor: color,
                    showLine: true,
                    fill: false,
                    tension: 0.1,
                    pointRadius: 0, // No points for model lines
                    borderWidth: 2,
                    yAxisID: 'y',
                });
                // exit
                return modelDatasets;
            }
            // create left Y axis dataset
            modelDatasets.push({
                label: '', // Empty label to hide from legend
                data: modelData.map((point) => ({ x: point.x, y: point.y1 })),
                borderColor: color,
                backgroundColor: color,
                showLine: true,
                fill: false,
                tension: 0.1,
                pointRadius: 0, // No points for model lines
                borderWidth: 2,
                yAxisID: 'y',
            });
            // create right Y axis dataset if dual axis
            if (axesConfig.hasDualYAxis && axesConfig.rightYField) {
                // create right Y axis dataset
                modelDatasets.push({
                    label: '', // Empty label to hide from legend
                    data: modelData.map((point) => ({ x: point.x, y: point.y2 })),
                    borderColor: color,
                    backgroundColor: color,
                    showLine: true,
                    fill: false,
                    tension: 0.1,
                    pointRadius: 0, // No points for model lines
                    borderWidth: 2,
                    borderDash: [2, 1], // Dashed line to distinguish from primary
                    yAxisID: 'y1',
                });
            }
            // exit
            return modelDatasets;
        }
        return [];
    }

    private calculateModelRootMeanSquareError(file: File): number | null {
        // triode
        if (this.selectedModel === 'norman-koren-triode') {
            // check model has been calculated
            if (!this.tube?.triodeModelParameters?.calculatedOn)
                return null;
            // model parameters
            const params = this.tube?.triodeModelParameters;
            // Check if all required parameters are available
            if (!params.mu || !params.ex || !params.kg1 || !params.kp || !params.kvb)
                return null;
            // calculate RMS error
            return normanKorenTriodeModelError([file], params.kp, params.mu, params.kvb, params.ex, params.kg1).rmse;
        }
        // pentode
        if (this.selectedModel === 'norman-koren-pentode') {
            // check model has been calculated
            if (!this.tube?.pentodeModelParameters?.calculatedOn)
                return null;
            // model parameters
            const params = this.tube?.pentodeModelParameters;
            // Check if all required parameters are available
            if (!params.mu || !params.ex || !params.kg1 || !params.kp || !params.kvb || !params.kg2)
                return null;
            // calculate RMS error
            return normanKorenNewPentodeModelError([file], params.kp, params.mu, params.kvb, params.ex, params.kg1, params.kg2).rmse;
        }
        // derk model
        if (this.selectedModel === 'derk-pentode') {
            // check model has been calculated
            if (!this.tube?.derkModelParameters?.calculatedOn)
                return null;
            // model parameters
            const params = this.tube?.derkModelParameters;
            // Check if all required parameters are available
            if (!params.mu || !params.ex || !params.kg1 || !params.kp || !params.kvb || !params.kg2 || !params.a || !params.alphaS || !params.beta)
                return null;
            // evaluate model, when no screen current use Pentode connected as a Triode
            return derkModelError([file], params.kp, params.mu, params.kvb, params.ex, params.kg1, params.kg2, params.a, params.alphaS, params.beta, params.secondaryEmission || false, params.s || 0, params.alphaP || 0, params.lambda || 0, params.v || 0, params.w || 0).rmse;
        }
        // derke model
        if (this.selectedModel === 'derke-pentode') {
            // check model has been calculated
            if (!this.tube?.derkEModelParameters?.calculatedOn)
                return null;
            // model parameters
            const params = this.tube?.derkEModelParameters;
            // Check if all required parameters are available
            if (!params.mu || !params.ex || !params.kg1 || !params.kp || !params.kvb || !params.kg2 || !params.a || !params.alphaS || !params.beta)
                return null;
            // evaluate model, when no screen current use Pentode connected as a Triode
            return derkEModelError([file], params.kp, params.mu, params.kvb, params.ex, params.kg1, params.kg2, params.a, params.alphaS, params.beta, params.secondaryEmission || false, params.s || 0, params.alphaP || 0, params.lambda || 0, params.v || 0, params.w || 0).rmse;
        }
        return null;
    }

    private generatePlateCharacteristicCurve(series: Series): { x: number; y1: number, y2: number }[] {
        // array to hold points
        const points: { x: number; y1: number, y2: number }[] = [];
        // Use the grid voltage from the series and apply egOffset
        const gridVoltage = (series.eg || 0) + (this.file?.egOffset || 0);
        // Generate points from 0 to a reasonable plate voltage
        const maxPlateVoltage = Math.max(300, ...series.points.map((p) => p.ep || 0));
        const stepSize = maxPlateVoltage / 100;
        // triode
        if (this.selectedModel === 'norman-koren-triode') {
            // check model has been calculated
            if (!this.tube?.triodeModelParameters?.calculatedOn)
                return [];
            // model parameters
            const params = this.tube?.triodeModelParameters;
            // Check if all required parameters are available
            if (!params.mu || !params.ex || !params.kg1 || !params.kp || !params.kvb)
                return [];
            // x values
            for (let plateVoltage = 0; plateVoltage <= maxPlateVoltage; plateVoltage += stepSize) {
                try {
                    const result = normanKorenTriodeModel(plateVoltage, gridVoltage, params.kp, params.mu, params.kvb, params.ex, params.kg1);
                    // values
                    points.push({ x: plateVoltage, y1: result.ip, y2: 0 });
                }
                catch {
                    // Skip invalid points
                    continue;
                }
            }
            return points;
        }
        // pentode
        if (this.selectedModel === 'norman-koren-pentode') {
            // check model has been calculated
            if (!this.tube?.pentodeModelParameters?.calculatedOn)
                return [];
            // model parameters
            const params = this.tube?.pentodeModelParameters;
            // Check if all required parameters are available
            if (!params.mu || !params.ex || !params.kg1 || !params.kp || !params.kvb || !params.kg2)
                return [];
            // screen voltage
            const screenVoltage = (series.es || 0);
            // x values
            for (let plateVoltage = 0; plateVoltage <= maxPlateVoltage; plateVoltage += stepSize) {
                try {
                    // evaluate model, when no screen current use Pentode connected as a Triode
                    const result = normanKorenNewPentodeModel(plateVoltage, gridVoltage, screenVoltage || plateVoltage, params.kp, params.mu, params.kvb, params.ex, params.kg1, params.kg2);
                    // values
                    points.push({ x: plateVoltage, y1: result.ip, y2: result.is });
                }
                catch {
                    // Skip invalid points
                    continue;
                }
            }
            return points;
        }
        // derk model
        if (this.selectedModel === 'derk-pentode') {
            // check model has been calculated
            if (!this.tube?.derkModelParameters?.calculatedOn)
                return [];
            // model parameters
            const params = this.tube?.derkModelParameters;
            // Check if all required parameters are available
            if (!params.mu || !params.ex || !params.kg1 || !params.kp || !params.kvb || !params.kg2 || !params.a || !params.alphaS || !params.beta)
                return [];
            // screen voltage
            const screenVoltage = (series.es || 0);
            // x values
            for (let plateVoltage = 0; plateVoltage <= maxPlateVoltage; plateVoltage += stepSize) {
                try {
                    // evaluate model, when no screen current use Pentode connected as a Triode
                    const result = derkModel(plateVoltage, gridVoltage, screenVoltage || plateVoltage, params.kp, params.mu, params.kvb, params.ex, params.kg1, params.kg2, params.a, params.alphaS, params.beta, params.secondaryEmission || false, params.s || 0, params.alphaP || 0, params.lambda || 0, params.v || 0, params.w || 0);
                    // values
                    points.push({ x: plateVoltage, y1: result.ip, y2: result.is });
                }
                catch {
                    // Skip invalid points
                    continue;
                }
            }
            return points;
        }
        // derke model
        if (this.selectedModel === 'derke-pentode') {
            // check model has been calculated
            if (!this.tube?.derkEModelParameters?.calculatedOn)
                return [];
            // model parameters
            const params = this.tube?.derkEModelParameters;
            // Check if all required parameters are available
            if (!params.mu || !params.ex || !params.kg1 || !params.kp || !params.kvb || !params.kg2 || !params.a || !params.alphaS || !params.beta)
                return [];
            // screen voltage
            const screenVoltage = (series.es || 0);
            // x values
            for (let plateVoltage = 0; plateVoltage <= maxPlateVoltage; plateVoltage += stepSize) {
                try {
                    // evaluate model, when no screen current use Pentode connected as a Triode
                    const result = derkEModel(plateVoltage, gridVoltage, screenVoltage || plateVoltage, params.kp, params.mu, params.kvb, params.ex, params.kg1, params.kg2, params.a, params.alphaS, params.beta, params.secondaryEmission || false, params.s || 0, params.alphaP || 0, params.lambda || 0, params.v || 0, params.w || 0);
                    // values
                    points.push({ x: plateVoltage, y1: result.ip, y2: result.is });
                }
                catch {
                    // Skip invalid points
                    continue;
                }
            }
            return points;
        }
        return [];
    }

    private generateTransferCharacteristicCurve(series: Series): { x: number; y1: number, y2: number }[] {
        // check model has been calculated
        if (!this.tube?.triodeModelParameters?.calculatedOn)
            return [];
        // array to hold points
        const points: { x: number; y1: number, y2: number }[] = [];
        const params = this.tube.triodeModelParameters;
        // Check if all required parameters are available
        if (!params.mu || !params.ex || !params.kg1 || !params.kp || !params.kvb)
            return [];
        // Use the plate voltage from the series
        const plateVoltage = series.ep || 250;
        // Generate points for grid voltage range
        const minGridVoltage = Math.min(-10, ...series.points.map((p) => p.eg || 0));
        const maxGridVoltage = Math.max(0, ...series.points.map((p) => p.eg || 0));
        const stepSize = (maxGridVoltage - minGridVoltage) / 100;
        const egOffset = this.file?.egOffset || 0;
        // triode
        if (this.selectedModel === 'norman-koren-triode') {
            // check model has been calculated
            if (!this.tube?.triodeModelParameters?.calculatedOn)
                return [];
            // model parameters
            const params = this.tube?.triodeModelParameters;
            // Check if all required parameters are available
            if (!params.mu || !params.ex || !params.kg1 || !params.kp || !params.kvb)
                return [];
            // x values
            for (let gridVoltage = minGridVoltage; gridVoltage <= maxGridVoltage; gridVoltage += stepSize) {
                try {
                    const result = normanKorenTriodeModel(plateVoltage, gridVoltage + egOffset, params.kp, params.mu, params.kvb, params.ex, params.kg1);
                    // values
                    points.push({ x: plateVoltage, y1: result.ip, y2: 0 });
                }
                catch {
                    // Skip invalid points
                    continue;
                }
            }
            return points;
        }
        // pentode
        if (this.selectedModel === 'norman-koren-pentode') {
            // check model has been calculated
            if (!this.tube?.pentodeModelParameters?.calculatedOn)
                return [];
            // model parameters
            const params = this.tube?.pentodeModelParameters;
            // Check if all required parameters are available
            if (!params.mu || !params.ex || !params.kg1 || !params.kp || !params.kvb || !params.kg2)
                return [];
            // screen voltage
            const screenVoltage = (series.es || 0);
            // x values
            for (let gridVoltage = minGridVoltage; gridVoltage <= maxGridVoltage; gridVoltage += stepSize) {
                try {
                    const result = normanKorenNewPentodeModel(plateVoltage, gridVoltage + egOffset, screenVoltage, params.kp, params.mu, params.kvb, params.ex, params.kg1, params.kg2);
                    // values
                    points.push({ x: plateVoltage, y1: result.ip, y2: result.is });
                }
                catch {
                    // Skip invalid points
                    continue;
                }
            }
            return points;
        }
        return [];
    }

    private createMaximumPlateDissipationDatasets(minPlateVoltage: number, maxPlateVoltage: number) {
        // plate dissipation (watts)
        const maxPlateDissipation = this.tube?.maximumPlateDissipation || 0;
        // points
        const points: { x: number; y: number }[] = [];
        // step size
        const stepSize = (maxPlateVoltage - minPlateVoltage) / 100;
        // x values
        for (let plateVoltage = minPlateVoltage; plateVoltage <= maxPlateVoltage; plateVoltage += stepSize) {
            // ip = Pd / Ep
            const ip = (maxPlateDissipation / plateVoltage) * 1000;
            // append point
            points.push({ x: plateVoltage, y: ip });
        }
        // no dataset on no points
        if (points.length === 0)
            return [];
        // create dataset
        return [
            {
                label: `Max Plate Dissipation (${this.tube?.maximumPlateDissipation}W)`,
                data: points,
                borderColor: '#DC3545', // Red color for warning/limit
                backgroundColor: '#DC3545',
                showLine: true,
                fill: false,
                tension: 0.1,
                pointRadius: 0,
                borderWidth: 1,
                borderDash: [10, 5], // Dashed line to indicate it's a limit
                yAxisID: 'y',
            }
        ];
    }

    // Helper method to safely access Point properties by string key
    private getPointValue(point: Point, fieldName: string): number | undefined {
        switch (fieldName) {
            case 'ip':
                return point.ip;
            case 'is':
                return point.is;
            case 'ep':
                return point.ep;
            case 'eg':
                return point.eg;
            case 'es':
                return point.es;
            case 'eh':
                return point.eh;
            case 'index':
                return point.index;
            default:
                return undefined;
        }
    }

    private getSeriesLabel(series: Series, index: number): string {
        // Try to determine the series label based on the measurement type
        if (series.eg !== undefined) {
            // Apply egOffset to grid voltage in series label
            const effectiveGridVoltage = series.eg + (this.file?.egOffset || 0);
            return `Vg = ${effectiveGridVoltage}V`;
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

    private calculateAxisRanges(xField: string, yField: string): { xMin: number; xMax: number; yMin: number; yMax: number } {
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
                let xValue = this.getPointValue(point, xField);
                let yValue = this.getPointValue(point, yField);

                // Apply egOffset to grid voltage values when calculating ranges
                if (xField === 'eg' && xValue !== undefined) {
                    xValue += this.file.egOffset;
                }
                if (yField === 'eg' && yValue !== undefined) {
                    yValue += this.file.egOffset;
                }

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
            yMax: Math.round((yMax + yPadding) * 100) / 100,
        };
    }

    private calculateDualAxisRanges(        xField: string,       leftYField: string,        rightYField: string    ): {        xMin: number;        xMax: number;        yMin: number;        yMax: number;        rightYMin: number;        rightYMax: number;    } {
        if (!this.file || this.file.series.length === 0) {
            return { xMin: 0, xMax: 100, yMin: 0, yMax: 100, rightYMin: 0, rightYMax: 100 };
        }

        let xMin = Number.MAX_VALUE;
        let xMax = Number.MIN_VALUE;
        let yMin = Number.MAX_VALUE;
        let yMax = Number.MIN_VALUE;
        let rightYMin = Number.MAX_VALUE;
        let rightYMax = Number.MIN_VALUE;

        // Find the actual min/max values from all data points
        for (const series of this.file.series) {
            for (const point of series.points) {
                let xValue = this.getPointValue(point, xField);
                let leftYValue = this.getPointValue(point, leftYField);
                let rightYValue = this.getPointValue(point, rightYField);

                // Apply egOffset to grid voltage values when calculating ranges
                if (xField === 'eg' && xValue !== undefined) {
                    xValue += this.file.egOffset;
                }
                if (leftYField === 'eg' && leftYValue !== undefined) {
                    leftYValue += this.file.egOffset;
                }
                if (rightYField === 'eg' && rightYValue !== undefined) {
                    rightYValue += this.file.egOffset;
                }

                if (xValue !== undefined) {
                    xMin = Math.min(xMin, xValue);
                    xMax = Math.max(xMax, xValue);
                }

                if (leftYValue !== undefined) {
                    yMin = Math.min(yMin, leftYValue);
                    yMax = Math.max(yMax, leftYValue);
                }

                if (rightYValue !== undefined) {
                    rightYMin = Math.min(rightYMin, rightYValue);
                    rightYMax = Math.max(rightYMax, rightYValue);
                }
            }
        }

        // Add some padding to the ranges (10% on each side)
        const xRange = xMax - xMin;
        const yRange = yMax - yMin;
        const rightYRange = rightYMax - rightYMin;

        // Handle edge cases where min equals max (single value)
        const xPadding = xRange > 0 ? xRange * 0.1 : Math.abs(xMax) * 0.1 || 1;
        const yPadding = yRange > 0 ? yRange * 0.1 : Math.abs(yMax) * 0.1 || 1;
        const rightYPadding = rightYRange > 0 ? rightYRange * 0.1 : Math.abs(rightYMax) * 0.1 || 1;

        // For voltage axes, ensure we start from a reasonable minimum
        if (xField === 'ep' || xField === 'es') {
            xMin = Math.max(0, xMin - xPadding);
        }
        else if (xField === 'eg') {
            xMin = xMin - xPadding;
        }
        else {
            xMin = xMin - xPadding;
        }

        // For current axes, typically start from 0
        if (leftYField === 'ip' || leftYField === 'is') {
            yMin = Math.max(0, yMin - yPadding);
        }
        else {
            yMin = yMin - yPadding;
        }

        if (rightYField === 'ip' || rightYField === 'is') {
            rightYMin = Math.max(0, rightYMin - rightYPadding);
        }
        else {
            rightYMin = rightYMin - rightYPadding;
        }

        return {
            xMin: Math.round(xMin * 100) / 100,
            xMax: Math.round((xMax + xPadding) * 100) / 100,
            yMin: Math.round(yMin * 100) / 100,
            yMax: Math.round((yMax + yPadding) * 100) / 100,
            rightYMin: Math.round(rightYMin * 100) / 100,
            rightYMax: Math.round((rightYMax + rightYPadding) * 100) / 100,
        };
    }

    private calculateCombinedCurrentAxisRanges(xField: string): {
        xMin: number;
        xMax: number;
        yMin: number;
        yMax: number;
    } {
        if (!this.file || this.file.series.length === 0) {
            return { xMin: 0, xMax: 100, yMin: 0, yMax: 100 };
        }

        let xMin = Number.MAX_VALUE;
        let xMax = Number.MIN_VALUE;
        let yMin = Number.MAX_VALUE;
        let yMax = Number.MIN_VALUE;

        // Calculate ranges from original file data, not from datasets (to exclude model data)
        for (const series of this.file.series) {
            for (const point of series.points) {
                let xValue = this.getPointValue(point, xField);
                const ipValue = this.getPointValue(point, 'ip');
                const isValue = this.getPointValue(point, 'is');

                // Apply egOffset to grid voltage values when calculating ranges
                if (xField === 'eg' && xValue !== undefined) {
                    xValue += this.file.egOffset;
                }

                // Calculate combined current (ip + is)
                if (xValue !== undefined && ipValue !== undefined && isValue !== undefined) {
                    const yValue = ipValue + isValue; // Combined current

                    xMin = Math.min(xMin, xValue);
                    xMax = Math.max(xMax, xValue);
                    yMin = Math.min(yMin, yValue);
                    yMax = Math.max(yMax, yValue);
                }
            }
        }

        // Handle edge cases
        if (xMin === Number.MAX_VALUE || xMax === Number.MIN_VALUE) {
            xMin = 0;
            xMax = 100;
        }
        if (yMin === Number.MAX_VALUE || yMax === Number.MIN_VALUE) {
            yMin = 0;
            yMax = 100;
        }

        // Calculate padding (10% of the range)
        const xRange = xMax - xMin;
        const yRange = yMax - yMin;
        const xPadding = Math.max(xRange * 0.1, 0.01);
        const yPadding = Math.max(yRange * 0.1, 0.01);

        // For combined current, Y axis should start at 0 as specified by user
        return {
            xMin: Math.round(xMin * 100) / 100,
            xMax: Math.round((xMax + xPadding) * 100) / 100,
            yMin: 0, // Always start at 0 for combined current
            yMax: Math.round((yMax + yPadding) * 100) / 100,
        };
    }

    getTotalPointsCount(): number {
        // check file exists
        if (!this.file)
            return 0;
        // all points in file
        return this.file.series.reduce((total, series) => total + series.points.length, 0);
    }

    onModelSelectionChange() {
        // Recreate the chart to update line visibility
        if (this.file && this.viewInitialized)
            this.createChart();
    }

    canGenerateCircuit(): boolean {
        // check if we can generate a circuit for the current file and model
        if (!this.file || !this.tube || !this.selectedModel)
            return false;
        // triode
        if (this.selectedModel === 'norman-koren-triode')
            return this.file.measurementType === 'IP_VA_VG_VH' || this.file.measurementType === 'IPIS_VAVS_VG_VH' || this.file.measurementType === 'IPIS_VA_VG_VS_VH';
        // pentode
        return this.file.measurementType === 'IPIS_VA_VG_VS_VH';
    }

    downloadCircuit(): void {
        // Validate we can generate the circuit
        if (!this.canGenerateCircuit() || !this.file || !this.tube) {
            return;
        }
        // create filename from current file name, replace utd extension by ".cir"
        const filename = this.file.name.replace(/\.utd$/i, '') + '.cir';
        // Generate circuit content based on selected model
        let circuitContent = '';
        // model specific
        if (this.selectedModel === 'norman-koren-triode') {
            // generate triode plate characteristics circuit
            circuitContent = this.circuitService.generateTriodePlateCharacteristicsCircuit(this.tube, this.file, this.modelService.getTriodeModel(this.tube), this.modelService.getTriodeModelDefinition());
        }
        else if (this.selectedModel === 'norman-koren-pentode') {
            // generate pentode plate characteristics circuit
            circuitContent = this.circuitService.generatePentodePlateCharacteristicsCircuit(this.tube, this.file, this.modelService.getPentodeModel(this.tube), this.modelService.getPentodeModelDefinition());
        }
        else if (this.selectedModel === 'derk-pentode') {
            // generate derk pentode plate characteristics circuit
            circuitContent = this.circuitService.generatePentodePlateCharacteristicsCircuit(this.tube, this.file, this.modelService.getDerkModel(this.tube), this.modelService.getDerkModelDefinition(this.tube.derkModelParameters?.secondaryEmission || false));
        }
        else if (this.selectedModel === 'derke-pentode') {
            // generate derke pentode plate characteristics circuit
            circuitContent = this.circuitService.generatePentodePlateCharacteristicsCircuit(this.tube, this.file, this.modelService.getDerkEModel(this.tube), this.modelService.getDerkEModelDefinition(this.tube.derkEModelParameters?.secondaryEmission || false));
        }
        // check if generation was successful (not an error message)
        if (circuitContent.startsWith('* Error:')) {
            // alert user
            alert(circuitContent);
            // exit
            return;
        }
        // instructions
        circuitContent += `\n* execute with: ngspice -b ${filename}\n`;
        // create blob and download
        const blob = new Blob([circuitContent], { type: 'text/plain' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.click();
        // cleanup
        window.URL.revokeObjectURL(url);
    }

    private updateAvailableModels() {
        // initialize models
        this.availableModels = [];
        // check tube data exists
        if (this.tube) {
            // triode model
            if (this.tube.triodeModelParameters?.calculatedOn)
                this.availableModels.push({key: 'norman-koren-triode', name: 'Norman Koren Triode Model'});
            // pentode model
            if (this.tube.pentodeModelParameters?.calculatedOn)
                this.availableModels.push({key: 'norman-koren-pentode', name: 'Norman Koren Pentode Model'});
            // derk model
            if (this.tube.derkModelParameters?.calculatedOn)
                this.availableModels.push({key: 'derk-pentode', name: 'Derk Pentode Model'});
            // derke model
            if (this.tube.derkEModelParameters?.calculatedOn)
                this.availableModels.push({key: 'derke-pentode', name: 'Derk E Pentode Model'});
        }
    }

    ngOnDestroy() {
        this.destroyChart();
    }

    // Helper methods for parsing new measurement type format
    private parseMeasurementType(measurementType: string): { yComponent: string; xComponent: string; seriesComponent: string; } {
        // Split the measurement type into components
        const components = measurementType.split('_');
        return {
            // Y axis
            yComponent: components[0] || '',
            // X axis
            xComponent: components[1] || '',
            // Series (constant) axis
            seriesComponent: components[2] || '',
        };
    }

    private getFieldFromComponent(component: string): string {
        switch (component) {
            case 'IP':
                return 'ip';
            case 'IS':
                return 'is';
            case 'VA':
            case 'VAVS':
                return 'ep';
            case 'VG':
                return 'eg';
            case 'VS':
                return 'es';
            default:
                return 'ep'; // default fallback
        }
    }

    private getLabelFromComponent(component: string): string {
        switch (component) {
            case 'IP':
                return 'Plate Current (mA)';
            case 'IS':
                return 'Screen Current (mA)';
            case 'VA':
                return 'Plate Voltage (V)';
            case 'VG':
                return 'Grid Voltage (V)';
            case 'VS':
                return 'Screen Voltage (V)';
            case 'VAVS':
                return 'Plate/Screen Voltage (V)';
            case 'IPIS':
                // Check if this is a combined current measurement (VAVS case)
                if (this.file?.measurementType && this.isCombinedCurrentMeasurement('IPIS', this.file.measurementType)) {
                    return 'Total Current (mA)';
                }
                return 'Plate/Screen Current (mA)';
            default:
                return 'Voltage (V)';
        }
    }

    private getMeasurementTypeFromComponents(yComponent: string, xComponent: string): 'plate' | 'transfer' | 'unknown' {
        // only currents in Y axis
        if (yComponent.includes('IP') || yComponent.includes('IS')) {
            // x axis voltage
            if (xComponent === 'VA' || xComponent === 'VAVS')
                return 'plate';
            else if (xComponent === 'VG')
                return 'transfer';
        }
        return 'unknown';
    }

    private isDualYAxisMeasurement(yComponent: string): boolean {
        // Check if Y component contains multiple measurements but exclude VAVS cases
        if (this.file?.measurementType && this.isCombinedCurrentMeasurement(yComponent, this.file.measurementType)) {
            return false; // VAVS cases use combined current plotting
        }
        return yComponent === 'IPIS' || (yComponent.includes('IP') && yComponent.includes('IS'));
    }

    private parseDualYComponent(yComponent: string): { primary: string; secondary: string } {
        if (yComponent === 'IPIS') {
            return { primary: 'IP', secondary: 'IS' };
        }
        // Add support for other dual measurements if needed in the future
        return { primary: yComponent, secondary: '' };
    }

    private getYAxisConfig(yComponent: string): {
        hasDualAxis: boolean;
        leftAxis: string;
        rightAxis: string;
        leftLabel: string;
        rightLabel: string;
    } {
        // check dual y axis is required
        if (this.isDualYAxisMeasurement(yComponent)) {
            // left & right axis
            const { primary, secondary } = this.parseDualYComponent(yComponent);
            return {
                hasDualAxis: true,
                leftAxis: this.getFieldFromComponent(primary),
                rightAxis: this.getFieldFromComponent(secondary),
                leftLabel: this.getLabelFromComponent(primary),
                rightLabel: this.getLabelFromComponent(secondary),
            };
        }
        else {
            return {
                hasDualAxis: false,
                leftAxis: this.getFieldFromComponent(yComponent),
                rightAxis: '',
                leftLabel: this.getLabelFromComponent(yComponent),
                rightLabel: '',
            };
        }
    }

    private isVAVSMeasurement(measurementType: string): boolean {
        // Check if measurement type contains VAVS (plate and screen voltage equal)
        return measurementType.includes('VAVS');
    }

    private isCombinedCurrentMeasurement(yComponent: string, measurementType: string): boolean {
        // IPIS measurements with VAVS should be treated as combined current (ip + is)
        return yComponent === 'IPIS' && this.isVAVSMeasurement(measurementType);
    }
}
