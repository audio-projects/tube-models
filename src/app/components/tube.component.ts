import { Component, OnInit, ViewChild, ElementRef, AfterViewInit, NgZone } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { TubeInformation } from './tube-information';
import { File as TubeFile, Series, measurementTypeDescription } from '../files';
import { fileParserService } from '../services/file-parser-service';
import { TubePlotComponent } from './tube-plot.component';
import { FirebaseTubeService } from '../services/firebase-tube.service';
import { AuthService } from '../services/auth.service';
import { PentodeModelParametersComponent } from './pentode-model-parameters.component';
import { TetrodeSpiceParametersComponent } from './tetrode-spice-parameters.component';
import { TriodeModelParametersComponent } from './triode-model-parameters.component';
import { ToastService } from '../services/toast.service';

@Component({
    selector: 'app-tube',
    templateUrl: './tube.component.html',
    styleUrl: './tube.component.scss',
    imports: [FormsModule, CommonModule, RouterLink, TubePlotComponent, PentodeModelParametersComponent, TetrodeSpiceParametersComponent, TriodeModelParametersComponent],
})
export class TubeComponent implements OnInit, AfterViewInit {
    @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

    tubeId: string | null = null;
    tube: TubeInformation | null = null;
    isNewTube = false;
    uploadProgress = 0;
    activeTab = 'upload'; // For tab management
    selectedFileForPlot: TubeFile | null = null; // Track file selected for plotting
    isCalculatingSpiceParameters = false; // Track calculation state

    constructor(
        private route: ActivatedRoute,
        private router: Router,
        private firebaseTubeService: FirebaseTubeService,
        public authService: AuthService,
        private ngZone: NgZone,
        private toastService: ToastService
    ) {}

    ngOnInit() {
        this.tubeId = this.route.snapshot.paramMap.get('id');
        this.isNewTube = this.tubeId === 'new';

        if (this.isNewTube) {
            this.tube = this.createNewTube();
        }
        else {
            this.loadTube(this.tubeId);
        }
    }

    ngAfterViewInit() {
        if (this.fileInput) {
            this.fileInput.nativeElement.addEventListener('change', this.onFileSelected.bind(this));
        }
    }

    private createNewTube(): TubeInformation {
        return {
            id: '',
            name: '',
            manufacturer: '',
            comments: '',
            lastUpdatedOn: new Date().toISOString().split('T')[0],
            type: 'Triode',
            maximumPlateDissipation: 0,
            maximumPlateVoltage: 0,
            maximumPlateCurrent: 0,
            maximumGrid1Voltage: 0,
            files: [],
            owner: this.authService.getCurrentUser()?.uid // Set owner for new tubes
        };
    }

    private loadTube(tubeId: string | null) {
        if (tubeId) {
            console.log('Loading tube with ID:', tubeId);
            this.firebaseTubeService.getTubeById(tubeId).subscribe({
                next: (tube: TubeInformation | null) => {
                    if (tube) {
                        this.tube = tube;
                        console.log('Tube loaded:', tube);
                    }
                    else {
                        console.error('Tube not found');
                        this.toastService.error('Tube not found');
                        this.router.navigate(['/tubes']);
                    }
                },
                error: (error: unknown) => {
                    console.error('Error loading tube:', error);
                    this.toastService.error('Error loading tube');
                    this.router.navigate(['/tubes']);
                }
            });
        }
        else {
            console.error('No tube ID provided');
            this.router.navigate(['/tubes']);
        }
    }

