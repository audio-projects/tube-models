import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { ToastService, Toast } from '../services/toast.service';

@Component({
    selector: 'app-toast',
    templateUrl: './toast.component.html',
    styleUrl: './toast.component.scss',
    imports: [CommonModule]
})
export class ToastComponent implements OnInit, OnDestroy {
    toasts: Toast[] = [];
    private subscription: Subscription = new Subscription();
    private toastService = inject(ToastService);

    ngOnInit(): void {
        this.subscription = this.toastService.toasts$.subscribe(toasts => {
            this.toasts = toasts;
        });
    }

    ngOnDestroy(): void {
        this.subscription.unsubscribe();
    }

    removeToast(id: string): void {
        this.toastService.removeToast(id);
    }

    confirmAction(id: string): void {
        this.toastService.confirmAction(id);
    }

    cancelAction(id: string): void {
        this.toastService.cancelAction(id);
    }

    getToastClass(type: string): string {
        switch (type) {
            case 'success':
                return 'toast-success border-success';
            case 'error':
                return 'toast-error border-danger';
            case 'warning':
                return 'toast-warning border-warning';
            case 'info':
                return 'toast-info border-info';
            case 'confirm':
                return 'toast-confirm border-danger';
            default:
                return 'toast-info border-info';
        }
    }

    getHeaderClass(type: string): string {
        switch (type) {
            case 'success':
                return 'toast-header-success bg-success text-white';
            case 'error':
                return 'toast-header-error bg-danger text-white';
            case 'warning':
                return 'toast-header-warning bg-warning text-dark';
            case 'info':
                return 'toast-header-info bg-info text-white';
            case 'confirm':
                return 'toast-header-confirm bg-danger text-white';
            default:
                return 'toast-header-info bg-info text-white';
        }
    }
}
