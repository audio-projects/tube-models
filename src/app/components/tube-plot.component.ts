import { AfterViewInit, Component, ElementRef, Input, OnChanges, OnDestroy, SimpleChanges, ViewChild } from '@angular/core';
import { Chart, ChartConfiguration, registerables } from 'chart.js';
import { CommonModule } from '@angular/common';
import { File as TubeFile, Point, Series } from '../files';
import { FormsModule } from '@angular/forms';
import { normanKorenPentodeModel } from '../workers/models/norman-koren-pentode-model';
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
                <h5 class="fw-bold"><i class="bi bi-graph-up me-2"></i>{{ file.name }}</h5>
                <p class="text-muted mb-2">
                    {{ getMeasurementTypeDescription() }}
                    <span *ngIf="file.series.length > 0"> • {{ file.series.length }} series • {{ getTotalPointsCount() }} points </span>
                </p>

                <!-- Model Selection Dropdown -->
                <div class="mb-3" *ngIf="availableModels.length > 0">
                    <label for="modelSelect" class="form-label fw-bold"> <i class="bi bi-gear me-1"></i>Compare with Model </label>
                    <select class="form-select form-select-sm" id="modelSelect" [(ngModel)]="selectedModel" (ngModelChange)="onModelSelectionChange()">
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
            // For EPES cases, calculate ranges based on combined current (ip + is)
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
        if (!this.file) return [];
        // colors
        const colors = ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40', '#FF6384', '#C9CBCF', '#4BC0C0', '#FF6384'];
        // Show lines connecting points when no model is selected
        const showLines = this.selectedModel === '' || this.selectedModel === null;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const datasets: any[] = [];
        // Create datasets for each series
        this.file.series.forEach((series, index) => {
            // series color
            const color = colors[index % colors.length];
            // label
            const seriesLabel = this.getSeriesLabel(series, index);
            // Check if this is a combined current measurement (EPES case)
            const { yComponent } = this.parseMeasurementType(this.file!.measurementType);
            const isCombined = this.isCombinedCurrentMeasurement(yComponent, this.file!.measurementType);

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
                        fill: false,
                        pointRadius: 2,
                        pointHoverRadius: 4,
                        showLine: showLines,
                        tension: 0.1,
                        yAxisID: 'y', // Single axis for combined measurement
                    });
                }
            }
            else {
                // Create primary Y-axis dataset (left axis)
                const primaryData = series.points
                    .filter((point) => this.getPointValue(point, axesConfig.xField) !== undefined && this.getPointValue(point, axesConfig.yField) !== undefined)
                    .map((point) => {
                        let xValue = this.getPointValue(point, axesConfig.xField) as number;
                        let yValue = this.getPointValue(point, axesConfig.yField) as number;

                        // Apply egOffset to grid voltage values when plotting
                        if (axesConfig.xField === 'eg') {
                            xValue += this.file!.egOffset;
                        }
                        if (axesConfig.yField === 'eg') {
                            yValue += this.file!.egOffset;
                        }

                        return { x: xValue, y: yValue };
                    })
                    .sort((a, b) => a.x - b.x);

                if (primaryData.length > 0) {
                    datasets.push({
                        label: seriesLabel, // Same series label for both axes
                        data: primaryData,
                        borderColor: color,
                        backgroundColor: color,
                        fill: false,
                        pointRadius: 2,
                        pointHoverRadius: 4,
                        showLine: showLines,
                        tension: 0.1,
                        yAxisID: 'y', // Left axis
                    });
                }
            }

            // Create secondary Y-axis dataset (right axis) if dual axis
            if (axesConfig.hasDualYAxis && axesConfig.rightYField) {
                const secondaryData = series.points
                    .filter((point) => this.getPointValue(point, axesConfig.xField) !== undefined && this.getPointValue(point, axesConfig.rightYField!) !== undefined)
                    .map((point) => {
                        let xValue = this.getPointValue(point, axesConfig.xField) as number;
                        let yValue = this.getPointValue(point, axesConfig.rightYField!) as number;

                        // Apply egOffset to grid voltage values when plotting
                        if (axesConfig.xField === 'eg') {
                            xValue += this.file!.egOffset;
                        }
                        if (axesConfig.rightYField === 'eg') {
                            yValue += this.file!.egOffset;
                        }

                        return { x: xValue, y: yValue };
                    })
                    .sort((a, b) => a.x - b.x);

                if (secondaryData.length > 0) {
                    datasets.push({
                        label: '', // Empty label to hide from legend (same series as primary)
                        data: secondaryData,
                        borderColor: color,
                        backgroundColor: color,
                        borderDash: [5, 5], // Dashed line to distinguish from primary
                        fill: false,
                        pointRadius: 2,
                        pointHoverRadius: 4,
                        showLine: showLines,
                        tension: 0.1,
                        yAxisID: 'y1', // Right axis
                    });
                }
            }
        });

        // Add model curves if a model is selected
        if (this.selectedModel && this.tube)
            datasets.push(...this.createModelDatasets(axesConfig.xField, axesConfig.yField));

        return datasets;
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    private createModelDatasets(_xField: string, _yField: string) {
        // check a model is selected
        if (!this.file || !this.tube || !this.selectedModel)
            return [];

        const colors = ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40', '#FF6384', '#C9CBCF', '#4BC0C0', '#FF6384'];

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const modelDatasets: any[] = [];

        switch (this.selectedModel) {
            // triode
            case 'norman-koren-triode':
                // Check if we have triode model parameters (could be on pentode tube operating in triode mode)
                if (this.tube.triodeModelParameters?.calculatedOn) {
                    // loop series
                    this.file.series.forEach((series, index) => {
                        // Initialize model data array
                        let modelData: { x: number; y: number }[] = [];
                        // Parse measurement type to determine curve generation method
                        const { yComponent, xComponent } = this.parseMeasurementType(this.file!.measurementType);
                        const measurementTypeCategory = this.getMeasurementTypeFromComponents(yComponent, xComponent);
                        // Generate model data based on measurement type
                        if (measurementTypeCategory === 'plate')
                            modelData = this.generateTriodePlateCharacteristicCurve(series);
                        else if (measurementTypeCategory === 'transfer')
                            modelData = this.generateTriodeTransferCharacteristicCurve(series);
                        // Log model data info
                        if (modelData.length > 0) {
                            // color
                            const color = colors[index % colors.length];
                            // push dataset
                            modelDatasets.push({
                                label: '', // Empty label to hide from legend
                                data: modelData,
                                backgroundColor: color,
                                borderColor: color,
                                showLine: true,
                                fill: false,
                                tension: 0.1,
                                pointRadius: 0, // No points for model lines
                                borderWidth: 2,
                                borderDash: [5, 5], // Dashed line for model
                            });
                        }
                    });
                }
                break;
            // pentode
            case 'norman-koren-pentode':
                // Check if we have triode model parameters (could be on pentode tube operating in triode mode)
                if (this.tube.triodeModelParameters?.calculatedOn) {
                    // loop series
                    this.file.series.forEach((series, index) => {
                        // Initialize model data array
                        let modelData: { x: number; y: number }[] = [];
                        // Parse measurement type to determine curve generation method
                        const { yComponent, xComponent } = this.parseMeasurementType(this.file!.measurementType);
                        const measurementTypeCategory = this.getMeasurementTypeFromComponents(yComponent, xComponent);
                        const isCombined = this.isCombinedCurrentMeasurement(yComponent, this.file!.measurementType);
                        // Generate model data based on measurement type
                        if (measurementTypeCategory === 'plate') {
                            if (isCombined) {
                                modelData = this.generateCombinedCurrentPlateCharacteristicCurve(series);
                            }
                            else {
                                modelData = this.generateTriodePlateCharacteristicCurve(series);
                            }
                        }
                        else if (measurementTypeCategory === 'transfer') {
                            if (isCombined) {
                                modelData = this.generateCombinedCurrentTransferCharacteristicCurve(series);
                            }
                            else {
                                modelData = this.generateTriodeTransferCharacteristicCurve(series);
                            }
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
                                pointRadius: 0, // No points for model lines
                                borderWidth: 2,
                                borderDash: [5, 5], // Dashed line for model
                            });
                        }
                    });
                }
                else {
                    console.log('✗ No calculated triode parameters found');
                    console.log('Available tube parameters:', {
                        triode: this.tube.triodeModelParameters,
                    });
                }
                break;
        }
        return modelDatasets;
    }

    private generateTriodePlateCharacteristicCurve(series: Series): { x: number; y: number }[] {
        // check model has been calculated
        if (!this.tube?.triodeModelParameters?.calculatedOn) return [];
        // array to hold points
        const points: { x: number; y: number }[] = [];
        const params = this.tube.triodeModelParameters;
        // Check if all required parameters are available
        if (!params.mu || !params.ex || !params.kg1 || !params.kp || !params.kvb) return [];
        // Use the grid voltage from the series and apply egOffset
        const gridVoltage = (series.eg || 0) + (this.file?.egOffset || 0);
        // Generate points from 0 to a reasonable plate voltage
        const maxPlateVoltage = Math.max(300, ...series.points.map((p) => p.ep || 0));
        const stepSize = maxPlateVoltage / 100;
        // x values
        for (let plateVoltage = 0; plateVoltage <= maxPlateVoltage; plateVoltage += stepSize) {
            try {
                const result = normanKorenTriodeModel(plateVoltage, gridVoltage, params.kp, params.mu, params.kvb, params.ex, params.kg1);
                // y values
                if (result.ip >= 0 && isFinite(result.ip)) points.push({ x: plateVoltage, y: result.ip });
            }
            catch {
                // Skip invalid points
                continue;
            }
        }
        return points;
    }

    // private generatePentodePlateCharacteristicCurve(series: Series): { x: number; y: number }[] {
    //     // check model has been calculated
    //     if (!this.tube?.pentodeModelParameters?.calculatedOn) return [];
    //     // array to hold points
    //     const points: { x: number; y1: number; y2: number }[] = [];
    //     const params = this.tube.pentodeModelParameters;
    //     // Check if all required parameters are available
    //     if (!params.mu || !params.ex || !params.kg1 || !params.kp || !params.kvb || !params.kg2) return [];
    //     // Use the grid voltage from the series and apply egOffset
    //     const gridVoltage = (series.eg || 0) + (this.file?.egOffset || 0);
    //     // Generate points from 0 to a reasonable plate voltage
    //     const maxPlateVoltage = Math.max(300, ...series.points.map((p) => p.ep || 0));
    //     const stepSize = maxPlateVoltage / 100;
    //     // x values
    //     for (let plateVoltage = 0; plateVoltage <= maxPlateVoltage; plateVoltage += stepSize) {
    //         try {
    //             // evaluate model
    //             const result = normanKorenPentodeModel(plateVoltage, gridVoltage, this.file?.es || 0, params.kp, params.mu, params.kvb, params.ex, params.kg1, params.kg2);
    //             // y values
    //             points.push({ x: plateVoltage, y1: result.ip, y2: result.is });
    //         }
    //         catch {
    //             // Skip invalid points
    //             continue;
    //         }
    //     }
    //     return points;
    // }

    private generateTriodeTransferCharacteristicCurve(series: Series): { x: number; y: number }[] {
        // check model has been calculated
        if (!this.tube?.triodeModelParameters?.calculatedOn) return [];
        // array to hold points
        const points: { x: number; y: number }[] = [];
        const params = this.tube.triodeModelParameters;
        // Check if all required parameters are available
        if (!params.mu || !params.ex || !params.kg1 || !params.kp || !params.kvb) return [];
        // Use the plate voltage from the series
        const plateVoltage = series.ep || 250;
        // Generate points for grid voltage range
        const minGridVoltage = Math.min(-10, ...series.points.map((p) => p.eg || 0));
        const maxGridVoltage = Math.max(0, ...series.points.map((p) => p.eg || 0));
        const stepSize = (maxGridVoltage - minGridVoltage) / 100;
        const egOffset = this.file?.egOffset || 0;
        // x values
        for (let gridVoltage = minGridVoltage; gridVoltage <= maxGridVoltage; gridVoltage += stepSize) {
            try {
                // calculate ip current
                const result = normanKorenTriodeModel(plateVoltage, gridVoltage + egOffset, params.kp, params.mu, params.kvb, params.ex, params.kg1);
                if (result.ip >= 0 && isFinite(result.ip))
                    points.push({ x: gridVoltage + egOffset, y: result.ip });
            }
            catch {
                // Skip invalid points
                continue;
            }
        }
        return points;
    }

    private generateCombinedCurrentPlateCharacteristicCurve(series: Series): { x: number; y: number }[] {
        console.log('generateCombinedCurrentPlateCharacteristicCurve called for series:', series);

        if (!this.tube?.triodeModelParameters?.calculatedOn) {
            console.log('No calculated triode parameters available');
            return [];
        }

        const points: { x: number; y: number }[] = [];
        const params = this.tube.triodeModelParameters;

        console.log('Using triode parameters for combined current:', params);

        // Check if all required parameters are available
        if (!params.mu || !params.ex || !params.kg1 || !params.kp || !params.kvb) {
            console.log('Missing required parameters:', {
                mu: params.mu,
                ex: params.ex,
                kg1: params.kg1,
                kp: params.kp,
                kvb: params.kvb,
            });
            return [];
        }

        // Use the grid voltage from the series and apply egOffset
        const gridVoltage = (series.eg || 0) + (this.file?.egOffset || 0);

        // Generate points from 0 to a reasonable plate voltage
        const maxPlateVoltage = Math.max(300, ...series.points.map((p) => p.ep || 0));
        const stepSize = maxPlateVoltage / 100;

        for (let plateVoltage = 0; plateVoltage <= maxPlateVoltage; plateVoltage += stepSize) {
            try {
                const result = normanKorenTriodeModel(plateVoltage, gridVoltage, params.kp, params.mu, params.kvb, params.ex, params.kg1);

                // For combined current, we need to approximate ip + is
                // Since this is a triode model, result only has ip
                // For EPES (Equal Plate/Screen voltage), we can assume is ≈ 0 or a small fraction of ip
                // This is a simplification - in reality, we'd need a proper pentode model
                const combinedCurrent = result.ip; // For triode model, is ≈ 0

                if (combinedCurrent >= 0 && isFinite(combinedCurrent)) points.push({ x: plateVoltage, y: combinedCurrent });
            }
            catch {
                // Skip invalid points
                continue;
            }
        }

        console.log(`Generated ${points.length} points for combined current plate characteristic curve`);
        return points;
    }

    private generateCombinedCurrentTransferCharacteristicCurve(series: Series): { x: number; y: number }[] {
        if (!this.tube?.triodeModelParameters?.calculatedOn) return [];

        const points: { x: number; y: number }[] = [];
        const params = this.tube.triodeModelParameters;

        if (!params.mu || !params.ex || !params.kg1 || !params.kp || !params.kvb) return [];

        // Use the plate voltage from the series
        const plateVoltage = series.ep || 0;
        const minGridVoltage = Math.min(-10, ...series.points.map((p) => (p.eg || 0) + (this.file?.egOffset || 0)));
        const maxGridVoltage = Math.max(0, ...series.points.map((p) => (p.eg || 0) + (this.file?.egOffset || 0)));
        const stepSize = (maxGridVoltage - minGridVoltage) / 100;

        for (let gridVoltage = minGridVoltage; gridVoltage <= maxGridVoltage; gridVoltage += stepSize) {
            try {
                const result = normanKorenTriodeModel(plateVoltage, gridVoltage, params.kp, params.mu, params.kvb, params.ex, params.kg1);

                // For combined current, we need to approximate ip + is
                // Since this is a triode model, result only has ip
                const combinedCurrent = result.ip; // For triode model, is ≈ 0

                if (combinedCurrent >= 0 && isFinite(combinedCurrent))
                    points.push({
                        x: gridVoltage - (this.file?.egOffset || 0),
                        y: combinedCurrent,
                    });
            }
            catch {
                continue;
            }
        }

        console.log(`Generated ${points.length} points for combined current transfer characteristic curve`);
        return points;
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

    getMeasurementTypeDescription(): string {
        if (!this.file?.measurementType) return '';

        // Parse the new measurement type format
        const { yComponent, xComponent, seriesComponent } = this.parseMeasurementType(this.file.measurementType);

        if (!yComponent || !xComponent || !seriesComponent) {
            return this.file.measurementType;
        }

        // Handle special EPES cases (combined current)
        if (this.isCombinedCurrentMeasurement(yComponent, this.file.measurementType)) {
            const xShort = xComponent === 'EG' ? 'Vg' : xComponent === 'EPES' ? 'Va=Vs' : xComponent;
            const seriesShort = seriesComponent === 'EG' ? 'Vg' : seriesComponent === 'EPES' ? 'Va=Vs' : seriesComponent;
            return `Ip+Is vs ${xShort} (${seriesShort} constant)`;
        }

        // Create a descriptive string with short notation
        const yShort = yComponent === 'IP' ? 'Ip' : yComponent === 'IS' ? 'Is' : yComponent === 'IPIS' ? 'Ip,Is' : yComponent;
        const xShort = xComponent === 'EP' ? 'Va' : xComponent === 'EG' ? 'Vg' : xComponent === 'ES' ? 'Vs' : xComponent === 'EPES' ? 'Va=Vs' : xComponent;
        const seriesShort = seriesComponent === 'EP' ? 'Va' : seriesComponent === 'EG' ? 'Vg' : seriesComponent === 'ES' ? 'Vs' : seriesComponent === 'EPES' ? 'Va=Vs' : seriesComponent;

        return `${yShort} vs ${xShort} (${seriesShort} constant)`;
    }

    getTotalPointsCount(): number {
        if (!this.file) return 0;
        return this.file.series.reduce((total, series) => total + series.points.length, 0);
    }

    onModelSelectionChange() {
        // Recreate the chart to update line visibility
        if (this.file && this.viewInitialized) {
            this.createChart();
        }
    }

    private updateAvailableModels() {
        // initialize models
        this.availableModels = [];
        // check tube data exists
        if (this.tube) {
            // triode model
            if (this.tube.triodeModelParameters?.calculatedOn)
                this.availableModels.push({
                    key: 'norman-koren-triode',
                    name: 'Norman Koren Triode Model',
                });
            // pentode model
            if (this.tube.pentodeModelParameters?.calculatedOn)
                this.availableModels.push({
                    key: 'norman-koren-pentode',
                    name: 'Norman Koren Pentode Model',
                });
        }
    }

    ngOnDestroy() {
        this.destroyChart();
    }

    // Helper methods for parsing new measurement type format
    private parseMeasurementType(measurementType: string): { yComponent: string; xComponent: string; seriesComponent: string; } {
        const components = measurementType.split('_');
        return {
            yComponent: components[0] || '',
            xComponent: components[1] || '',
            seriesComponent: components[2] || '',
        };
    }

    private getFieldFromComponent(component: string): string {
        switch (component) {
            case 'IP':
                return 'ip';
            case 'IS':
                return 'is';
            case 'EP':
            case 'EPES':
                return 'ep';
            case 'EG':
                return 'eg';
            case 'ES':
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
            case 'EP':
                return 'Plate Voltage (V)';
            case 'EG':
                return 'Grid Voltage (V)';
            case 'ES':
                return 'Screen Voltage (V)';
            case 'EPES':
                return 'Plate/Screen Voltage (V)';
            case 'IPIS':
                // Check if this is a combined current measurement (EPES case)
                if (this.file?.measurementType && this.isCombinedCurrentMeasurement('IPIS', this.file.measurementType)) {
                    return 'Total Current (mA)';
                }
                return 'Plate/Screen Current (mA)';
            default:
                return 'Voltage (V)';
        }
    }

    private getMeasurementTypeFromComponents(yComponent: string, xComponent: string): 'plate' | 'transfer' | 'unknown' {
        // Determine if this is plate characteristics (current vs plate voltage)
        // or transfer characteristics (current vs grid voltage)
        if (yComponent.includes('IP') || yComponent.includes('IS')) {
            if (xComponent === 'EP' || xComponent === 'EPES') {
                return 'plate';
            }
            else if (xComponent === 'EG') {
                return 'transfer';
            }
        }
        return 'unknown';
    }

    private isDualYAxisMeasurement(yComponent: string): boolean {
        // Check if Y component contains multiple measurements but exclude EPES cases
        if (this.file?.measurementType && this.isCombinedCurrentMeasurement(yComponent, this.file.measurementType)) {
            return false; // EPES cases use combined current plotting
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
        if (this.isDualYAxisMeasurement(yComponent)) {
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
            const field = this.getFieldFromComponent(yComponent);
            const label = this.getLabelFromComponent(yComponent);
            return {
                hasDualAxis: false,
                leftAxis: field,
                rightAxis: '',
                leftLabel: label,
                rightLabel: '',
            };
        }
    }

    private isEPESMeasurement(measurementType: string): boolean {
        // Check if measurement type contains EPES (plate and screen voltage equal)
        return measurementType.includes('EPES');
    }

    private isCombinedCurrentMeasurement(yComponent: string, measurementType: string): boolean {
        // IPIS measurements with EPES should be treated as combined current (ip + is)
        return yComponent === 'IPIS' && this.isEPESMeasurement(measurementType);
    }
}
