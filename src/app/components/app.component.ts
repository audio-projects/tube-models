import { Component } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { ToastComponent } from './toast.component';

@Component({
    selector: 'app-root',
    imports: [RouterOutlet, RouterLink, RouterLinkActive, ToastComponent],
    templateUrl: './app.component.html',
    styleUrl: './app.component.scss',
})
export class AppComponent {
    title = 'tube-models';

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
