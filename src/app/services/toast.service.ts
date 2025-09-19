import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface Toast {
    id: string;
    type: 'success' | 'error' | 'warning' | 'info' | 'confirm';
    title?: string;
    message: string;
    duration?: number;
    icon?: string;
    onConfirm?: () => void;
    onCancel?: () => void;
    confirmText?: string;
    cancelText?: string;
}

@Injectable({
    providedIn: 'root'
})
export class ToastService {
    private toastsSubject = new BehaviorSubject<Toast[]>([]);
    public toasts$ = this.toastsSubject.asObservable();

    private generateId(): string {
        return Math.random().toString(36).substring(2, 15);
    }

    showToast(toast: Omit<Toast, 'id'>): void {
        const newToast: Toast = {
            ...toast,
            id: this.generateId(),
            duration: toast.type === 'confirm' ? 0 : (toast.duration || 5000) // Confirmations don't auto-dismiss
        };

        const currentToasts = this.toastsSubject.value;
        this.toastsSubject.next([...currentToasts, newToast]);

        // Auto-remove toast after duration (except confirmations)
        if (newToast.duration && newToast.duration > 0) {
            setTimeout(() => {
                this.removeToast(newToast.id);
            }, newToast.duration);
        }
    }

    success(message: string, title?: string, duration?: number): void {
        this.showToast({
            type: 'success',
            title: title || 'Success',
            message,
            duration,
            icon: 'bi-check-circle-fill'
        });
    }

    error(message: string, title?: string, duration?: number): void {
        this.showToast({
            type: 'error',
            title: title || 'Error',
            message,
            duration: duration || 7000, // Errors stay longer
            icon: 'bi-exclamation-triangle-fill'
        });
    }

    warning(message: string, title?: string, duration?: number): void {
        this.showToast({
            type: 'warning',
            title: title || 'Warning',
            message,
            duration,
            icon: 'bi-exclamation-circle-fill'
        });
    }

    info(message: string, title?: string, duration?: number): void {
        this.showToast({
            type: 'info',
            title: title || 'Information',
            message,
            duration,
            icon: 'bi-info-circle-fill'
        });
    }

    confirm(message: string, onConfirm: () => void, onCancel?: () => void, title?: string): void {
        this.showToast({
            type: 'confirm',
            title: title || 'Confirm Action',
            message,
            icon: 'bi-question-circle-fill',
            onConfirm,
            onCancel,
            confirmText: 'Delete',
            cancelText: 'Cancel'
        });
    }

    confirmAction(id: string): void {
        const currentToasts = this.toastsSubject.value;
        const toast = currentToasts.find(t => t.id === id);
        if (toast && toast.onConfirm) {
            toast.onConfirm();
        }
        this.removeToast(id);
    }

    cancelAction(id: string): void {
        const currentToasts = this.toastsSubject.value;
        const toast = currentToasts.find(t => t.id === id);
        if (toast && toast.onCancel) {
            toast.onCancel();
        }
        this.removeToast(id);
    }

    removeToast(id: string): void {
        const currentToasts = this.toastsSubject.value;
        this.toastsSubject.next(currentToasts.filter(toast => toast.id !== id));
    }

    clearAll(): void {
        this.toastsSubject.next([]);
    }
}
