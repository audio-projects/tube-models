import { Component, Input, OnInit, OnChanges, SimpleChanges, ViewChild, ElementRef, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TubeInformation } from './tube-information';
import { Chart, ChartConfiguration, registerables } from 'chart.js';
import { normanKorenTriodeModel } from '../workers/models/norman-koren-triode-model';
import { normanKorenNewPentodeModel } from '../workers/models/norman-koren-new-pentode-model';
import { derkModel } from '../workers/models/derk-model';
import { derkEModel } from '../workers/models/derke-model';

Chart.register(...registerables);

interface LoadLinePoint {
    va: number;
    ia: number;
}

interface ChartDataset {
    label: string;
    data: { x: number; y: number }[];
    borderColor: string;
    borderWidth: number;
    pointRadius: number;
    fill: boolean;
    tension: number;
    borderDash?: number[];
    backgroundColor?: string;
    pointStyle?: string;
    showLine?: boolean;
}

@Component({
    selector: 'app-single-ended-designer',
    templateUrl: './single-ended-designer.component.html',
    styleUrl: './single-ended-designer.component.scss',
    imports: [CommonModule, FormsModule],
    standalone: true
})
export class SingleEndedDesignerComponent implements OnInit, OnChanges, AfterViewInit, OnDestroy {
    @Input() tube: TubeInformation | null = null;
    @ViewChild('chartCanvas') chartCanvas!: ElementRef<HTMLCanvasElement>;

    private chart: Chart | null = null;
    private viewInitialized = false;

    // Available model types
    availableModels: string[] = [];
    selectedModel = '';

    // Design parameters
    bPlus = 250; // B+ (HT) supply voltage (V)
    loadType: 'transformer' | 'resistor' = 'transformer'; // Load type: output transformer or plate resistor
    rl = 5000; // Load resistance (Ω) - For transformer: primary reflected impedance (RLp), For resistor: plate resistor (Rp)
    transformerDCR = 50; // Transformer primary DC resistance (Ω) - only for transformer load type
    biasScheme: 'cathode' | 'fixed' = 'cathode'; // Bias scheme: cathode self-bias or fixed negative bias
    quiescentCurrent = 50; // Quiescent plate current Iq (mA) - user selectable

    // Calculated values
    quiescentPlateVoltage = 0; // Quiescent plate voltage (V) - for SE, approximately B+
    requiredGridBias = 0; // Required grid bias voltage (V) to achieve Iq
    quiescentPlateDissipation = 0; // Quiescent plate dissipation Pq = Vp * Iq (W)
    plateDissipationPercentage = 0; // Percentage of tube's maximum plate dissipation
    recommendedIqMin = 0; // Minimum recommended Iq for 30% of PD,max (mA)
    recommendedIqMax = 0; // Maximum recommended Iq for 50% of PD,max (mA)
    cathodeResistor = 0; // Required cathode resistor for self-bias (Ω)
    cathodeBypassCapacitor = 0; // Recommended cathode bypass capacitor (µF)
    maxOutputPower = 0; // Maximum theoretical output power (W)
    dcLoadLine: LoadLinePoint[] = []; // DC load line (vertical for SE with transformer)
    acLoadLine: LoadLinePoint[] = []; // AC load line (slope = -1/RL through Q-point)

    // Display flags
    showCalculations = false;

    ngOnInit() {
        this.updateAvailableModels();
        if (this.availableModels.length > 0) {
            this.selectedModel = this.availableModels[0];
        }
        this.calculateRecommendedIq();
        this.calculateOperatingPoint();
    }

    ngOnChanges(changes: SimpleChanges) {
        if (changes['tube']) {
            this.updateAvailableModels();
            if (this.availableModels.length > 0 && !this.selectedModel) {
                this.selectedModel = this.availableModels[0];
            }
            this.calculateRecommendedIq();
            this.calculateOperatingPoint();
            this.updateChart();
        }
    }

    ngAfterViewInit() {
        this.viewInitialized = true;
        this.createChart();
    }

    ngOnDestroy() {
        if (this.chart) {
            this.chart.destroy();
            this.chart = null;
        }
    }

    /**
     * Update the list of available models based on calculated parameters
     */
    updateAvailableModels() {
        this.availableModels = [];

        if (!this.tube) {
            return;
        }

        if (this.tube.triodeModelParameters?.mu) {
            this.availableModels.push('Norman-Koren Triode Model');
        }

        if (this.tube.pentodeModelParameters?.mu) {
            this.availableModels.push('Norman-Koren Pentode Model');
        }

        if (this.tube.derkModelParameters?.mu) {
            this.availableModels.push('Derk Pentode Model');
        }

        if (this.tube.derkEModelParameters?.mu) {
            this.availableModels.push('Derk-E Pentode Model');
        }
    }

