import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { TubeInformation } from '../components/tube-information';

@Injectable({
    providedIn: 'root'
})
export class TubeDataService {
    private readonly STORAGE_KEY = 'tube_models_data';
    private tubesSubject = new BehaviorSubject<TubeInformation[]>([]);

    constructor() {
        this.loadTubesFromStorage();
    }

    // Observable for components to subscribe to tube data changes
    get tubes$(): Observable<TubeInformation[]> {
        return this.tubesSubject.asObservable();
    }

    // Get current tubes array
    get tubes(): TubeInformation[] {
        return this.tubesSubject.value;
    }

    // Load initial data or from localStorage
    private loadTubesFromStorage(): void {
        try {
            const storedData = localStorage.getItem(this.STORAGE_KEY);
            if (storedData) {
                const tubes = JSON.parse(storedData);
                this.tubesSubject.next(tubes);
            }
            else {
                // Load default sample data if no stored data exists
                this.loadDefaultData();
            }
        }
        catch (error) {
            console.error('Error loading tubes from storage:', error);
            this.loadDefaultData();
        }
    }

    // Load default sample data
    private loadDefaultData(): void {
        const defaultTubes: TubeInformation[] = [
            {
                id: '1',
                name: 'ECC83',
                manufacturer: 'Mullard',
                comments: 'High-gain dual triode tube commonly used in guitar amplifiers',
                lastUpdatedOn: '2023-10-01',
                type: 'Triode',
                files: [],
            },
            {
                id: '2',
                name: '12AX7',
                manufacturer: 'JJ Electronic',
                comments: 'American designation for ECC83, popular in audio applications',
                lastUpdatedOn: '2023-09-15',
                type: 'Triode',
                files: [],
            },
            {
                id: '3',
                name: 'EL34',
                manufacturer: 'Sovtek',
                comments: 'Power pentode used in Marshall and Vox amplifiers',
                lastUpdatedOn: '2023-08-22',
                type: 'Pentode',
                files: [],
            },
            {
                id: '4',
                name: '6V6GT',
                manufacturer: 'Tung-Sol',
                comments: 'Beam power tetrode, classic American tube',
                lastUpdatedOn: '2023-07-30',
                type: 'Tetrode',
                files: [],
            },
            {
                id: '5',
                name: 'KT88',
                manufacturer: 'Gold Lion',
                comments: 'High-power beam tetrode for hi-fi applications',
                lastUpdatedOn: '2023-06-18',
                type: 'Tetrode',
                files: [],
            },
        ];
        this.tubesSubject.next(defaultTubes);
        this.saveToStorage();
    }

    // Save tubes to localStorage
    private saveToStorage(): void {
        try {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.tubes));
        }
        catch (error) {
            console.error('Error saving tubes to storage:', error);
        }
    }

    // Generate a new unique ID
    private generateId(): string {
        const existingIds = this.tubes.map(tube => parseInt(tube.id)).filter(id => !isNaN(id));
        const maxId = existingIds.length > 0 ? Math.max(...existingIds) : 0;
        return (maxId + 1).toString();
    }

    // Get a tube by ID
    getTubeById(id: string): TubeInformation | null {
        return this.tubes.find(tube => tube.id === id) || null;
    }

    // Save a tube (create or update)
    saveTube(tube: TubeInformation): Observable<TubeInformation> {
        return new Observable(observer => {
            try {
                const tubes = [...this.tubes];

                if (!tube.id) {
                    // Create new tube
                    tube.id = this.generateId();
                    tube.lastUpdatedOn = new Date().toISOString().split('T')[0];
                    tubes.push(tube);
                }
                else {
                    // Update existing tube
                    const index = tubes.findIndex(t => t.id === tube.id);
                    if (index !== -1) {
                        tube.lastUpdatedOn = new Date().toISOString().split('T')[0];
                        tubes[index] = { ...tube };
                    }
                    else {
                        // If tube doesn't exist, create it
                        tube.lastUpdatedOn = new Date().toISOString().split('T')[0];
                        tubes.push(tube);
                    }
                }

                this.tubesSubject.next(tubes);
                this.saveToStorage();
                observer.next(tube);
                observer.complete();
            }
            catch (error) {
                observer.error(error);
            }
        });
    }

    // Delete a tube
    deleteTube(id: string): Observable<boolean> {
        return new Observable(observer => {
            try {
                const tubes = this.tubes.filter(tube => tube.id !== id);
                this.tubesSubject.next(tubes);
                this.saveToStorage();
                observer.next(true);
                observer.complete();
            }
            catch (error) {
                observer.error(error);
            }
        });
    }

    // Duplicate a tube
    duplicateTube(originalTube: TubeInformation): Observable<TubeInformation> {
        return new Observable(observer => {
            try {
                const duplicatedTube: TubeInformation = {
                    ...originalTube,
                    id: this.generateId(),
                    name: `${originalTube.name} (Copy)`,
                    lastUpdatedOn: new Date().toISOString().split('T')[0],
                    // Deep copy files array to avoid reference sharing
                    files: originalTube.files.map(file => ({ ...file }))
                };

                const tubes = [...this.tubes, duplicatedTube];
                this.tubesSubject.next(tubes);
                this.saveToStorage();
                observer.next(duplicatedTube);
                observer.complete();
            }
            catch (error) {
                observer.error(error);
            }
        });
    }

    // Refresh data (reload from storage or external source)
    refreshTubes(): Observable<TubeInformation[]> {
        return new Observable(observer => {
            try {
                this.loadTubesFromStorage();
                observer.next(this.tubes);
                observer.complete();
            }
            catch (error) {
                observer.error(error);
            }
        });
    }

    // Export all tubes data
    exportAllTubes(): string {
        return JSON.stringify(this.tubes, null, 2);
    }

    // Import tubes data
    importTubes(jsonData: string): Observable<TubeInformation[]> {
        return new Observable(observer => {
            try {
                const importedTubes: TubeInformation[] = JSON.parse(jsonData);

                // Validate the imported data structure
                if (!Array.isArray(importedTubes)) {
                    throw new Error('Invalid data format: expected an array of tubes');
                }

                // Ensure each tube has required fields
                const validatedTubes = importedTubes.map(tube => {
                    if (!tube.id || !tube.name || !tube.type) {
                        throw new Error('Invalid tube data: missing required fields');
                    }
                    return {
                        ...tube,
                        files: tube.files || []
                    };
                });

                this.tubesSubject.next(validatedTubes);
                this.saveToStorage();
                observer.next(validatedTubes);
                observer.complete();
            }
            catch (error) {
                observer.error(error);
            }
        });
    }

    // Clear all data
    clearAllData(): Observable<boolean> {
        return new Observable(observer => {
            try {
                localStorage.removeItem(this.STORAGE_KEY);
                this.tubesSubject.next([]);
                observer.next(true);
                observer.complete();
            }
            catch (error) {
                observer.error(error);
            }
        });
    }
}
