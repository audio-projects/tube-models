import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { ToastService } from '../services/toast.service';
import { TubeDataService } from '../services/tube-data.service';
import { TubeInformation } from './tube-information';

@Component({
    selector: 'app-tubes',
    templateUrl: './tubes.component.html',
    styleUrl: './tubes.component.scss',
    imports: [RouterLink, FormsModule, CommonModule],
})
export class TubesComponent implements OnInit, OnDestroy {
    tubes: TubeInformation[] = [];

    // Filter properties
    searchTerm = '';
    selectedType = '';
    selectedManufacturer = '';
    filteredTubes: TubeInformation[] = [];

    private tubesSubscription?: Subscription;

    constructor(private tubeDataService: TubeDataService, private toastService: ToastService) {}

    ngOnInit() {
        // Subscribe to tubes data changes
        this.tubesSubscription = this.tubeDataService.tubes$.subscribe(tubes => {
            this.tubes = tubes;
            this.filterTubes();
        });
    }

    ngOnDestroy() {
        if (this.tubesSubscription) {
            this.tubesSubscription.unsubscribe();
        }
    }

    refreshTubes() {
        console.log('Refreshing tubes...');
        this.tubeDataService.refreshTubes().subscribe({
            next: (tubes) => {
                console.log('Tubes refreshed successfully', tubes.length);
            },
            error: (error) => {
                console.error('Error refreshing tubes:', error);
                this.toastService.error('Error refreshing tubes. Please try again.');
            }
        });
    }

    getCountByType(type: string): number {
        return this.tubes.filter(tube => tube.type === type).length;
    }

    getUniqueManufacturers(): string[] {
        const manufacturers = this.tubes.map(tube => tube.manufacturer);
        return [...new Set(manufacturers)].sort();
    }

    filterTubes() {
        this.filteredTubes = this.tubes.filter(tube => {
            const matchesSearch = !this.searchTerm ||
                tube.name.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
                tube.manufacturer.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
                tube.comments.toLowerCase().includes(this.searchTerm.toLowerCase());

            const matchesType = !this.selectedType || tube.type === this.selectedType;
            const matchesManufacturer = !this.selectedManufacturer || tube.manufacturer === this.selectedManufacturer;

            return matchesSearch && matchesType && matchesManufacturer;
        });
    }

    clearFilters() {
        this.searchTerm = '';
        this.selectedType = '';
        this.selectedManufacturer = '';
        this.filteredTubes = [...this.tubes];
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
            month: 'short',
            day: 'numeric'
        });
    }

    confirmDelete(tube: TubeInformation) {
        this.toastService.confirm(
            `Are you sure you want to delete "${tube.name}"? This action cannot be undone.`,
            () => {
                this.deleteTube(tube);
            },
            undefined,
            'Delete Tube'
        );
    }

    private deleteTube(tube: TubeInformation) {
        this.tubeDataService.deleteTube(tube.id).subscribe({
            next: (success) => {
                if (success) {
                    console.log(`Deleted tube: ${tube.name}`);
                }
            },
            error: (error) => {
                console.error('Error deleting tube:', error);
                this.toastService.error('Error deleting tube. Please try again.');
            }
        });
    }
}
