import {
    Auth,
    authState,
    GoogleAuthProvider,
    signInWithPopup,
    signOut,
    User
} from '@angular/fire/auth';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { AnalyticsService } from './analytics.service';

@Injectable({
    providedIn: 'root'
})
export class AuthService {
    user$: Observable<User | null>;
    private analyticsService = inject(AnalyticsService);
    private auth = inject(Auth);

    constructor() {
        this.user$ = authState(this.auth);

        // Track user authentication state changes
        this.user$.subscribe(user => {
            if (user) {
                this.analyticsService.setUserId(user.uid);
            }
            else {
                this.analyticsService.setUserId(null);
            }
        });
    }

    /**
     * Sign in with Google
     */
    async signInWithGoogle(): Promise<void> {
        const provider = new GoogleAuthProvider();
        try {
            const result = await signInWithPopup(this.auth, provider);
            // Log analytics event for successful login
            this.analyticsService.logLogin('google');

            // Check if this is a new user (sign up)
            const isNewUser = result.user.metadata.creationTime === result.user.metadata.lastSignInTime;
            if (isNewUser) {
                this.analyticsService.logSignUp('google');
            }
        }
        catch (error) {
            console.error('Error signing in with Google:', error);
            throw error;
        }
    }

    /**
     * Sign out the current user
     */
    async signOut(): Promise<void> {
        try {
            await signOut(this.auth);
        }
        catch (error) {
            console.error('Error signing out:', error);
            throw error;
        }
    }

    /**
     * Get the current user
     */
    getCurrentUser(): User | null {
        return this.auth.currentUser;
    }

    /**
     * Check if user is authenticated
     */
    isAuthenticated(): boolean {
        return this.auth.currentUser !== null;
    }
}
