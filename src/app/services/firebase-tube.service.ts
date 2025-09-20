import { Injectable } from '@angular/core';
import {
    Firestore,
    collection,
    collectionData,
    doc,
    getDoc,
    addDoc,
    updateDoc,
    deleteDoc
} from '@angular/fire/firestore';
import { Auth } from '@angular/fire/auth';
import { Observable, from } from 'rxjs';
import { TubeInformation } from '../components/tube-information';

@Injectable({
    providedIn: 'root'
})
export class FirebaseTubeService {

    constructor(private firestore: Firestore, private auth: Auth) { }

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
        return this.auth.currentUser !== null;
    }

    /**
     * Check if current user owns a specific tube
     * @param tube The tube to check ownership for
     * @returns boolean indicating if current user owns the tube
     */
    isOwner(tube: TubeInformation): boolean {
        if (!this.auth.currentUser || !tube.owner) {
            return false;
        }
        return this.auth.currentUser.uid === tube.owner;
    }

    /**
     * Get a single tube by ID
     * @param id The tube ID
     * @returns Observable of TubeInformation or null
     */
    getTubeById(id: string): Observable<TubeInformation | null> {
        const tubeDoc = doc(this.firestore, 'tubes', id);
        return from(getDoc(tubeDoc).then(docSnap => {
            if (docSnap.exists()) {
                return { id: docSnap.id, ...docSnap.data() } as TubeInformation;
            }
            return null;
        }));
    }

    /**
     * Save a new tube to Firebase
     * @param tube The tube data to save (without ID)
     * @returns Observable of the created tube with ID
     */
    saveTube(tube: Omit<TubeInformation, 'id'>): Observable<TubeInformation> {
        if (!this.auth.currentUser) {
            throw new Error('Authentication required to save tubes');
        }

        const tubeData = {
            ...tube,
            owner: this.auth.currentUser.uid,
            lastUpdatedOn: new Date().toISOString()
        };

        const tubesCollection = collection(this.firestore, 'tubes');
        return from(addDoc(tubesCollection, tubeData).then(docRef => {
            return { id: docRef.id, ...tubeData } as TubeInformation;
        }));
    }

    /**
     * Update an existing tube
     * @param tube The complete tube data with ID
     * @returns Observable of the updated tube
     */
    updateTube(tube: TubeInformation): Observable<TubeInformation> {
        if (!this.auth.currentUser) {
            throw new Error('Authentication required to update tubes');
        }

        if (!this.isOwner(tube)) {
            throw new Error('Only the tube owner can update this tube');
        }

        const tubeDoc = doc(this.firestore, 'tubes', tube.id);
        const { id, ...updateData } = tube; // Extract ID from tube data
        const dataToUpdate = {
            ...updateData,
            lastUpdatedOn: new Date().toISOString()
        };

        return from(updateDoc(tubeDoc, dataToUpdate).then(() => {
            return { id, ...dataToUpdate } as TubeInformation;
        }));
    }

    /**
     * Delete a tube from Firebase
     * @param tube The tube to delete
     * @returns Observable of success boolean
     */
    deleteTube(tube: TubeInformation): Observable<boolean> {
        if (!this.auth.currentUser) {
            throw new Error('Authentication required to delete tubes');
        }

        if (!this.isOwner(tube)) {
            throw new Error('Only the tube owner can delete this tube');
        }

        const tubeDoc = doc(this.firestore, 'tubes', tube.id);
        return from(deleteDoc(tubeDoc).then(() => true));
    }
}
