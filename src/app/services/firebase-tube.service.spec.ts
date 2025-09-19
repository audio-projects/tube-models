import { TestBed } from '@angular/core/testing';
import { Firestore } from '@angular/fire/firestore';
import { FirebaseTubeService } from './firebase-tube.service';

describe('FirebaseTubeService', () => {

    let service: FirebaseTubeService;

    beforeEach(() => {
        const spy = jasmine.createSpyObj('Firestore', ['collection']);

        TestBed.configureTestingModule({
            providers: [
                { provide: Firestore, useValue: spy }
            ]
        });
        service = TestBed.inject(FirebaseTubeService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('should have getTubes method', () => {
        expect(service.getTubes).toBeDefined();
        expect(typeof service.getTubes).toBe('function');
    });
});