    /**
     * Calculate recommended Iq range based on tube's maximum plate dissipation
     * Rule: Pq = Vp * Iq should be 30-50% of PD,max
     */
    calculateRecommendedIq() {
        if (!this.tube?.maximumPlateDissipation || this.tube.maximumPlateDissipation <= 0) {
            this.recommendedIqMin = 0;
            this.recommendedIqMax = 0;
            return;
        }

        const pdMax = this.tube.maximumPlateDissipation; // W
        // For SE output stage, plate is at B+ (transformer primary between plate and B+)
        const vp = this.bPlus;

        // Pq = 30% to 50% of PD,max
        // Iq = Pq / Vp
        this.recommendedIqMin = (pdMax * 0.3 * 1000) / vp; // Convert to mA
        this.recommendedIqMax = (pdMax * 0.5 * 1000) / vp; // Convert to mA

        // Set quiescentCurrent to middle of recommended range if not already set
        if (this.quiescentCurrent === 0 || this.quiescentCurrent < this.recommendedIqMin || this.quiescentCurrent > this.recommendedIqMax) {
            this.quiescentCurrent = (this.recommendedIqMin + this.recommendedIqMax) / 2;
        }
    }

    /**
     * Calculate operating point and load lines based on selected Iq and load type
     */
    calculateOperatingPoint() {
        if (!this.tube || !this.bPlus || !this.rl || !this.selectedModel) {
            this.dcLoadLine = [];
            this.acLoadLine = [];
            return;
        }

        if (this.loadType === 'transformer') {
            this.calculateTransformerLoad();
        }
        else {
            this.calculateResistorLoad();
        }

        // Calculate cathode resistor and bypass capacitor for cathode bias
        if (this.biasScheme === 'cathode') {
            // Rk = |Vg| / Ik (where Ik ≈ Iq for triode, or Iq + Is for pentode)
            if (this.requiredGridBias < 0) {
                this.cathodeResistor = Math.abs(this.requiredGridBias) / (this.quiescentCurrent / 1000);
            }
            else {
                this.cathodeResistor = 0;
            }

            // Bypass capacitor: Ck > 10 / (2π * f_low * Rk)
            // For f_low = 20 Hz: Ck = 10 / (2π * 20 * Rk) = 0.0796 / Rk
            if (this.cathodeResistor > 0) {
                this.cathodeBypassCapacitor = (0.0796 / this.cathodeResistor) * 1e6; // Convert to µF
            }
            else {
                this.cathodeBypassCapacitor = 0;
            }
        }
    }

    /**
     * Calculate operating point for OUTPUT TRANSFORMER load
     * DC loadline: nearly vertical (Va ≈ B+ - Iq×DCR)
     * AC loadline: slope = -1/RLp through Q-point
     */
    private calculateTransformerLoad() {
        // For SE output stage with transformer:
        // DC voltage drop is only the transformer primary DCR (usually small)
        // Vp = B+ - Iq * DCR
        this.quiescentPlateVoltage = this.bPlus - (this.quiescentCurrent * this.transformerDCR / 1000);

        // Calculate quiescent plate dissipation
        this.quiescentPlateDissipation = (this.quiescentPlateVoltage * this.quiescentCurrent) / 1000; // W

        // Calculate percentage of maximum plate dissipation
        if (this.tube?.maximumPlateDissipation && this.tube.maximumPlateDissipation > 0) {
            this.plateDissipationPercentage = (this.quiescentPlateDissipation / this.tube.maximumPlateDissipation) * 100;
        }
        else {
            this.plateDissipationPercentage = 0;
        }

        // Find required grid bias to achieve Iq at calculated Va
        this.requiredGridBias = this.findGridBiasForCurrent(this.quiescentPlateVoltage, this.quiescentCurrent);

        // DC Load Line: nearly vertical line at Va ≈ B+ (small slope due to DCR)
        // Ia = (B+ - Va) / DCR
        const iaMaxDC = (this.bPlus / this.transformerDCR) * 1000; // Maximum current if plate shorted to ground through DCR
        this.dcLoadLine = [
            { va: this.bPlus, ia: 0 },
            { va: 0, ia: Math.min(iaMaxDC, this.quiescentCurrent * 3) } // Limit for visualization
        ];

        // AC Load Line: passes through Q-point with slope = -1/RLp (primary reflected impedance)
        // Va_ac = Vq - (Ia_ac - Iq) * RLp
        // At Ia = 0: Va = Vq + Iq * RLp / 1000 (peak positive voltage swing)
        // At Va = 0: Ia = Iq + Vq / (RLp / 1000) (peak positive current swing)
        const vaMaxAC = this.quiescentPlateVoltage + (this.quiescentCurrent * this.rl) / 1000;
        const iaMaxAC = this.quiescentCurrent + (this.quiescentPlateVoltage / (this.rl / 1000));

        this.acLoadLine = [
            { va: vaMaxAC, ia: 0 },
            { va: 0, ia: iaMaxAC }
        ];

        // Calculate maximum output power for transformer load
        // For Class A SE with transformer: Po,max ≈ (Iq^2 * RLp) / 2000 (in Watts)
        // More accurately: Po,max ≈ (Vq * Iq) / 2 if voltage-limited, or (Iq^2 * RLp) / 2 if current-limited
        const powerVoltageLimited = (this.quiescentPlateVoltage * this.quiescentCurrent) / 2000;
        const powerCurrentLimited = (this.quiescentCurrent * this.quiescentCurrent * this.rl) / 2000000;
        this.maxOutputPower = Math.min(powerVoltageLimited, powerCurrentLimited);
    }

