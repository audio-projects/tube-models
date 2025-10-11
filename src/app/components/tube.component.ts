import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import {
    AfterViewInit,
    Component,
    ElementRef,
    NgZone,
    OnInit,
    ViewChild
} from '@angular/core';
import { AuthService } from '../services/auth.service';
import { CommonModule } from '@angular/common';
import { File as TubeFile, Series } from '../files';
import { fileParserService } from '../services/file-parser-service';
import { FirebaseTubeService } from '../services/firebase-tube.service';
import { FormsModule } from '@angular/forms';
import { NormanKorenPentodeModelParametersComponent } from './norman-koren-pentode-model-parameters.component';
import { ToastService } from '../services/toast.service';
import { NormanKorenTriodeModelParametersComponent } from './norman-koren-triode-model-parameters.component';
import { DerkPentodeModelParametersComponent } from './derk-pentode-model-parameters.component';
import { TubeInformation } from './tube-information';
import { TubePlotComponent } from './tube-plot.component';

@Component({
    selector: 'app-tube',
    templateUrl: './tube.component.html',
    styleUrl: './tube.component.scss',
    imports: [FormsModule, CommonModule, RouterLink, TubePlotComponent, NormanKorenPentodeModelParametersComponent, NormanKorenTriodeModelParametersComponent, DerkPentodeModelParametersComponent],
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
    isCalculatingDerkParameters = false; // Track Derk model calculation state

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
                        this.router.navigate(['/tube']);
                    }
                },
                error: (error: unknown) => {
                    console.error('Error loading tube:', error);
                    this.toastService.error('Error loading tube');
                    this.router.navigate(['/tube']);
                }
            });
        }
        else {
            console.error('No tube ID provided');
            this.router.navigate(['/tube']);
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
                            this.router.navigate(['/tube']);
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
        this.toastService.info(`File: ${file.name}\nType: ${file.measurementTypeLabel}\nSeries: ${file.series.length}\nTotal Points: ${this.getTotalPointsCount(file)}${egOffsetText}`, 'File Information');
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

    // Calculate SPICE model parameters for pentodes
    calculatePentodeModelParameters() {
        // check files are available
        if (!this.tube || this.tube.type !== 'Pentode' || !this.tube.files || this.tube.files.length === 0)
            return;

        this.isCalculatingSpiceParameters = true;

        try {
            // Create a web worker for pentode calculation
            const worker = new Worker(new URL('../workers/optimize-norman-koren-new-pentode-model-parameters.worker.ts', import.meta.url), { type: 'module' });

            worker.postMessage({
                files: this.tube.files,
                maximumPlateDissipation: this.tube.maximumPlateDissipation || 1000, // Default to 1000W if not specified
                algorithm: 1,  // 0 = Levenberg-Marquardt, 1 = Powell
                trace: undefined
            });

            worker.onmessage = (e) => {
                // data
                const result = e.data;
                // Handle different message types from worker
                if (result.type === 'succeeded') {
                    // Extract parameters from the worker result
                    const params = result.parameters;
                    if (params) {
                        this.tube!.pentodeModelParameters = {
                            mu: params.mu || 0,
                            ex: params.ex || 0,
                            kg1: params.kg1 || 0,
                            kg2: params.kg2 || 0,
                            kp: params.kp || 0,
                            kvb: params.kvb || 0,
                            calculatedOn: new Date().toISOString(),
                            rmse: params.rmse || Number.MAX_VALUE,
                        };
                        // update flag
                        this.isCalculatingSpiceParameters = false;
                        // notify user
                        this.toastService.success('SPICE model parameters calculated successfully!', 'Calculation Complete');
                    }
                    else {
                        // update flag
                        this.isCalculatingSpiceParameters = false;
                        // notify user
                        this.toastService.error('Failed to calculate SPICE model parameters. Invalid result.', 'Calculation Failed');
                    }
                    // end worker
                    worker.terminate();
                }
                else if (result.type === 'failed') {
                    // update flag
                    this.isCalculatingSpiceParameters = false;
                    // notify user
                    this.toastService.error('Failed to calculate SPICE model parameters. Please check your measurement data.', 'Calculation Failed');
                    // end worker
                    worker.terminate();
                }
                else if (result.type === 'notification' || result.type === 'log') {
                    // log message
                    console.log(`${result.type}: ${result.text}`);
                }
            };

            worker.onerror = (error) => {
                // log error
                console.error('Worker error:', error);
                // update flag
                this.isCalculatingSpiceParameters = false;
                // notify user
                this.toastService.error('An error occurred while calculating SPICE model parameters.', 'Calculation Error');
                // end worker
                worker.terminate();
            };

        }
        catch (error) {
            // log error
            console.error('Error creating worker:', error);
            // notify user
            this.toastService.error('Failed to initialize calculation worker.', 'Worker Error');
            // update flag
            this.isCalculatingSpiceParameters = false;
        }
    }

    calculateTriodeModelParameters() {
        // check files are available
        if (!this.tube || !this.tube.files || this.tube.files.length === 0)
            return;

        this.isCalculatingSpiceParameters = true;

        try {
            // Create a web worker for calculation
            const worker = new Worker(new URL('../workers/optimize-norman-koren-triode-model-parameters.worker.ts', import.meta.url), { type: 'module' });

            worker.postMessage({
                files: this.tube.files,
                maximumPlateDissipation: this.tube.maximumPlateDissipation || 1000, // Default to 1000W if not specified
                algorithm: 1,  // 0 = Levenberg-Marquardt, 1 = Powell
                trace: undefined
            });

            worker.onmessage = (e) => {
                // data
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
                            calculatedOn: new Date().toISOString(),
                            rmse: params.rmse || Number.MAX_VALUE,
                        };
                        // update flag
                        this.isCalculatingSpiceParameters = false;
                        // notify user
                        this.toastService.success('SPICE model parameters calculated successfully!', 'Calculation Complete');
                    }
                    else {
                        // update flag
                        this.isCalculatingSpiceParameters = false;
                        // notify user
                        this.toastService.error('Failed to calculate SPICE model parameters. Invalid result.', 'Calculation Failed');
                    }
                    // end worker
                    worker.terminate();
                }
                else if (result.type === 'failed') {
                    // update flag
                    this.isCalculatingSpiceParameters = false;
                    // notify user
                    this.toastService.error('Failed to calculate SPICE model parameters. Please check your measurement data.', 'Calculation Failed');
                    // end worker
                    worker.terminate();
                }
                else if (result.type === 'notification' || result.type === 'log') {
                    // log message
                    console.log(`${result.type}: ${result.text}`);
                }
            };

            worker.onerror = (error) => {
                // log error
                console.error('Worker error:', error);
                // update flag
                this.isCalculatingSpiceParameters = false;
                // notify user
                this.toastService.error('An error occurred while calculating SPICE model parameters.', 'Calculation Error');
                // end worker
                worker.terminate();
            };
        }
        catch (error) {
            // log error
            console.error('Error creating worker:', error);
            // notify user
            this.toastService.error('Failed to initialize calculation worker.', 'Worker Error');
            // update flag
            this.isCalculatingSpiceParameters = false;
        }
    }

    calculateDerkModelParameters() {
        // check files are available
        if (!this.tube || this.tube.type !== 'Pentode' || !this.tube.files || this.tube.files.length === 0)
            return;

        this.isCalculatingDerkParameters = true;

        try {
            // Create a web worker for Derk model calculation
            const worker = new Worker(new URL('../workers/optimize-derk-model-parameters.worker.ts', import.meta.url), { type: 'module' });

            worker.postMessage({
                files: this.tube.files,
                maximumPlateDissipation: this.tube.maximumPlateDissipation || 1000, // Default to 1000W if not specified
                secondaryEmission: this.tube.derkModelParameters?.secondaryEmission || false, // Use the actual checkbox value
                algorithm: 1,  // 0 = Levenberg-Marquardt, 1 = Powell
                trace: undefined
            });

            worker.onmessage = (e) => {
                // data
                const result = e.data;
                // Handle different message types from worker
                if (result.type === 'succeeded') {
                    // Extract parameters from the worker result
                    const params = result.parameters;
                    if (params) {
                        // update model
                        this.tube!.derkModelParameters = {
                            mu: params.mu || 0,
                            ex: params.ex || 0,
                            kg1: params.kg1 || 0,
                            kg2: params.kg2 || 0,
                            kp: params.kp || 0,
                            kvb: params.kvb || 0,
                            a: params.a || 0,
                            alphaS: params.alphaS || 0,
                            beta: params.beta || 0,
                            secondaryEmission: params.secondaryEmission || false,
                            s: params.s || 0,
                            alphaP: params.alphaP || 0,
                            lambda: params.lambda || 0,
                            v: params.v || 0,
                            w: params.w || 0,
                            calculatedOn: new Date().toISOString(),
                            rmse: params.rmse || Number.MAX_VALUE,
                        };
                        // notify user
                        this.toastService.success('Derk model parameters calculated successfully!', 'Calculation Complete');
                    }
                    else {
                        // notify user
                        this.toastService.error('Failed to calculate Derk model parameters. Invalid result.', 'Calculation Failed');
                    }
                    // update flag
                    this.isCalculatingDerkParameters = false;
                    // end worker
                    worker.terminate();
                }
                else if (result.type === 'failed') {
                    // update flag
                    this.isCalculatingDerkParameters = false;
                    // notify user
                    this.toastService.error('Failed to calculate Derk model parameters. Please check your measurement data.', 'Calculation Failed');
                    // end worker
                    worker.terminate();
                }
                else if (result.type === 'notification' || result.type === 'log') {
                    // log message
                    console.log(`${result.type}: ${result.text}`);
                }
            };

            worker.onerror = (error) => {
                // log error
                console.error('Derk model worker error:', error);
                // update flag
                this.isCalculatingDerkParameters = false;
                // notify user
                this.toastService.error('An error occurred while calculating Derk model parameters.', 'Calculation Error');
                // end worker
                worker.terminate();
            };

        }
        catch (error) {
            // log error
            console.error('Error creating Derk model worker:', error);
            // notify user
            this.toastService.error('Failed to initialize Derk model calculation worker.', 'Worker Error');
            // update flag
            this.isCalculatingDerkParameters = false;
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
