import { TestBed } from '@angular/core/testing';
import { Firestore } from '@angular/fire/firestore';
import { Auth } from '@angular/fire/auth';
import { FirebaseTubeService } from './firebase-tube.service';
import { TubeInformation } from '../components/tube-information';

describe('FirebaseTubeService', () => {

    let service: FirebaseTubeService;
    let firestoreSpy: jasmine.SpyObj<Firestore>;
    let authSpy: jasmine.SpyObj<Auth>;

    const mockUser = {
        uid: 'test-user-123',
        email: 'test@example.com',
        displayName: 'Test User'
    };

    const mockTube: TubeInformation = {
        id: 'tube-123',
        name: 'ECC83',
        manufacturer: 'Test Manufacturer',
        comments: 'Test comments',
        type: 'Triode',
        owner: 'test-user-123',
        lastUpdatedOn: '2025-12-06',
        files: []
    };

    beforeEach(() => {
        firestoreSpy = jasmine.createSpyObj('Firestore', ['collection']);
        authSpy = jasmine.createSpyObj('Auth', [], {
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

    describe('canModifyData', () => {
        it('should return false when user is not authenticated', () => {
            Object.defineProperty(authSpy, 'currentUser', { value: null, writable: true });
            expect(service.canModifyData()).toBe(false);
        });

        it('should return true when user is authenticated', () => {
            Object.defineProperty(authSpy, 'currentUser', { value: mockUser, writable: true });
            expect(service.canModifyData()).toBe(true);
        });
    });

    describe('isOwner', () => {
        it('should return false when user is not authenticated', () => {
            Object.defineProperty(authSpy, 'currentUser', { value: null, writable: true });
            expect(service.isOwner(mockTube)).toBe(false);
        });

        it('should return false when tube has no owner', () => {
            Object.defineProperty(authSpy, 'currentUser', { value: mockUser, writable: true });
            const tubeWithoutOwner = { ...mockTube, owner: undefined };
            expect(service.isOwner(tubeWithoutOwner)).toBe(false);
        });

        it('should return false when user is not the owner', () => {
            Object.defineProperty(authSpy, 'currentUser', { value: { ...mockUser, uid: 'other-user' }, writable: true });
            expect(service.isOwner(mockTube)).toBe(false);
        });

        it('should return true when user is the owner', () => {
            Object.defineProperty(authSpy, 'currentUser', { value: mockUser, writable: true });
            expect(service.isOwner(mockTube)).toBe(true);
        });
    });

    describe('saveTube', () => {
        it('should throw error when user is not authenticated', () => {
            Object.defineProperty(authSpy, 'currentUser', { value: null, writable: true });
            const tubeData: Omit<TubeInformation, 'id'> = {
                name: 'ECC83',
                manufacturer: 'Test',
                comments: '',
                type: 'Triode',
                lastUpdatedOn: '2025-12-06',
                files: []
            };
            expect(() => service.saveTube(tubeData)).toThrowError('Authentication required to save tubes');
        });

        it('should throw error when tube name is empty', () => {
            Object.defineProperty(authSpy, 'currentUser', { value: mockUser, writable: true });
            const tubeData: Omit<TubeInformation, 'id'> = {
                name: '',
                manufacturer: 'Test',
                comments: '',
                type: 'Triode',
                lastUpdatedOn: '2025-12-06',
                files: []
            };
            expect(() => service.saveTube(tubeData)).toThrowError('Tube name is required');
        });

        it('should throw error when tube name is whitespace only', () => {
            Object.defineProperty(authSpy, 'currentUser', { value: mockUser, writable: true });
            const tubeData: Omit<TubeInformation, 'id'> = {
                name: '   ',
                manufacturer: 'Test',
                comments: '',
                type: 'Triode',
                lastUpdatedOn: '2025-12-06',
                files: []
            };
            expect(() => service.saveTube(tubeData)).toThrowError('Tube name is required');
        });
    });

    describe('updateTube', () => {
        it('should throw error when user is not authenticated', () => {
            Object.defineProperty(authSpy, 'currentUser', { value: null, writable: true });
            expect(() => service.updateTube(mockTube)).toThrowError('Authentication required to save tubes');
        });

        it('should throw error when tube name is empty', () => {
            Object.defineProperty(authSpy, 'currentUser', { value: mockUser, writable: true });
            const tube = { ...mockTube, name: '' };
            expect(() => service.updateTube(tube)).toThrowError('Tube name is required');
        });

        it('should throw error when user is not the owner', () => {
            Object.defineProperty(authSpy, 'currentUser', { value: { ...mockUser, uid: 'other-user' }, writable: true });
            expect(() => service.updateTube(mockTube)).toThrowError('Only the tube owner can update this tube');
        });
    });

    describe('deleteTube', () => {
        it('should throw error when user is not authenticated', () => {
            Object.defineProperty(authSpy, 'currentUser', { value: null, writable: true });
            expect(() => service.deleteTube(mockTube)).toThrowError('Authentication required to save tubes');
        });

        it('should throw error when user is not the owner', () => {
            Object.defineProperty(authSpy, 'currentUser', { value: { ...mockUser, uid: 'other-user' }, writable: true });
            expect(() => service.deleteTube(mockTube)).toThrowError('Only the tube owner can update this tube');
        });
    });
});
