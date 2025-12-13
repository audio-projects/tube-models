import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ToastComponent } from './toast.component';
import { ToastService, Toast } from '../services/toast.service';
import { BehaviorSubject } from 'rxjs';

describe('ToastComponent', () => {
    let component: ToastComponent;
    let fixture: ComponentFixture<ToastComponent>;
    let toastService: jasmine.SpyObj<ToastService>;
    let toastsSubject: BehaviorSubject<Toast[]>;

    const mockToast: Toast = {
        id: 'toast1',
        type: 'success',
        title: 'Success',
        message: 'Operation completed successfully',
        duration: 5000,
        icon: 'bi-check-circle-fill'
    };

    const mockErrorToast: Toast = {
        id: 'toast2',
        type: 'error',
        title: 'Error',
        message: 'An error occurred',
        duration: 7000,
        icon: 'bi-exclamation-triangle-fill'
    };

    const mockConfirmToast: Toast = {
        id: 'toast3',
        type: 'confirm',
        title: 'Confirm Action',
        message: 'Are you sure?',
        duration: 0,
        icon: 'bi-question-circle-fill',
        onConfirm: jasmine.createSpy('onConfirm'),
        onCancel: jasmine.createSpy('onCancel'),
        confirmText: 'Delete',
        cancelText: 'Cancel'
    };

    beforeEach(async () => {
        toastsSubject = new BehaviorSubject<Toast[]>([]);

        const toastServiceSpy = jasmine.createSpyObj('ToastService', [
            'removeToast',
            'confirmAction',
            'cancelAction'
        ], {
            toasts$: toastsSubject.asObservable()
        });

        await TestBed.configureTestingModule({
            imports: [ToastComponent],
            providers: [
                { provide: ToastService, useValue: toastServiceSpy }
            ]
        }).compileComponents();

        toastService = TestBed.inject(ToastService) as jasmine.SpyObj<ToastService>;
        fixture = TestBed.createComponent(ToastComponent);
        component = fixture.componentInstance;
    });

    it('should create', () => {
        // assert
        expect(component).toBeTruthy();
    });

    describe('ngOnInit', () => {
        it('should subscribe to toasts$ and update component toasts', () => {
            // arrange
            const toasts = [mockToast];

            // act
            component.ngOnInit();
            toastsSubject.next(toasts);

            // assert
            expect(component.toasts).toEqual(toasts);
        });

        it('should receive empty toasts array initially', () => {
            // act
            component.ngOnInit();

            // assert
            expect(component.toasts).toEqual([]);
        });

        it('should update toasts when new toast is added', () => {
            // arrange
            component.ngOnInit();

            // act
            toastsSubject.next([mockToast]);

            // assert
            expect(component.toasts.length).toBe(1);
            expect(component.toasts[0]).toEqual(mockToast);
        });

        it('should update toasts when multiple toasts are added', () => {
            // arrange
            component.ngOnInit();

            // act
            toastsSubject.next([mockToast, mockErrorToast]);

            // assert
            expect(component.toasts.length).toBe(2);
            expect(component.toasts).toEqual([mockToast, mockErrorToast]);
        });
    });

    describe('ngOnDestroy', () => {
        it('should unsubscribe from toasts$ subscription', () => {
            // arrange
            component.ngOnInit();
            spyOn(component['subscription'], 'unsubscribe');

            // act
            component.ngOnDestroy();

            // assert
            expect(component['subscription'].unsubscribe).toHaveBeenCalled();
        });
    });

    describe('removeToast', () => {
        it('should call toastService.removeToast with correct id', () => {
            // arrange
            const toastId = 'toast1';

            // act
            component.removeToast(toastId);

            // assert
            expect(toastService.removeToast).toHaveBeenCalledWith(toastId);
        });

        it('should call toastService.removeToast with different ids', () => {
            // act
            component.removeToast('toast1');
            component.removeToast('toast2');

            // assert
            expect(toastService.removeToast).toHaveBeenCalledWith('toast1');
            expect(toastService.removeToast).toHaveBeenCalledWith('toast2');
            expect(toastService.removeToast).toHaveBeenCalledTimes(2);
        });
    });

    describe('confirmAction', () => {
        it('should call toastService.confirmAction with correct id', () => {
            // arrange
            const toastId = 'toast3';

            // act
            component.confirmAction(toastId);

            // assert
            expect(toastService.confirmAction).toHaveBeenCalledWith(toastId);
        });

        it('should call toastService.confirmAction with different ids', () => {
            // act
            component.confirmAction('toast1');
            component.confirmAction('toast2');

            // assert
            expect(toastService.confirmAction).toHaveBeenCalledWith('toast1');
            expect(toastService.confirmAction).toHaveBeenCalledWith('toast2');
            expect(toastService.confirmAction).toHaveBeenCalledTimes(2);
        });
    });

    describe('cancelAction', () => {
        it('should call toastService.cancelAction with correct id', () => {
            // arrange
            const toastId = 'toast3';

            // act
            component.cancelAction(toastId);

            // assert
            expect(toastService.cancelAction).toHaveBeenCalledWith(toastId);
        });

        it('should call toastService.cancelAction with different ids', () => {
            // act
            component.cancelAction('toast1');
            component.cancelAction('toast2');

            // assert
            expect(toastService.cancelAction).toHaveBeenCalledWith('toast1');
            expect(toastService.cancelAction).toHaveBeenCalledWith('toast2');
            expect(toastService.cancelAction).toHaveBeenCalledTimes(2);
        });
    });

    describe('getToastClass', () => {
        it('should return toast-success border-success for success type', () => {
            // act
            const result = component.getToastClass('success');

            // assert
            expect(result).toBe('toast-success border-success');
        });

        it('should return toast-error border-danger for error type', () => {
            // act
            const result = component.getToastClass('error');

            // assert
            expect(result).toBe('toast-error border-danger');
        });

        it('should return toast-warning border-warning for warning type', () => {
            // act
            const result = component.getToastClass('warning');

            // assert
            expect(result).toBe('toast-warning border-warning');
        });

        it('should return toast-info border-info for info type', () => {
            // act
            const result = component.getToastClass('info');

            // assert
            expect(result).toBe('toast-info border-info');
        });

        it('should return toast-confirm border-danger for confirm type', () => {
            // act
            const result = component.getToastClass('confirm');

            // assert
            expect(result).toBe('toast-confirm border-danger');
        });

        it('should return toast-info border-info for unknown type', () => {
            // act
            const result = component.getToastClass('unknown');

            // assert
            expect(result).toBe('toast-info border-info');
        });

        it('should return toast-info border-info for empty string', () => {
            // act
            const result = component.getToastClass('');

            // assert
            expect(result).toBe('toast-info border-info');
        });
    });

    describe('getHeaderClass', () => {
        it('should return toast-header-success bg-success text-white for success type', () => {
            // act
            const result = component.getHeaderClass('success');

            // assert
            expect(result).toBe('toast-header-success bg-success text-white');
        });

        it('should return toast-header-error bg-danger text-white for error type', () => {
            // act
            const result = component.getHeaderClass('error');

            // assert
            expect(result).toBe('toast-header-error bg-danger text-white');
        });

        it('should return toast-header-warning bg-warning text-dark for warning type', () => {
            // act
            const result = component.getHeaderClass('warning');

            // assert
            expect(result).toBe('toast-header-warning bg-warning text-dark');
        });

        it('should return toast-header-info bg-info text-white for info type', () => {
            // act
            const result = component.getHeaderClass('info');

            // assert
            expect(result).toBe('toast-header-info bg-info text-white');
        });

        it('should return toast-header-confirm bg-danger text-white for confirm type', () => {
            // act
            const result = component.getHeaderClass('confirm');

            // assert
            expect(result).toBe('toast-header-confirm bg-danger text-white');
        });

        it('should return toast-header-info bg-info text-white for unknown type', () => {
            // act
            const result = component.getHeaderClass('unknown');

            // assert
            expect(result).toBe('toast-header-info bg-info text-white');
        });

        it('should return toast-header-info bg-info text-white for empty string', () => {
            // act
            const result = component.getHeaderClass('');

            // assert
            expect(result).toBe('toast-header-info bg-info text-white');
        });
    });

    describe('Integration tests', () => {
        it('should display toasts when they are added', () => {
            // arrange
            component.ngOnInit();

            // act
            toastsSubject.next([mockToast, mockErrorToast, mockConfirmToast]);

            // assert
            expect(component.toasts.length).toBe(3);
            expect(component.toasts[0].type).toBe('success');
            expect(component.toasts[1].type).toBe('error');
            expect(component.toasts[2].type).toBe('confirm');
        });

        it('should handle toast removal through service', () => {
            // arrange
            component.ngOnInit();
            toastsSubject.next([mockToast, mockErrorToast]);

            // act
            component.removeToast('toast1');

            // assert
            expect(toastService.removeToast).toHaveBeenCalledWith('toast1');
        });

        it('should handle confirm action through service', () => {
            // arrange
            component.ngOnInit();
            toastsSubject.next([mockConfirmToast]);

            // act
            component.confirmAction('toast3');

            // assert
            expect(toastService.confirmAction).toHaveBeenCalledWith('toast3');
        });

        it('should handle cancel action through service', () => {
            // arrange
            component.ngOnInit();
            toastsSubject.next([mockConfirmToast]);

            // act
            component.cancelAction('toast3');

            // assert
            expect(toastService.cancelAction).toHaveBeenCalledWith('toast3');
        });

        it('should apply correct classes for different toast types', () => {
            // arrange
            const types = ['success', 'error', 'warning', 'info', 'confirm'];
            const expectedToastClasses = [
                'toast-success border-success',
                'toast-error border-danger',
                'toast-warning border-warning',
                'toast-info border-info',
                'toast-confirm border-danger'
            ];
            const expectedHeaderClasses = [
                'toast-header-success bg-success text-white',
                'toast-header-error bg-danger text-white',
                'toast-header-warning bg-warning text-dark',
                'toast-header-info bg-info text-white',
                'toast-header-confirm bg-danger text-white'
            ];

            // act & assert
            types.forEach((type, index) => {
                expect(component.getToastClass(type)).toBe(expectedToastClasses[index]);
                expect(component.getHeaderClass(type)).toBe(expectedHeaderClasses[index]);
            });
        });
    });
});