    /**
     * Calculate operating point for PLATE RESISTOR load
     * DC and AC loadlines are the SAME: Ia = (B+ - Va) / Rp
     * Q-point typically at center of loadline for maximum symmetrical swing
     */
    private calculateResistorLoad() {
        // For plate resistor load: DC loadline is Ia = (B+ - Va) / Rp
        // Two endpoints: (Va=0, Ia=B+/Rp) and (Va=B+, Ia=0)
        const iaMaxResistor = (this.bPlus / this.rl) * 1000; // Convert to mA

        // For Class A operation with resistor load, Q-point typically at center of loadline
        // This gives maximum symmetrical swing
        // Vq = B+ / 2, Iq = B+ / (2 * Rp)
        // But user has specified Iq, so we calculate Vq from the loadline:
        // Vq = B+ - Iq * Rp
        this.quiescentPlateVoltage = this.bPlus - (this.quiescentCurrent * this.rl / 1000);

        // Sanity check: if Vq is negative or very small, Iq is too high for this Rp
        if (this.quiescentPlateVoltage < 20) {
            console.warn('Quiescent plate voltage is very low - consider reducing Iq or increasing Rp');
        }

        // Calculate quiescent plate dissipation
        this.quiescentPlateDissipation = (this.quiescentPlateVoltage * this.quiescentCurrent) / 1000; // W

        // Calculate percentage of maximum plate dissipation
        if (this.tube?.maximumPlateDissipation && this.tube.maximumPlateDissipation > 0) {
            this.plateDissipationPercentage = (this.quiescentPlateDissipation / this.tube.maximumPlateDissipation) * 100;
        }
        else {
            this.plateDissipationPercentage = 0;
        }

        // Find required grid bias to achieve Iq at calculated Vq
        this.requiredGridBias = this.findGridBiasForCurrent(this.quiescentPlateVoltage, this.quiescentCurrent);

        // DC and AC Load Line are THE SAME for resistor load
        // Ia = (B+ - Va) / Rp
        this.dcLoadLine = [
            { va: this.bPlus, ia: 0 },
            { va: 0, ia: iaMaxResistor }
        ];

        // AC load line is the same as DC load line (resistive load at all frequencies)
        this.acLoadLine = [
            { va: this.bPlus, ia: 0 },
            { va: 0, ia: iaMaxResistor }
        ];

        // Calculate maximum output power for resistor load
        // For Class A with resistor load: Po,max ≈ (Vq * Iq) / 2
        // (Assumes voltage swing from ~0V to ~2*Vq, current swing symmetrical around Iq)
        this.maxOutputPower = (this.quiescentPlateVoltage * this.quiescentCurrent) / 2000; // in Watts
    }    /**
     * Find grid bias voltage required to achieve target plate current at given plate voltage
     * Uses binary search to find Vg where Ia(Va, Vg) = targetIa
     */
    private findGridBiasForCurrent(va: number, targetIa: number): number {
        let vgLow = -50; // Start search at -50V
        let vgHigh = 0;   // Grid should not go positive
        const tolerance = 0.1; // 0.1 mA tolerance
        const maxIterations = 50;

        for (let i = 0; i < maxIterations; i++) {
            const vgMid = (vgLow + vgHigh) / 2;
            const ia = this.calculatePlateCurrent(va, vgMid);

            if (Math.abs(ia - targetIa) < tolerance) {
                return vgMid;
            }

            if (ia < targetIa) {
                // Current too low, need more positive grid voltage
                vgLow = vgMid;
            }
            else {
                // Current too high, need more negative grid voltage
                vgHigh = vgMid;
            }
        }

        // Return best guess if convergence not achieved
        return (vgLow + vgHigh) / 2;
    }

