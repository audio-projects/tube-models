import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { ToastService } from '../services/toast.service';
import { FirebaseTubeService } from '../services/firebase-tube.service';
import { AuthService } from '../services/auth.service';
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

    constructor(
        private firebaseTubeService: FirebaseTubeService,
        public authService: AuthService,
        private toastService: ToastService
    ) {}

    ngOnInit() {
        // Subscribe to tubes data changes from Firebase
        this.tubesSubscription = this.firebaseTubeService.getTubes().subscribe({
            next: (tubes: TubeInformation[]) => {
                this.tubes = tubes;
                this.filterTubes();
            },
            error: (error: unknown) => {
                console.error('Error loading tubes from Firebase:', error);
                this.toastService.error('Error loading tubes from database. Please check your connection.');
            }
        });
    }

    ngOnDestroy() {
        if (this.tubesSubscription) {
            this.tubesSubscription.unsubscribe();
        }
    }

    refreshTubes() {
        console.log('Refreshing tubes from Firebase...');
        // Re-subscribe to get fresh data from Firebase
        if (this.tubesSubscription) {
            this.tubesSubscription.unsubscribe();
        }

        this.tubesSubscription = this.firebaseTubeService.getTubes().subscribe({
            next: (tubes: TubeInformation[]) => {
                this.tubes = tubes;
                this.filterTubes();
                console.log('Tubes refreshed successfully', tubes.length);
                this.toastService.success(`Loaded ${tubes.length} tubes from database`);
            },
            error: (error: unknown) => {
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
        // Check if user is authenticated for delete operations
        if (!this.authService.isAuthenticated()) {
            this.toastService.error('You must be signed in to delete tubes.');
            return;
        }

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
        // TODO: Implement delete functionality in FirebaseTubeService
        console.log(`Delete requested for tube: ${tube.name}`);
        this.toastService.info('Delete functionality will be implemented in future updates.');
    }
}
