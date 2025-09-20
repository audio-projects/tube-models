import { AuthService } from './auth.service';
import { of } from 'rxjs';
import { TestBed } from '@angular/core/testing';

describe('AuthService', () => {
    let service: AuthService;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [
                {
                    provide: AuthService,
                    useFactory: () => {
                        const authService = Object.create(AuthService.prototype);
                        authService.user$ = of(null);
                        authService.signInWithGoogle = jasmine.createSpy('signInWithGoogle').and.returnValue(Promise.resolve());
                        authService.signOut = jasmine.createSpy('signOut').and.returnValue(Promise.resolve());
                        authService.getCurrentUser = jasmine.createSpy('getCurrentUser').and.returnValue(null);
                        authService.isAuthenticated = jasmine.createSpy('isAuthenticated').and.returnValue(false);
                        return authService;
                    }
                }
            ]
        });

        service = TestBed.inject(AuthService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('should have required methods defined', () => {
        expect(service.signInWithGoogle).toBeDefined();
        expect(typeof service.signInWithGoogle).toBe('function');
        expect(service.signOut).toBeDefined();
        expect(typeof service.signOut).toBe('function');
        expect(service.getCurrentUser).toBeDefined();
        expect(typeof service.getCurrentUser).toBe('function');
        expect(service.isAuthenticated).toBeDefined();
        expect(typeof service.isAuthenticated).toBe('function');
    });
});