    /**
     * Handle parameter changes
     */
    onParameterChange() {
        this.calculateRecommendedIq();
        this.calculateOperatingPoint();
        this.updateChart();
    }

    /**
     * Handle model selection change
     */
    onModelChange() {
        console.log('Selected model:', this.selectedModel);
        this.updateChart();
    }

    /**
     * Toggle calculations display
     */
    toggleCalculations() {
        this.showCalculations = !this.showCalculations;
    }

    /**
     * Check if plate dissipation exceeds maximum
     */
    isPlateDissipationExceeded(): boolean {
        if (!this.tube?.maximumPlateDissipation) {
            return false;
        }
        return this.quiescentPlateDissipation > this.tube.maximumPlateDissipation;
    }

    /**
     * Get warning class for plate dissipation
     */
    getPlateDissipationClass(): string {
        if (this.isPlateDissipationExceeded()) {
            return 'text-danger fw-bold';
        }
        const maxDissipation = this.tube?.maximumPlateDissipation || 0;
        if (maxDissipation > 0 && this.quiescentPlateDissipation > maxDissipation * 0.8) {
            return 'text-warning fw-bold';
        }
        return '';
    }

    /**
     * Generate plate characteristic curves for the selected model
     */
    private generatePlateCharacteristics(): { datasets: ChartDataset[], maxVa: number, maxIa: number } {
        if (!this.tube || !this.selectedModel) {
            return { datasets: [], maxVa: 0, maxIa: 0 };
        }

        const datasets: ChartDataset[] = [];
        const maxVa = this.bPlus * 1.2; // 20% more than B+ voltage

        // Calculate maximum operating current at Vg=0 (grid at cathode potential)
        // This is the maximum current we can operate without grid going positive
        let calculatedMaxIa = 0;
        for (let va = 0; va <= maxVa; va += 5) {
            const ia = this.calculatePlateCurrent(va, 0);
            calculatedMaxIa = Math.max(calculatedMaxIa, ia);
        }

        // Determine the actual maximum current to display:
        // Use the minimum of calculated Ia at Vg=0 and tube's maximum plate current spec
        let maxIa = calculatedMaxIa;
        if (this.tube.maximumPlateCurrent && this.tube.maximumPlateCurrent > 0) {
            maxIa = Math.min(maxIa, this.tube.maximumPlateCurrent);
        }

        // Define grid voltage steps based on tube type
        const gridVoltages: number[] = [];
        const isTriode = this.selectedModel.includes('Triode');

        if (isTriode) {
            // Triode: typically -8V to 0V in 1V steps
            for (let vg = 0; vg >= -8; vg -= 1) {
                gridVoltages.push(vg);
            }
        }
        else {
            // Pentode: typically -10V to 0V in 2V steps
            for (let vg = 0; vg >= -10; vg -= 2) {
                gridVoltages.push(vg);
            }
        }

        // Generate curves for each grid voltage
        for (const vg of gridVoltages) {
            const curveData: { x: number, y: number }[] = [];

            for (let va = 0; va <= maxVa; va += 5) {
                const ia = this.calculatePlateCurrent(va, vg);
                curveData.push({ x: va, y: ia });
            }

            datasets.push({
                label: `Vg = ${vg}V`,
                data: curveData,
                borderColor: this.getGridVoltageColor(vg),
                borderWidth: 2,
                pointRadius: 0,
                fill: false,
                tension: 0.1
            });
        }

        return { datasets, maxVa, maxIa };
    }

