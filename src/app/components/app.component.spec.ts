import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AppComponent } from './app.component';
import { AuthService } from '../services/auth.service';
import { provideRouter } from '@angular/router';

describe('AppComponent', () => {
    let component: AppComponent;
    let fixture: ComponentFixture<AppComponent>;
    let authService: jasmine.SpyObj<AuthService>;

    beforeEach(async () => {
        const authServiceSpy = jasmine.createSpyObj('AuthService', [
            'signInWithGoogle',
            'signOut'
        ]);

        await TestBed.configureTestingModule({
            imports: [AppComponent],
            providers: [
                { provide: AuthService, useValue: authServiceSpy },
                provideRouter([])
            ]
        }).compileComponents();

        authService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
        fixture = TestBed.createComponent(AppComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        // assert
        expect(component).toBeTruthy();
    });

    it('should have title "tube-models"', () => {
        // assert
        expect(component.title).toBe('tube-models');
    });

    describe('signIn', () => {
        it('should call authService.signInWithGoogle', async () => {
            // arrange
            authService.signInWithGoogle.and.returnValue(Promise.resolve());

            // act
            await component.signIn();

            // assert
            expect(authService.signInWithGoogle).toHaveBeenCalled();
        });

        it('should handle sign in error', async () => {
            // arrange
            const error = new Error('Sign in failed');
            authService.signInWithGoogle.and.returnValue(Promise.reject(error));
            spyOn(console, 'error');

            // act
            await component.signIn();

            // assert
            expect(console.error).toHaveBeenCalledWith('Sign in failed:', error);
        });

        it('should not throw error when sign in fails', async () => {
            // arrange
            authService.signInWithGoogle.and.returnValue(Promise.reject(new Error('Failed')));

            // act & assert
            await expectAsync(component.signIn()).toBeResolved();
        });
    });

    describe('signOut', () => {
        it('should call authService.signOut', async () => {
            // arrange
            authService.signOut.and.returnValue(Promise.resolve());

            // act
            await component.signOut();

            // assert
            expect(authService.signOut).toHaveBeenCalled();
        });

        it('should handle sign out error', async () => {
            // arrange
            const error = new Error('Sign out failed');
            authService.signOut.and.returnValue(Promise.reject(error));
            spyOn(console, 'error');

            // act
            await component.signOut();

            // assert
            expect(console.error).toHaveBeenCalledWith('Sign out failed:', error);
        });

        it('should not throw error when sign out fails', async () => {
            // arrange
            authService.signOut.and.returnValue(Promise.reject(new Error('Failed')));

            // act & assert
            await expectAsync(component.signOut()).toBeResolved();
        });
    });

    describe('runCalculation', () => {
        it('should create worker when Web Workers are supported', () => {
            // arrange
            spyOn(console, 'log');
            const mockWorker = jasmine.createSpyObj('Worker', ['postMessage']);
            spyOn(window, 'Worker').and.returnValue(mockWorker);

            // act
            component.runCalculation();

            // assert
            expect(window.Worker).toHaveBeenCalled();
            expect(mockWorker.postMessage).toHaveBeenCalledWith('hello');
        });

        it('should handle worker messages', () => {
            // arrange
            spyOn(console, 'log');
            const mockWorker = {
                postMessage: jasmine.createSpy('postMessage'),
                onmessage: null as ((event: MessageEvent) => void) | null
            };
            spyOn(window, 'Worker').and.returnValue(mockWorker as unknown as Worker);

            // act
            component.runCalculation();

            // assert
            expect(mockWorker.onmessage).toBeTruthy();

            // act
            if (mockWorker.onmessage) {
                mockWorker.onmessage({ data: 'test message' } as MessageEvent);
            }

            // assert
            expect(console.log).toHaveBeenCalledWith('page got message: test message');
        });

        it('should log fallback message when Web Workers are not supported', () => {
            // arrange
            const originalWorker = (window as Window & { Worker?: unknown }).Worker;
            (window as Window & { Worker?: unknown }).Worker = undefined;
            spyOn(console, 'log');

            // act
            component.runCalculation();

            // assert
            expect(console.log).toHaveBeenCalledWith('Web Workers are not supported in this environment.');

            // cleanup
            (window as Window & { Worker?: unknown }).Worker = originalWorker;
        });

        it('should check for Worker support before creating worker', () => {
            // arrange
            spyOn(console, 'log');
            const mockWorker = jasmine.createSpyObj('Worker', ['postMessage']);
            spyOn(window, 'Worker').and.returnValue(mockWorker);

            // act
            component.runCalculation();

            // assert
            expect(typeof Worker).toBe('function');
            expect(window.Worker).toHaveBeenCalled();
        });
    });

    describe('Integration tests', () => {
        it('should inject AuthService', () => {
            // assert
            expect(component.authService).toBeTruthy();
        });

        it('should handle multiple sign in/out cycles', async () => {
            // arrange
            authService.signInWithGoogle.and.returnValue(Promise.resolve());
            authService.signOut.and.returnValue(Promise.resolve());

            // act
            await component.signIn();
            await component.signOut();
            await component.signIn();
            await component.signOut();

            // assert
            expect(authService.signInWithGoogle).toHaveBeenCalledTimes(2);
            expect(authService.signOut).toHaveBeenCalledTimes(2);
        });

        it('should handle sign in after sign out error', async () => {
            // arrange
            authService.signOut.and.returnValue(Promise.reject(new Error('Sign out error')));
            authService.signInWithGoogle.and.returnValue(Promise.resolve());

            // act
            await component.signOut();
            await component.signIn();

            // assert
            expect(authService.signOut).toHaveBeenCalled();
            expect(authService.signInWithGoogle).toHaveBeenCalled();
        });
    });
});
