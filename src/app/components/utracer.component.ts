import { CommonModule } from '@angular/common';
import {
    Component,
    EventEmitter,
    inject,
    Output
} from '@angular/core';
import { File as TubeFile } from '../files';
import { SerialService } from '../services/serial.service';

@Component({
    selector: 'app-utracer',
    templateUrl: './utracer.component.html',
    styleUrl: './utracer.component.scss',
    imports: [CommonModule]
})
export class UTracerComponent {

    @Output() fileImported = new EventEmitter<TubeFile>();
    @Output() closed = new EventEmitter<void>();

    private serialService = inject(SerialService);
    importStatus = '';
    isImporting = false;

    close() {
        this.closed.emit();
    }

    cancel() {
        this.close();
    }
}