    saveTube() {
        if (!this.tube) {
            return;
        }

        // Check if user is authenticated
        if (!this.authService.isAuthenticated()) {
            this.toastService.error('You must be signed in to save tubes.');
            return;
        }

        // Validate required fields
        if (!this.tube.name || this.tube.name.trim() === '') {
            this.toastService.error('Tube name is required.');
            return;
        }

        console.log('Saving tube:', this.tube);

        if (this.isNewTube) {
            // Create new tube - remove id field for new tubes
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { id, ...tubeData } = this.tube; // Remove ID for new tubes
            this.firebaseTubeService.saveTube(tubeData).subscribe({
                next: (savedTube: TubeInformation) => {
                    console.log('Tube saved successfully:', savedTube);
                    this.tube = savedTube;
                    this.isNewTube = false;
                    this.toastService.success(`Tube "${savedTube.name}" created successfully!`);
                    // Navigate to edit mode after saving new tube
                    this.router.navigate(['/tube', savedTube.id]);
                },
                error: (error: unknown) => {
                    console.error('Error saving tube:', error);
                    this.toastService.error('Error saving tube. Please try again.');
                }
            });
        }
        else {
            // Update existing tube
            this.firebaseTubeService.updateTube(this.tube).subscribe({
                next: (savedTube: TubeInformation) => {
                    console.log('Tube updated successfully:', savedTube);
                    this.tube = savedTube;
                    this.toastService.success(`Tube "${savedTube.name}" updated successfully!`);
                },
                error: (error: unknown) => {
                    console.error('Error updating tube:', error);
                    this.toastService.error('Error updating tube. Please try again.');
                }
            });
        }
    }

    deleteTube() {
        if (!this.tube || !this.tube.id) {
            return;
        }

        // Check if user is authenticated and is the owner
        if (!this.authService.isAuthenticated()) {
            this.toastService.error('You must be signed in to delete tubes.');
            return;
        }

        if (!this.firebaseTubeService.isOwner(this.tube)) {
            this.toastService.error('You can only delete tubes that you created.');
            return;
        }

        this.toastService.confirm(
            `Are you sure you want to delete "${this.tube.name}"? This action cannot be undone.`,
            () => {
                console.log('Deleting tube:', this.tube);

                this.firebaseTubeService.deleteTube(this.tube!).subscribe({
                    next: (success: boolean) => {
                        if (success) {
                            console.log(`Tube "${this.tube!.name}" deleted successfully`);
                            this.toastService.success(`Tube "${this.tube!.name}" deleted successfully!`);
                            this.router.navigate(['/tubes']);
                        }
                    },
                    error: (error: unknown) => {
                        console.error('Error deleting tube:', error);
                        this.toastService.error('Error deleting tube. Please try again.');
                    }
                });
            },
            undefined,
            'Delete Tube'
        );
    }

    resetForm() {
        if (this.isNewTube) {
            this.tube = this.createNewTube();
        }
        else {
            // Reload original tube data
            this.loadTube(this.tubeId);
        }
    }

    isFormValid(): boolean {
        return !!(this.tube?.name && this.tube?.type);
    }

    getTypeBadgeClass(type: string): string {
        switch (type) {
            case 'Triode':
                return 'bg-success';
            case 'Pentode':
                return 'bg-info';
            case 'Tetrode':
                return 'bg-warning text-dark';
            default:
                return 'bg-secondary';
        }
    }

    formatDate(dateString: string): string {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }

    /**
     * Check if current user can save this tube
     */
    canSave(): boolean {
        return this.authService.isAuthenticated();
    }

    /**
     * Check if current user can delete this tube
     */
    canDelete(): boolean {
        if (!this.authService.isAuthenticated() || !this.tube || this.isNewTube) {
            return false;
        }
        return this.firebaseTubeService.isOwner(this.tube);
    }

    duplicateTube() {
        if (!this.tube) {
            return;
        }

        // TODO: Implement duplicate functionality with Firebase
        this.toastService.info('Duplicate functionality will be implemented in future updates.');
    }

