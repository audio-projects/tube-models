import { Injectable } from '@angular/core';
import { Firestore, collection, collectionData } from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { TubeInformation } from '../components/tube-information';

@Injectable({
    providedIn: 'root'
})
export class FirebaseTubeService {

    constructor(private firestore: Firestore) { }

    /**
     * Get all tubes from the Firebase database
     * This method works for both anonymous and authenticated users
     * @returns Observable of TubeInformation array
     */
    getTubes(): Observable<TubeInformation[]> {
        const tubesCollection = collection(this.firestore, 'tubes');
        return collectionData(tubesCollection, { idField: 'id' }) as Observable<TubeInformation[]>;
    }

    /**
     * Check if current user can modify data
     * For future use - will require authentication for write operations
     * @returns boolean indicating if user can modify data
     */
    canModifyData(): boolean {
        // TODO: Implement authentication check
        // For now, return false - modification will require authentication
        return false;
    }
}
