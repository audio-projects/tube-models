import { Component, inject, Inject, OnInit } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule, DOCUMENT } from '@angular/common';
import { ToastComponent } from './toast.component';
import { AuthService } from '../services/auth.service';

@Component({
    selector: 'app-root',
    imports: [RouterOutlet, RouterLink, RouterLinkActive, ToastComponent, CommonModule],
    templateUrl: './app.component.html',
    styleUrl: './app.component.scss',
})
export class AppComponent implements OnInit {
    title = 'tube-models';
    authService = inject(AuthService);

    constructor(@Inject(DOCUMENT) private document: Document) {}

    ngOnInit(): void {
        const baseHref = this.document.querySelector('base')?.getAttribute('href') || '/';
        this.document.documentElement.style.setProperty('--background-image-url', `url('${baseHref}media/background.jpg')`);
    }

    async signIn(): Promise<void> {
        try {
            await this.authService.signInWithGoogle();
        }
        catch (error) {
            console.error('Sign in failed:', error);
        }
    }

    async signOut(): Promise<void> {
        try {
            await this.authService.signOut();
        }
        catch (error) {
            console.error('Sign out failed:', error);
        }
    }

    runCalculation() {
        // Check if Web Workers are supported
        if (typeof Worker !== 'undefined') {
            // create a new Web Worker
            const worker = new Worker(new URL('../workers/optimize-norman-koren-triode-model-parameters.worker', import.meta.url));
            // log messages from the worker
            worker.onmessage = ({ data }) => {
                console.log(`page got message: ${data}`);
            };
            // send a message to the worker
            worker.postMessage('hello');
        }
        else {
            // Fallback mechanism if Web Workers are not supported
            console.log('Web Workers are not supported in this environment.');
        }
    }
}
