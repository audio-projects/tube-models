import { TestBed } from '@angular/core/testing';
import { ToastService } from './toast.service';

describe('ToastService', () => {
    let service: ToastService;

    beforeEach(() => {
        TestBed.configureTestingModule({});
        service = TestBed.inject(ToastService);
    });

    afterEach(() => {
        service.clearAll();
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    describe('showToast', () => {
        it('should add a toast to the toasts array', (done) => {
            service.showToast({
                type: 'info',
                message: 'Test message',
                duration: 0 // Disable auto-dismiss for test
            });

            service.toasts$.subscribe(toasts => {
                if (toasts.length === 1) {
                    expect(toasts[0].message).toBe('Test message');
                    expect(toasts[0].type).toBe('info');
                    expect(toasts[0].id).toBeTruthy();
                    done();
                }
            });
        });

        it('should generate unique IDs for toasts', (done) => {
            service.showToast({ type: 'info', message: 'Toast 1', duration: 0 });
            service.showToast({ type: 'info', message: 'Toast 2', duration: 0 });

            service.toasts$.subscribe(toasts => {
                if (toasts.length === 2) {
                    expect(toasts[0].id).not.toBe(toasts[1].id);
                    done();
                }
            });
        });

        it('should set duration to 0 for confirm type', (done) => {
            service.showToast({
                type: 'confirm',
                message: 'Confirm this action'
            });

            service.toasts$.subscribe(toasts => {
                if (toasts.length > 0) {
                    expect(toasts[0].duration).toBe(0);
                    done();
                }
            });
        });

        it('should set default duration of 5000ms for non-confirm types', (done) => {
            service.showToast({
                type: 'success',
                message: 'Success message'
            });

            service.toasts$.subscribe(toasts => {
                if (toasts.length > 0) {
                    expect(toasts[0].duration).toBe(5000);
                    done();
                }
            });
        });

        it('should use custom duration when provided', (done) => {
            service.showToast({
                type: 'info',
                message: 'Custom duration',
                duration: 3000
            });

            service.toasts$.subscribe(toasts => {
                if (toasts.length > 0) {
                    expect(toasts[0].duration).toBe(3000);
                    done();
                }
            });
        });

        it('should auto-remove toast after duration', (done) => {
            service.showToast({
                type: 'info',
                message: 'Auto-dismiss test',
                duration: 100
            });

            setTimeout(() => {
                service.toasts$.subscribe(toasts => {
                    expect(toasts.length).toBe(0);
                    done();
                });
            }, 150);
        });

        it('should not auto-remove confirm toasts', (done) => {
            service.showToast({
                type: 'confirm',
                message: 'Confirm action'
            });

            setTimeout(() => {
                service.toasts$.subscribe(toasts => {
                    expect(toasts.length).toBe(1);
                    done();
                });
            }, 100);
        });
    });

    describe('success', () => {
        it('should create a success toast with default title', (done) => {
            service.success('Operation successful');

            service.toasts$.subscribe(toasts => {
                if (toasts.length > 0) {
                    expect(toasts[0].type).toBe('success');
                    expect(toasts[0].title).toBe('Success');
                    expect(toasts[0].message).toBe('Operation successful');
                    expect(toasts[0].icon).toBe('bi-check-circle-fill');
                    done();
                }
            });
        });

        it('should use custom title when provided', (done) => {
            service.success('Data saved', 'Save Complete');

            service.toasts$.subscribe(toasts => {
                if (toasts.length > 0) {
                    expect(toasts[0].title).toBe('Save Complete');
                    done();
                }
            });
        });

        it('should use custom duration when provided', (done) => {
            service.success('Success', undefined, 3000);

            service.toasts$.subscribe(toasts => {
                if (toasts.length > 0) {
                    expect(toasts[0].duration).toBe(3000);
                    done();
                }
            });
        });
    });

    describe('error', () => {
        it('should create an error toast with default title and extended duration', (done) => {
            service.error('Something went wrong');

            service.toasts$.subscribe(toasts => {
                if (toasts.length > 0) {
                    expect(toasts[0].type).toBe('error');
                    expect(toasts[0].title).toBe('Error');
                    expect(toasts[0].message).toBe('Something went wrong');
                    expect(toasts[0].icon).toBe('bi-exclamation-triangle-fill');
                    expect(toasts[0].duration).toBe(7000); // Errors stay longer
                    done();
                }
            });
        });

        it('should use custom title when provided', (done) => {
            service.error('Network error', 'Connection Failed');

            service.toasts$.subscribe(toasts => {
                if (toasts.length > 0) {
                    expect(toasts[0].title).toBe('Connection Failed');
                    done();
                }
            });
        });
    });

    describe('warning', () => {
        it('should create a warning toast with default title', (done) => {
            service.warning('Please check your input');

            service.toasts$.subscribe(toasts => {
                if (toasts.length > 0) {
                    expect(toasts[0].type).toBe('warning');
                    expect(toasts[0].title).toBe('Warning');
                    expect(toasts[0].message).toBe('Please check your input');
                    expect(toasts[0].icon).toBe('bi-exclamation-circle-fill');
                    done();
                }
            });
        });
    });

    describe('info', () => {
        it('should create an info toast with default title', (done) => {
            service.info('This is some information');

            service.toasts$.subscribe(toasts => {
                if (toasts.length > 0) {
                    expect(toasts[0].type).toBe('info');
                    expect(toasts[0].title).toBe('Information');
                    expect(toasts[0].message).toBe('This is some information');
                    expect(toasts[0].icon).toBe('bi-info-circle-fill');
                    done();
                }
            });
        });
    });

    describe('confirm', () => {
        it('should create a confirm toast with callbacks', (done) => {
            const onConfirm = jasmine.createSpy('onConfirm');
            const onCancel = jasmine.createSpy('onCancel');

            service.confirm('Delete this item?', onConfirm, onCancel);

            service.toasts$.subscribe(toasts => {
                if (toasts.length > 0) {
                    expect(toasts[0].type).toBe('confirm');
                    expect(toasts[0].title).toBe('Confirm Action');
                    expect(toasts[0].message).toBe('Delete this item?');
                    expect(toasts[0].icon).toBe('bi-question-circle-fill');
                    expect(toasts[0].onConfirm).toBe(onConfirm);
                    expect(toasts[0].onCancel).toBe(onCancel);
                    expect(toasts[0].confirmText).toBe('Delete');
                    expect(toasts[0].cancelText).toBe('Cancel');
                    done();
                }
            });
        });

        it('should use custom title when provided', (done) => {
            const onConfirm = jasmine.createSpy('onConfirm');

            service.confirm('Are you sure?', onConfirm, undefined, 'Custom Confirm');

            service.toasts$.subscribe(toasts => {
                if (toasts.length > 0) {
                    expect(toasts[0].title).toBe('Custom Confirm');
                    done();
                }
            });
        });
    });

    describe('confirmAction', () => {
        it('should call onConfirm callback and remove toast', (done) => {
            const onConfirm = jasmine.createSpy('onConfirm');
            service.confirm('Confirm this?', onConfirm);

            service.toasts$.subscribe(toasts => {
                if (toasts.length === 1) {
                    const toastId = toasts[0].id;
                    service.confirmAction(toastId);
                }
                else if (toasts.length === 0) {
                    expect(onConfirm).toHaveBeenCalled();
                    done();
                }
            });
        });

        it('should handle non-existent toast ID gracefully', () => {
            expect(() => service.confirmAction('non-existent-id')).not.toThrow();
        });
    });

    describe('cancelAction', () => {
        it('should call onCancel callback and remove toast', (done) => {
            const onConfirm = jasmine.createSpy('onConfirm');
            const onCancel = jasmine.createSpy('onCancel');
            service.confirm('Confirm this?', onConfirm, onCancel);

            service.toasts$.subscribe(toasts => {
                if (toasts.length === 1) {
                    const toastId = toasts[0].id;
                    service.cancelAction(toastId);
                }
                else if (toasts.length === 0) {
                    expect(onCancel).toHaveBeenCalled();
                    expect(onConfirm).not.toHaveBeenCalled();
                    done();
                }
            });
        });

        it('should remove toast even if onCancel is not provided', (done) => {
            const onConfirm = jasmine.createSpy('onConfirm');
            service.confirm('Confirm this?', onConfirm);

            service.toasts$.subscribe(toasts => {
                if (toasts.length === 1) {
                    const toastId = toasts[0].id;
                    service.cancelAction(toastId);
                }
                else if (toasts.length === 0) {
                    expect(onConfirm).not.toHaveBeenCalled();
                    done();
                }
            });
        });
    });

    describe('removeToast', () => {
        it('should remove a specific toast by ID', (done) => {
            service.showToast({ type: 'info', message: 'Toast 1', duration: 0 });
            service.showToast({ type: 'info', message: 'Toast 2', duration: 0 });
            service.showToast({ type: 'info', message: 'Toast 3', duration: 0 });

            let toastId: string;

            service.toasts$.subscribe(toasts => {
                if (toasts.length === 3) {
                    toastId = toasts[1].id;
                    service.removeToast(toastId);
                }
                else if (toasts.length === 2) {
                    expect(toasts.find(t => t.id === toastId)).toBeUndefined();
                    expect(toasts[0].message).toBe('Toast 1');
                    expect(toasts[1].message).toBe('Toast 3');
                    done();
                }
            });
        });

        it('should handle removal of non-existent toast ID', (done) => {
            service.showToast({ type: 'info', message: 'Test', duration: 0 });

            service.toasts$.subscribe(toasts => {
                if (toasts.length === 1) {
                    expect(() => service.removeToast('non-existent')).not.toThrow();
                    done();
                }
            });
        });
    });

    describe('clearAll', () => {
        it('should remove all toasts', (done) => {
            service.showToast({ type: 'info', message: 'Toast 1', duration: 0 });
            service.showToast({ type: 'success', message: 'Toast 2', duration: 0 });
            service.showToast({ type: 'error', message: 'Toast 3', duration: 0 });

            let hasCleared = false;
            service.toasts$.subscribe(toasts => {
                if (toasts.length === 3 && !hasCleared) {
                    hasCleared = true;
                    service.clearAll();
                }
                else if (toasts.length === 0 && hasCleared) {
                    expect(toasts.length).toBe(0);
                    done();
                }
            });
        });
    });

    describe('toasts$ observable', () => {
        it('should emit updates when toasts are added', (done) => {
            let emissionCount = 0;

            service.toasts$.subscribe(toasts => {
                emissionCount++;

                if (emissionCount === 2) {
                    expect(toasts.length).toBe(1);
                    done();
                }
            });

            service.showToast({ type: 'info', message: 'Test', duration: 0 });
        });

        it('should emit updates when toasts are removed', (done) => {
            service.showToast({ type: 'info', message: 'Test', duration: 100 });

            let emissionCount = 0;
            service.toasts$.subscribe(toasts => {
                emissionCount++;

                if (emissionCount === 3) {
                    // After auto-removal
                    expect(toasts.length).toBe(0);
                    done();
                }
            });
        });
    });
});
