import { TestBed } from '@angular/core/testing';
import { Auth } from '@angular/fire/auth';
import { AuthService } from './auth.service';

describe('AuthService', () => {
    let service: AuthService;

    beforeEach(() => {
        // Create a minimal mock that won't trigger Firebase initialization
        const authMock = {
            currentUser: null,
            app: {
                name: 'test-app',
                options: {}
            }
        };

        TestBed.configureTestingModule({
            providers: [
                { provide: Auth, useValue: authMock }
            ]
        });
    });

    it('should be created with manual instantiation', () => {
        const authMock = {
            currentUser: null,
            app: {
                name: 'test-app',
                options: {}
            }
        } as Partial<Auth>;

        service = new AuthService(authMock as Auth);
        expect(service).toBeTruthy();
    });

    it('should have required methods defined', () => {
        const authMock = {
            currentUser: null,
            app: {
                name: 'test-app',
                options: {}
            }
        } as Partial<Auth>;

        service = new AuthService(authMock as Auth);

        expect(service.signInWithGoogle).toBeDefined();
        expect(typeof service.signInWithGoogle).toBe('function');
        expect(service.signOut).toBeDefined();
        expect(typeof service.signOut).toBe('function');
        expect(service.isAuthenticated).toBeDefined();
        expect(typeof service.isAuthenticated).toBe('function');
    });
});
