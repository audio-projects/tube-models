import { Component, OnInit, ViewChild, ElementRef, AfterViewInit, NgZone } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { TubeInformation } from './tube-information';
import { File as TubeFile, Series, measurementTypeDescription } from '../files';
import { fileParserService } from '../services/file-parser-service';
import { TubePlotComponent } from './tube-plot.component';
import { TubeDataService } from '../services/tube-data.service';
import { PentodeSpiceParametersComponent } from './pentode-spice-parameters.component';
import { TetrodeSpiceParametersComponent } from './tetrode-spice-parameters.component';
import { ToastService } from '../services/toast.service';

@Component({
    selector: 'app-tube',
    templateUrl: './tube.component.html',
    styleUrl: './tube.component.scss',
    imports: [FormsModule, CommonModule, RouterLink, TubePlotComponent, PentodeSpiceParametersComponent, TetrodeSpiceParametersComponent],
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
        private tubeDataService: TubeDataService,
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
        // Set up file input change listener to avoid Angular Language Service issues
        if (this.fileInput) {
            this.fileInput.nativeElement.addEventListener('change', (event) => {
                this.ngZone.run(() => {
                    this.onFilesSelected(event);
                });
            });
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
            files: []
        };
    }

    private loadTube(id: string | null) {
        if (id) {
            const loadedTube = this.tubeDataService.getTubeById(id);
            if (loadedTube) {
                this.tube = { ...loadedTube };

                // Add test triode parameters for debugging if needed
                if (!this.tube.triodeModelParameters?.calculated) {
                    this.tube.triodeModelParameters = {
                        mu: 100,
                        ex: 1.4,
                        kg1: 1060,
                        kp: 600,
                        kvb: 300,
                        calculated: true,
                        lastCalculated: new Date().toISOString()
                    };
                    console.log('Added test triode parameters for debugging');
                }
            }
            else {
                console.error(`Tube with ID ${id} not found`);
                this.toastService.error(`Tube with ID ${id} not found. Redirecting to tubes list.`, 'Tube Not Found');
                this.router.navigate(['/tubes']);
            }
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

        console.log('Saving tube:', this.tube);

        this.tubeDataService.saveTube(this.tube).subscribe({
            next: (savedTube) => {
                console.log('Tube saved successfully:', savedTube);
                this.tube = savedTube;

                if (this.isNewTube) {
                    // Navigate to edit mode after saving new tube
                    this.router.navigate(['/tube', savedTube.id]);
                }
                else {
                    this.toastService.success(`Tube "${savedTube.name}" updated successfully!`);
                }
            },
            error: (error) => {
                console.error('Error saving tube:', error);
                this.toastService.error('Error saving tube. Please try again.');
            }
        });
    }

    deleteTube() {
        if (!this.tube || !this.tube.id) {
            return;
        }

        this.toastService.confirm(
            `Are you sure you want to delete "${this.tube.name}"? This action cannot be undone.`,
            () => {
                console.log('Deleting tube:', this.tube);

                this.tubeDataService.deleteTube(this.tube!.id).subscribe({
                    next: (success) => {
                        if (success) {
                            console.log(`Tube "${this.tube!.name}" deleted successfully`);
                            this.toastService.success(`Tube "${this.tube!.name}" deleted successfully!`);
                            this.router.navigate(['/tubes']);
                        }
                    },
                    error: (error) => {
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

    duplicateTube() {
        if (!this.tube) {
            return;
        }

        console.log('Duplicating tube:', this.tube);

        this.tubeDataService.duplicateTube(this.tube).subscribe({
            next: (duplicatedTube) => {
                console.log('Tube duplicated successfully:', duplicatedTube);
                // Navigate to the new duplicated tube
                this.router.navigate(['/tube', duplicatedTube.id]);
            },
            error: (error) => {
                console.error('Error duplicating tube:', error);
                this.toastService.error('Error duplicating tube. Please try again.');
            }
        });
    }

    exportTube() {
        if (this.tube) {
            const dataStr = JSON.stringify(this.tube, null, 2);
            const dataBlob = new Blob([dataStr], { type: 'application/json' });
            const url = URL.createObjectURL(dataBlob);

            const link = document.createElement('a');
            link.href = url;
            link.download = `${this.tube.name || 'tube'}_data.json`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);

            console.log('Exporting tube data');
        }
    }

    // File upload methods
    triggerFileUpload(): void {
        if (this.fileInput) {
            // Reset the input value to allow selecting the same files again
            this.fileInput.nativeElement.value = '';
            this.fileInput.nativeElement.click();
        }
    }

    onFilesSelected(event: Event): void {
        const input = event.target as HTMLInputElement;

        if (input && input.files && input.files.length > 0) {
            this.uploadFiles(input.files);
        }
    }

    async uploadFiles(files: FileList) {
        if (!this.tube) return;

        const fileArray = Array.from(files);
        const validFiles = fileArray.filter(file => file.name.toLowerCase().endsWith('.utd'));

        if (validFiles.length === 0) {
            this.toastService.warning('Please select valid UTD files.', 'Invalid File Type');
            return;
        }

        if (validFiles.length !== fileArray.length) {
            this.toastService.warning(`Only ${validFiles.length} of ${fileArray.length} files are valid UTD files. Only valid files will be processed.`, 'Mixed File Types');
        }

        this.uploadProgress = 0;
        const totalFiles = validFiles.length;

        for (let i = 0; i < validFiles.length; i++) {
            const file = validFiles[i];
            try {
                await this.processFile(file);
                this.uploadProgress = Math.round(((i + 1) / totalFiles) * 100);
            }
            catch (error) {
                console.error(`Error processing file ${file.name}:`, error);
                this.toastService.error(`Error processing file ${file.name}. Please check the file format.`, 'File Processing Error');
            }
        }

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
                        // Check if file with same name already exists
                        const existingIndex = this.tube.files.findIndex(f => f.name === parsedFile.name);
                        if (existingIndex >= 0) {
                            // Replace existing file
                            this.tube.files[existingIndex] = parsedFile;
                        }
                        else {
                            // Add new file
                            this.tube.files.push(parsedFile);
                        }
                    }

                    resolve();
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
        this.toastService.info(`File: ${file.name}\nType: ${this.getMeasurementTypeDescription(file.measurementType)}\nSeries: ${file.series.length}\nTotal Points: ${this.getTotalPointsCount(file)}`, 'File Information');
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

        // Set loading state
        this.isCalculatingSpiceParameters = true;

        // Create worker to calculate parameters
        const worker = new Worker(new URL('../workers/optimize-norman-koren-triode-model-parameters.worker', import.meta.url));

        // Handle worker messages
        worker.onmessage = ({ data }) => {
            if (data.type === 'succeeded' && data.parameters) {
                // Store the calculated parameters
                this.tube!.triodeModelParameters = {
                    mu: data.parameters.mu,
                    ex: data.parameters.ex,
                    kg1: data.parameters.kg1,
                    kp: data.parameters.kp,
                    kvb: data.parameters.kvb,
                    calculated: true,
                    lastCalculated: new Date().toISOString()
                };
                console.log('SPICE model parameters calculated:', this.tube!.triodeModelParameters);
                this.isCalculatingSpiceParameters = false;
            }
            else if (data.type === 'failed') {
                console.error('Failed to calculate SPICE model parameters');
                this.toastService.error('Failed to calculate SPICE model parameters. Please check the measurement data.', 'Calculation Failed');
                this.isCalculatingSpiceParameters = false;
            }
            else if (data.type === 'log') {
                console.log('Worker log:', data.text);
            }
        };

        worker.onerror = (error) => {
            console.error('Worker error:', error);
            this.toastService.error('An error occurred while calculating SPICE model parameters.', 'Calculation Error');
            this.isCalculatingSpiceParameters = false;
        };

        worker.postMessage({
            initial: {},
            files: this.tube.files,
            maximumPlateDissipation: this.tube.maximumPlateDissipation || 10, // Default 10W if not specified
            egOffset: this.tube.egOffset || 0,
            algorithm: 1, // Use Powell algorithm (0 = Levenberg-Marquardt, 1 = Powell)
            trace: { enabled: false }
        });
    }

    // Generate SPICE model text for copying
    generateSpiceModelText(): string {
        if (!this.tube?.triodeModelParameters?.calculated) {
            return '';
        }

        const params = this.tube.triodeModelParameters;
        const tubeName = this.tube.name || 'TRIODE';

        return `* ${tubeName} Triode Model - Norman Koren Parameters
* Generated on ${new Date().toLocaleString()}
.SUBCKT ${tubeName} A G C
* Anode Grid Cathode
E1 7 0 VALUE={V(A,C)/KP*LOG(1+EXP(KP*(1/MU+V(G,C)/SQRT(KVB+V(A,C)*V(A,C)))))}
RE1 7 0 1G
G1 A C VALUE={0.5*(PWR(V(7),EX)+PWRS(V(7),EX))/KG1}
RCP A C 1G
.PARAM MU=${params.mu?.toFixed(6)} EX=${params.ex?.toFixed(6)} KG1=${params.kg1?.toFixed(6)} KP=${params.kp?.toFixed(6)} KVB=${params.kvb?.toFixed(6)}
.ENDS ${tubeName}`;
    }

    // Copy SPICE model to clipboard
    copySpiceModel() {
        const spiceText = this.generateSpiceModelText();
        if (spiceText) {
            navigator.clipboard.writeText(spiceText).then(() => {
                this.toastService.success('SPICE model copied to clipboard!', 'Copied');
            }).catch(() => {
                // Fallback for older browsers
                const textArea = document.createElement('textarea');
                textArea.value = spiceText;
                document.body.appendChild(textArea);
                textArea.select();
                document.execCommand('copy');
                document.body.removeChild(textArea);
                this.toastService.success('SPICE model copied to clipboard!', 'Copied');
            });
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
