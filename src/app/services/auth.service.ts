import {
    Auth,
    authState,
    GoogleAuthProvider,
    signInWithPopup,
    signOut,
    User
} from '@angular/fire/auth';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class AuthService {
    user$: Observable<User | null>;

    constructor(private auth: Auth) {
        this.user$ = authState(this.auth);
    }

    /**
     * Sign in with Google
     */
    async signInWithGoogle(): Promise<void> {
        const provider = new GoogleAuthProvider();
        try {
            await signInWithPopup(this.auth, provider);
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
