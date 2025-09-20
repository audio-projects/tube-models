import { TestBed } from '@angular/core/testing';
import { Firestore } from '@angular/fire/firestore';
import { Auth } from '@angular/fire/auth';
import { FirebaseTubeService } from './firebase-tube.service';

describe('FirebaseTubeService', () => {

    let service: FirebaseTubeService;

    beforeEach(() => {
        const firestoreSpy = jasmine.createSpyObj('Firestore', ['collection']);
        const authSpy = jasmine.createSpyObj('Auth', [], {
            currentUser: null,
            app: { name: 'test-app', options: {} }
        });

        TestBed.configureTestingModule({
            providers: [
                { provide: Firestore, useValue: firestoreSpy },
                { provide: Auth, useValue: authSpy }
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
