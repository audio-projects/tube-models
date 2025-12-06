import {
    addDoc,
    collection,
    collectionData,
    deleteDoc,
    doc,
    Firestore,
    getDoc,
    updateDoc
} from '@angular/fire/firestore';
import { Auth } from '@angular/fire/auth';
import { from, Observable } from 'rxjs';
import { Injectable, Injector, runInInjectionContext } from '@angular/core';
import { TubeInformation } from '../components/tube-information';

@Injectable({
    providedIn: 'root'
})
export class FirebaseTubeService {

    constructor(private injector: Injector, private firestore: Firestore, private auth: Auth) { }

    /**
     * Get all tubes from the Firebase database
     * This method works for both anonymous and authenticated users
     * @returns Observable of TubeInformation array
     */
    getTubes(): Observable<TubeInformation[]> {
        // ensure we are in the injection context
        return runInInjectionContext(this.injector, () => {
            // collection reference
            const tubesCollection = collection(this.firestore, 'tubes');
            // return observable of collection data
            return collectionData(tubesCollection, { idField: 'id' }) as Observable<TubeInformation[]>;
        });
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
        // If no user is logged in or tube has no owner, return false
        if (!this.auth.currentUser || !tube.owner)
            return false;
        // check ownership
        return this.auth.currentUser.uid === tube.owner;
    }

    /**
     * Get a single tube by ID
     * @param id The tube ID
     * @returns Observable of TubeInformation or null
     */
    getTubeById(id: string): Observable<TubeInformation | null> {
        // ensure we are in the injection context
        return runInInjectionContext(this.injector, () => {
            // document reference
            const tubeDoc = doc(this.firestore, 'tubes', id);
            // return observable of document data
            return from(getDoc(tubeDoc).then(docSnap => docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } as TubeInformation : null));
        });
    }

    /**
     * Save a new tube to Firebase
     * @param tube The tube data to save (without ID)
     * @returns Observable of the created tube with ID
     */
    saveTube(tube: Omit<TubeInformation, 'id'>): Observable<TubeInformation> {
        // ensure user is authenticated
        if (!this.auth.currentUser)
            throw new Error('Authentication required to save tubes');
        // validate required fields
        if (!tube.name || tube.name.trim() === '')
            throw new Error('Tube name is required');
        // prepare tube data with owner and timestamp
        const tubeData = {
            ...tube,
            owner: this.auth.currentUser.uid,
            lastUpdatedOn: new Date().toISOString().split('T')[0] // Use date-only format for HTML date inputs
        };
        // ensure we are in the injection context
        return runInInjectionContext(this.injector, () => {
            // collection reference
            const tubesCollection = collection(this.firestore, 'tubes');
            // add document to collection
            return from(addDoc(tubesCollection, tubeData)
                .then(docRef => {
                    return { id: docRef.id, ...tubeData } as TubeInformation;
                })
                .catch(error => {
                    console.error('Detailed Firebase error:', error);
                    console.error('Error code:', error.code);
                    console.error('Error message:', error.message);
                    throw error;
                }));
        });
    }

    /**
     * Update an existing tube
     * @param tube The complete tube data with ID
     * @returns Observable of the updated tube
     */
    updateTube(tube: TubeInformation): Observable<TubeInformation> {
        // ensure user is authenticated
        if (!this.auth.currentUser)
            throw new Error('Authentication required to update tubes');
        // validate required fields
        if (!tube.name || tube.name.trim() === '')
            throw new Error('Tube name is required');
        // check ownership
        if (!this.isOwner(tube))
            throw new Error('Only the tube owner can update this tube');
        // ensure we are in the injection context
        return runInInjectionContext(this.injector, () => {
            // document reference
            const tubeDoc = doc(this.firestore, 'tubes', tube.id);
            // prepare data to update
            const { id, ...updateData } = tube; // Extract ID from tube data
            const dataToUpdate = {
                ...updateData,
                lastUpdatedOn: new Date().toISOString().split('T')[0] // Use date-only format for HTML date inputs
            };
            // update document
            return from(updateDoc(tubeDoc, dataToUpdate)
                .then(() => {
                    return { id, ...dataToUpdate } as TubeInformation;
                }));
        });
    }

    /**
     * Delete a tube from Firebase
     * @param tube The tube to delete
     * @returns Observable of success boolean
     */
    deleteTube(tube: TubeInformation): Observable<boolean> {
        // ensure user is authenticated
        if (!this.auth.currentUser)
            throw new Error('Authentication required to delete tubes');
        // check ownership
        if (!this.isOwner(tube))
            throw new Error('Only the tube owner can delete this tube');
        // ensure we are in the injection context
        return runInInjectionContext(this.injector, () => {
            // document reference
            const tubeDoc = doc(this.firestore, 'tubes', tube.id);
            // delete document
            return from(deleteDoc(tubeDoc)
                .then(() => true));
        });
    }
}