    /**
     * Calculate plate current for given plate and grid voltages using selected model
     */
    private calculatePlateCurrent(va: number, vg: number): number {
        if (!this.tube || !this.selectedModel) {
            return 0;
        }

        try {
            if (this.selectedModel === 'Norman-Koren Triode Model' && this.tube.triodeModelParameters) {
                const params = this.tube.triodeModelParameters;
                const result = normanKorenTriodeModel(va, vg, params.kp || 0, params.mu || 0, params.kvb || 0, params.ex || 0, params.kg1 || 0);
                return result.ip;
            }
            else if (this.selectedModel === 'Norman-Koren Pentode Model' && this.tube.pentodeModelParameters) {
                const params = this.tube.pentodeModelParameters;
                const vs = 250; // Default screen voltage, could be made configurable
                const result = normanKorenNewPentodeModel(va, vg, vs, params.kp || 0, params.mu || 0, params.kvb || 0, params.ex || 0, params.kg1 || 0, params.kg2 || 0);
                return result.ip;
            }
            else if (this.selectedModel === 'Derk Pentode Model' && this.tube.derkModelParameters) {
                const params = this.tube.derkModelParameters;
                const vs = 250; // Default screen voltage
                const result = derkModel(va, vg, vs, params.kp || 0, params.mu || 0, params.kvb || 0, params.ex || 0, params.kg1 || 0, params.kg2 || 0, params.a || 0, params.alphaS || 0, params.beta || 0, params.secondaryEmission || false, params.s || 0, params.alphaP || 0, params.lambda || 0, params.v || 0, params.w || 0);
                return result.ip;
            }
            else if (this.selectedModel === 'Derk-E Pentode Model' && this.tube.derkEModelParameters) {
                const params = this.tube.derkEModelParameters;
                const vs = 250; // Default screen voltage
                const result = derkEModel(va, vg, vs, params.kp || 0, params.mu || 0, params.kvb || 0, params.ex || 0, params.kg1 || 0, params.kg2 || 0, params.a || 0, params.alphaS || 0, params.beta || 0, params.secondaryEmission || false, params.s || 0, params.alphaP || 0, params.lambda || 0, params.v || 0, params.w || 0);
                return result.ip;
            }
        }
        catch (error) {
            console.error('Error calculating plate current:', error);
        }

        return 0;
    }

    /**
     * Get color for grid voltage curve
     */
    private getGridVoltageColor(vg: number): string {
        const colors = [
            '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF',
            '#FF9F40', '#FF6384', '#C9CBCF', '#4BC0C0', '#FF6384'
        ];
        const index = Math.abs(vg);
        return colors[index % colors.length];
    }

    /**
     * Generate maximum plate dissipation constraint curve (hyperbola: Pd = Va * Ia)
     */
    private generateMaxPlateDissipationCurve(maxVa: number): ChartDataset | null {
        if (!this.tube?.maximumPlateDissipation || this.tube.maximumPlateDissipation <= 0) {
            return null;
        }

        const curveData: { x: number, y: number }[] = [];
        const maxPd = this.tube.maximumPlateDissipation; // in Watts

        // Generate hyperbola: Ia = (Pd * 1000) / Va
        // Start from a small voltage to avoid division by zero
        for (let va = 10; va <= maxVa; va += 5) {
            const ia = (maxPd * 1000) / va; // Convert W to mW for current
            if (ia > 0 && ia < 1000) { // Reasonable current limits
                curveData.push({ x: va, y: ia });
            }
        }

        return {
            label: `Max Plate Dissipation (${maxPd}W)`,
            data: curveData,
            borderColor: '#DC3545', // Red for danger
            borderWidth: 3,
            borderDash: [5, 5],
            pointRadius: 0,
            fill: false,
            tension: 0.2
        };
    }

    /**
     * Generate maximum plate voltage constraint line (vertical)
     */
    private generateMaxPlateVoltageLine(maxIa: number): ChartDataset | null {
        if (!this.tube?.maximumPlateVoltage || this.tube.maximumPlateVoltage <= 0) {
            return null;
        }

        const maxVa = this.tube.maximumPlateVoltage;

        return {
            label: `Max Plate Voltage (${maxVa}V)`,
            data: [
                { x: maxVa, y: 0 },
                { x: maxVa, y: maxIa }
            ],
            borderColor: '#FFC107', // Amber for warning
            borderWidth: 3,
            borderDash: [10, 5],
            pointRadius: 0,
            fill: false,
            tension: 0
        };
    }

    /**
     * Generate maximum plate current constraint line (horizontal)
     */
    private generateMaxPlateCurrentLine(maxVa: number): ChartDataset | null {
        if (!this.tube?.maximumPlateCurrent || this.tube.maximumPlateCurrent <= 0) {
            return null;
        }

        const maxIa = this.tube.maximumPlateCurrent;

        return {
            label: `Max Plate Current (${maxIa}mA)`,
            data: [
                { x: 0, y: maxIa },
                { x: maxVa, y: maxIa }
            ],
            borderColor: '#FD7E14', // Orange for warning
            borderWidth: 3,
            borderDash: [10, 5],
            pointRadius: 0,
            fill: false,
            tension: 0
        };
    }