    exportTube() {
        if (this.tube) {
            const dataStr = JSON.stringify(this.tube, null, 2);
            const dataBlob = new Blob([dataStr], { type: 'application/json' });
            const url = URL.createObjectURL(dataBlob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${this.tube.name || 'tube'}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            this.toastService.success(`Tube "${this.tube.name}" exported successfully!`, 'Export Complete');
        }
    }

    onFileSelected(event: Event) {
        const target = event.target as HTMLInputElement;
        const files = target.files;

        if (files && files.length > 0) {
            this.uploadFiles(Array.from(files));
        }
    }

    triggerFileUpload() {
        if (this.fileInput) {
            this.fileInput.nativeElement.click();
        }
    }

    async uploadFiles(files: File[]) {
        if (!this.tube) {
            return;
        }

        this.uploadProgress = 10;
        const totalFiles = files.length;
        let processedFiles = 0;

        for (const file of files) {
            try {
                await this.processFile(file);
                processedFiles++;
                this.uploadProgress = 10 + (processedFiles / totalFiles) * 80;
            }
            catch (error) {
                console.error(`Error processing file ${file.name}:`, error);
                this.toastService.error(`Error processing file "${file.name}". Please check the file format.`);
            }
        }

        this.uploadProgress = 100;
        this.toastService.success(`Successfully processed ${processedFiles} of ${totalFiles} files.`);

        // Reset progress after a short delay
        setTimeout(() => {
            this.uploadProgress = 0;
            // Clear the file input
            if (this.fileInput) {
                this.fileInput.nativeElement.value = '';
            }
        }, 1000);
    }

    private async processFile(file: File): Promise<void> {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();

            reader.onload = (e) => {
                try {
                    const content = e.target?.result as string;
                    const parsedFile = fileParserService(file.name, content);

                    if (parsedFile && this.tube) {
                        this.tube.files.push(parsedFile);
                        resolve();
                    }
                    else {
                        reject(new Error('Unable to parse file'));
                    }
                }
                catch (error) {
                    reject(error);
                }
            };

            reader.onerror = () => reject(new Error('Failed to read file'));
            reader.readAsText(file);
        });
    }

    removeFile(index: number) {
        if (this.tube && index >= 0 && index < this.tube.files.length) {
            const fileName = this.tube.files[index].name;
            this.toastService.confirm(
                `Are you sure you want to remove "${fileName}"?`,
                () => {
                    this.tube!.files.splice(index, 1);
                    this.toastService.success(`File "${fileName}" removed successfully.`);
                },
                undefined,
                'Remove File'
            );
        }
    }

    viewFileData(file: TubeFile) {
        // Create a modal or popup to display file data
        const data = {
            name: file.name,
            measurementType: file.measurementType,
            seriesCount: file.series.length,
            totalPoints: this.getTotalPointsCount(file),
            series: file.series.map((series: Series) => ({
                pointCount: series.points.length,
                firstPoint: series.points[0],
                lastPoint: series.points[series.points.length - 1]
            }))
        };

        console.log('File data:', data);
        const egOffsetText = file.egOffset !== 0 ? `\nGrid Offset: ${file.egOffset}V` : '';
        this.toastService.info(`File: ${file.name}\nType: ${this.getMeasurementTypeDescription(file.measurementType)}\nSeries: ${file.series.length}\nTotal Points: ${this.getTotalPointsCount(file)}${egOffsetText}`, 'File Information');
    }

    getMeasurementTypeDescription(measurementType: string): string {
        return measurementTypeDescription(measurementType);
    }

    getTotalPointsCount(file: TubeFile): number {
        return file.series.reduce((total: number, series: Series) => total + series.points.length, 0);
    }

    // Plot file method
    plotFile(file: TubeFile) {
        if (file.measurementType === 'UNKNOWN') {
            this.toastService.warning('Cannot plot file: measurement type could not be determined. Please check the file format.', 'Unknown File Type');
            return;
        }

        this.selectedFileForPlot = file;
        this.setActiveTab('plot');
    }

    // File selection for plotting
    selectFileForPlot(file: TubeFile) {
        if (file.measurementType === 'UNKNOWN') {
            this.toastService.warning('Cannot plot file: measurement type could not be determined. Please check the file format.', 'Unknown File Type');
            return;
        }
        this.selectedFileForPlot = file;
    }

    clearSelectedFile() {
        this.selectedFileForPlot = null;
    }

    // Calculate SPICE model parameters for triodes (and pentodes connected as triodes)
    calculateSpiceModelParameters() {
        if (!this.tube || (this.tube.type !== 'Triode' && this.tube.type !== 'Pentode') || !this.tube.files || this.tube.files.length === 0) {
            return;
        }

        // Check if we have any measurement files
        if (this.tube.files.length === 0) {
            this.toastService.warning('No measurement files found for SPICE model parameter calculation.', 'Missing Data');
            return;
        }

        // Validate that we have usable measurement data
        let totalDataPoints = 0;
        let validDataPoints = 0;
        const maxPowerDissipation = this.tube.maximumPlateDissipation || 1000; // Default to 1000W if not specified

        for (const file of this.tube.files) {
            // Check if the measurement type is compatible
            if (file.measurementType === 'IP_EG_EP_VH' ||
                file.measurementType === 'IP_EG_EPES_VH' ||
                file.measurementType === 'IP_EP_EG_VH' ||
                file.measurementType === 'IP_EPES_EG_VH') {

                for (const series of file.series) {
                    for (const point of series.points) {
                        totalDataPoints++;
                        // Check if point meets criteria: positive current and within power limits
                        if ((point.ip + (point.is ?? 0)) > 0 &&
                            point.ep * (point.ip + (point.is ?? 0)) * 1e-3 <= maxPowerDissipation) {
                            validDataPoints++;
                        }
                    }
                }
            }
        }

        console.log(`Data validation: ${validDataPoints} valid points out of ${totalDataPoints} total points`);

        if (validDataPoints === 0) {
            this.toastService.warning(
                `No valid measurement data found. Checked ${totalDataPoints} data points but none meet the criteria (positive current, within power limits).`,
                'Invalid Data'
            );
            return;
        }

        if (validDataPoints < 5) {
            this.toastService.warning(
                `Insufficient data for reliable calculation. Found only ${validDataPoints} valid points. At least 5 points recommended.`,
                'Insufficient Data'
            );
            // Continue anyway but warn the user
        }

        this.isCalculatingSpiceParameters = true;

        try {
            // Create a web worker for calculation
            console.log('Creating worker...');
            const worker = new Worker(new URL('../workers/optimize-norman-koren-triode-model-parameters.worker.ts', import.meta.url), { type: 'module' });
            console.log('Worker created successfully:', worker);

            worker.postMessage({
                files: this.tube.files,
                maximumPlateDissipation: this.tube.maximumPlateDissipation || 1000, // Default to 1000W if not specified
                algorithm: 1,  // 0 = Levenberg-Marquardt, 1 = Powell
                trace: undefined
            });
            console.log('Message posted to worker');

            worker.onmessage = (e) => {
                console.log('Worker message received:', e.data);
                const result = e.data;

                // Handle different message types from worker
                if (result.type === 'succeeded') {
                    // Extract parameters from the worker result
                    const params = result.parameters;
                    if (params) {
                        this.tube!.triodeModelParameters = {
                            mu: params.mu || 0,
                            ex: params.ex || 0,
                            kg1: params.kg1 || 0,
                            kp: params.kp || 0,
                            kvb: params.kvb || 0,
                            calculatedOn: new Date().toISOString()
                        };
                        console.log('Triode model parameters calculated:', this.tube!.triodeModelParameters);
                        this.isCalculatingSpiceParameters = false;
                        this.toastService.success('SPICE model parameters calculated successfully!', 'Calculation Complete');
                    }
                    else {
                        console.error('Parameters object is undefined');
                        this.toastService.error('Failed to calculate SPICE model parameters. Invalid result.', 'Calculation Failed');
                        this.isCalculatingSpiceParameters = false;
                    }
                    worker.terminate();
                }
                else if (result.type === 'failed') {
                    console.error('Worker calculation failed:', result);
                    this.toastService.error('Failed to calculate SPICE model parameters. Please check your measurement data.', 'Calculation Failed');
                    this.isCalculatingSpiceParameters = false;
                    worker.terminate();
                }
                else if (result.type === 'notification' || result.type === 'log') {
                    // Handle progress notifications and logs
                    console.log('Worker progress:', result.text);
                    // Don't terminate worker for progress messages
                }
                // Ignore other message types (like notifications, logs)
            };

            worker.onerror = (error) => {
                console.error('Worker error:', error);
                this.toastService.error('An error occurred while calculating SPICE model parameters.', 'Calculation Error');
                this.isCalculatingSpiceParameters = false;
                worker.terminate();
            };

        }
        catch (error) {
            console.error('Error creating worker:', error);
            this.toastService.error('Failed to initialize calculation worker.', 'Worker Error');
            this.isCalculatingSpiceParameters = false;
        }
    }

    // Tab management methods
    setActiveTab(tab: string) {
        this.activeTab = tab;
    }

    isTabActive(tab: string): boolean {
        return this.activeTab === tab;
    }
}
