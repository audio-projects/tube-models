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
     * @returns Observable of TubeInformation array
     */
    getTubes(): Observable<TubeInformation[]> {
        const tubesCollection = collection(this.firestore, 'tubes');
        return collectionData(tubesCollection, { idField: 'id' }) as Observable<TubeInformation[]>;
    }
}