    /**
     * Create and render the chart
     */
    private createChart() {
        if (!this.viewInitialized || !this.chartCanvas) {
            return;
        }

        const ctx = this.chartCanvas.nativeElement.getContext('2d');
        if (!ctx) {
            return;
        }

        // Destroy existing chart
        if (this.chart) {
            this.chart.destroy();
        }

        const { datasets, maxVa, maxIa } = this.generatePlateCharacteristics();

        // Add constraint lines (maximum ratings)
        const maxPdCurve = this.generateMaxPlateDissipationCurve(maxVa);
        if (maxPdCurve) {
            datasets.push(maxPdCurve);
        }

        const maxVaLine = this.generateMaxPlateVoltageLine(maxIa * 1.1);
        if (maxVaLine) {
            datasets.push(maxVaLine);
        }

        const maxIaLine = this.generateMaxPlateCurrentLine(maxVa);
        if (maxIaLine) {
            datasets.push(maxIaLine);
        }

        // Add DC load line
        if (this.dcLoadLine.length > 0) {
            const dcLabel = this.loadType === 'transformer'
                ? 'DC Load Line (DCR)'
                : 'DC/AC Load Line (Rp)';

            datasets.push({
                label: dcLabel,
                data: this.dcLoadLine.map(p => ({ x: p.va, y: p.ia })),
                borderColor: '#6C757D',
                borderWidth: this.loadType === 'resistor' ? 3 : 2,
                borderDash: [5, 5],
                pointRadius: 0,
                fill: false,
                tension: 0
            });
        }

        // Add AC load line (only different from DC for transformer load)
        if (this.loadType === 'transformer' && this.acLoadLine.length > 0) {
            datasets.push({
                label: 'AC Load Line (RLp)',
                data: this.acLoadLine.map(p => ({ x: p.va, y: p.ia })),
                borderColor: '#FF0000',
                borderWidth: 3,
                borderDash: [10, 5],
                pointRadius: 0,
                fill: false,
                tension: 0
            });
        }

        // Add Q-point
        if (this.dcLoadLine.length > 0) {
            datasets.push({
                label: 'Q-Point',
                data: [{ x: this.quiescentPlateVoltage, y: this.quiescentCurrent }],
                borderColor: '#00FF00',
                backgroundColor: '#00FF00',
                borderWidth: 0,
                pointRadius: 8,
                pointStyle: 'circle',
                fill: false,
                tension: 0,
                showLine: false
            });
        }

        const config: ChartConfiguration = {
            type: 'line',
            data: { datasets },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: {
                        type: 'linear',
                        position: 'bottom',
                        title: {
                            display: true,
                            text: 'Plate Voltage (V)',
                            font: { size: 14, weight: 'bold' }
                        },
                        min: 0,
                        max: maxVa,
                        grid: { color: 'rgba(0, 0, 0, 0.1)' }
                    },
                    y: {
                        type: 'linear',
                        title: {
                            display: true,
                            text: 'Plate Current (mA)',
                            font: { size: 14, weight: 'bold' }
                        },
                        min: 0,
                        max: maxIa * 1.1, // 10% margin above the operating zone
                        grid: { color: 'rgba(0, 0, 0, 0.1)' }
                    }
                },
                plugins: {
                    legend: {
                        display: true,
                        position: 'right',
                        labels: { boxWidth: 20, padding: 10, font: { size: 10 } }
                    },
                    title: {
                        display: true,
                        text: 'Plate Characteristics',
                        font: { size: 16, weight: 'bold' }
                    },
                    tooltip: {
                        mode: 'nearest',
                        intersect: false,
                        callbacks: {
                            label: (context) => {
                                const label = context.dataset.label || '';
                                const x = context.parsed.x?.toFixed(1) ?? '0';
                                const y = context.parsed.y?.toFixed(2) ?? '0';
                                return `${label}: Va=${x}V, Ia=${y}mA`;
                            }
                        }
                    }
                },
                interaction: {
                    mode: 'nearest',
                    axis: 'x',
                    intersect: false
                }
            }
        };

        this.chart = new Chart(ctx, config);
    }

    /**
     * Update the chart with new data
     */
    private updateChart() {
        if (this.viewInitialized) {
            this.createChart();
        }
    }
}
