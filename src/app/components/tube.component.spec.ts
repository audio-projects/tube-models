import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TubeComponent } from './tube.component';
import { ActivatedRoute, Router } from '@angular/router';
import { FirebaseTubeService } from '../services/firebase-tube.service';
import { AuthService } from '../services/auth.service';
import { AnalyticsService } from '../services/analytics.service';
import { ToastService } from '../services/toast.service';
import { TubeInformation } from './tube-information';
import { File as TubeFile } from '../files';
import { of, throwError } from 'rxjs';
import { User } from '@angular/fire/auth';

describe('TubeComponent', () => {
    let component: TubeComponent;
    let fixture: ComponentFixture<TubeComponent>;
    let firebaseTubeService: jasmine.SpyObj<FirebaseTubeService>;
    let authService: jasmine.SpyObj<AuthService>;
    let analyticsService: jasmine.SpyObj<AnalyticsService>;
    let toastService: jasmine.SpyObj<ToastService>;
    let router: jasmine.SpyObj<Router>;
    let route: ActivatedRoute;

    const mockUser: User = {
        uid: 'user123',
        email: 'test@example.com',
        displayName: 'Test User'
    } as User;

    const mockTube: TubeInformation = {
        id: 'tube1',
        name: 'ECC83',
        manufacturer: 'Mullard',
        type: 'Triode',
        comments: 'Test triode',
        lastUpdatedOn: '2023-10-01',
        files: [],
        owner: 'user123'
    };

    const mockTubeFile: TubeFile = {
        name: 'test.utd',
        measurementType: 'IP_VA_VG_VH',
        measurementTypeLabel: 'Plate Current vs Plate/Grid Voltage',
        egOffset: 0,
        series: [
            {
                eg: -1,
                points: [
                    { index: 1, ip: 0.5, eg: -1, ep: 100, es: 0, is: 0, eh: 6.3 },
                    { index: 2, ip: 1.0, eg: -1, ep: 150, es: 0, is: 0, eh: 6.3 }
                ]
            }
        ]
    };

    beforeEach(async () => {
        const firebaseTubeServiceSpy = jasmine.createSpyObj('FirebaseTubeService', [
            'getTubeById',
            'saveTube',
            'updateTube',
            'deleteTube',
            'isOwner'
        ]);
        const authServiceSpy = jasmine.createSpyObj('AuthService', [
            'isAuthenticated',
            'getCurrentUser'
        ]);
        const analyticsServiceSpy = jasmine.createSpyObj('AnalyticsService', [
            'logTubeView',
            'logTubeSave',
            'logTubeUpload',
            'logPlotGeneration',
            'logParameterCalculation'
        ]);
        const toastServiceSpy = jasmine.createSpyObj('ToastService', [
            'success',
            'error',
            'warning',
            'info',
            'confirm'
        ]);
        const routerSpy = jasmine.createSpyObj('Router', ['navigate']);

        const mockActivatedRoute = {
            snapshot: {
                paramMap: {
                    get: jasmine.createSpy('get').and.returnValue('tube1')
                }
            }
        };

        await TestBed.configureTestingModule({
            imports: [TubeComponent],
            providers: [
                { provide: FirebaseTubeService, useValue: firebaseTubeServiceSpy },
                { provide: AuthService, useValue: authServiceSpy },
                { provide: AnalyticsService, useValue: analyticsServiceSpy },
                { provide: ToastService, useValue: toastServiceSpy },
                { provide: Router, useValue: routerSpy },
                { provide: ActivatedRoute, useValue: mockActivatedRoute }
            ]
        }).compileComponents();

        firebaseTubeService = TestBed.inject(FirebaseTubeService) as jasmine.SpyObj<FirebaseTubeService>;
        authService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
        analyticsService = TestBed.inject(AnalyticsService) as jasmine.SpyObj<AnalyticsService>;
        toastService = TestBed.inject(ToastService) as jasmine.SpyObj<ToastService>;
        router = TestBed.inject(Router) as jasmine.SpyObj<Router>;
        route = TestBed.inject(ActivatedRoute);
        fixture = TestBed.createComponent(TubeComponent);
        component = fixture.componentInstance;
    });

    it('should create', () => {
        // assert
        expect(component).toBeTruthy();
    });

    describe('ngOnInit', () => {
        it('should load existing tube when tubeId is provided', () => {
            // arrange
            firebaseTubeService.getTubeById.and.returnValue(of(mockTube));

            // act
            component.ngOnInit();

            // assert
            expect(component.tubeId).toBe('tube1');
            expect(component.isNewTube).toBe(false);
            expect(firebaseTubeService.getTubeById).toHaveBeenCalledWith('tube1');
            expect(analyticsService.logTubeView).toHaveBeenCalledWith('tube1', 'ECC83');
        });

        it('should create new tube when tubeId is "new"', () => {
            // arrange
            (route.snapshot.paramMap.get as jasmine.Spy).and.returnValue('new');
            authService.getCurrentUser.and.returnValue(mockUser);

            // act
            component.ngOnInit();

            // assert
            expect(component.isNewTube).toBe(true);
            expect(component.tube).toBeTruthy();
            expect(component.tube?.name).toBe('');
            expect(component.tube?.type).toBe('Triode');
            expect(component.tube?.owner).toBe('user123');
        });

        it('should handle error when tube not found', () => {
            // arrange
            firebaseTubeService.getTubeById.and.returnValue(of(null));
            spyOn(console, 'error');

            // act
            component.ngOnInit();

            // assert
            expect(console.error).toHaveBeenCalledWith('Tube not found');
            expect(toastService.error).toHaveBeenCalledWith('Tube not found');
            expect(router.navigate).toHaveBeenCalledWith(['/tube']);
        });

        it('should handle error when loading tube fails', () => {
            // arrange
            const error = new Error('Load error');
            firebaseTubeService.getTubeById.and.returnValue(throwError(() => error));
            spyOn(console, 'error');

            // act
            component.ngOnInit();

            // assert
            expect(console.error).toHaveBeenCalledWith('Error loading tube:', error);
            expect(toastService.error).toHaveBeenCalledWith('Error loading tube');
            expect(router.navigate).toHaveBeenCalledWith(['/tube']);
        });

        it('should navigate to tube list when no tubeId provided', () => {
            // arrange
            (route.snapshot.paramMap.get as jasmine.Spy).and.returnValue(null);
            spyOn(console, 'error');

            // act
            component.ngOnInit();

            // assert
            expect(console.error).toHaveBeenCalledWith('No tube ID provided');
            expect(router.navigate).toHaveBeenCalledWith(['/tube']);
        });
    });

    describe('saveTube', () => {
        beforeEach(() => {
            component.tube = { ...mockTube };
            authService.isAuthenticated.and.returnValue(true);
        });

        it('should save new tube', () => {
            // arrange
            component.isNewTube = true;
            component.tube = { ...mockTube, id: '' };
            const savedTube = { ...mockTube, id: 'newId' };
            firebaseTubeService.saveTube.and.returnValue(of(savedTube));
            spyOn(console, 'log');

            // act
            component.saveTube();

            // assert
            expect(firebaseTubeService.saveTube).toHaveBeenCalled();
            expect(console.log).toHaveBeenCalledWith('Tube saved successfully:', savedTube);
            expect(toastService.success).toHaveBeenCalledWith('Tube "ECC83" created successfully!');
            expect(analyticsService.logTubeSave).toHaveBeenCalledWith('newId', false);
            expect(router.navigate).toHaveBeenCalledWith(['/tube', 'newId']);
        });

        it('should update existing tube', () => {
            // arrange
            component.isNewTube = false;
            const updatedTube = { ...mockTube };
            firebaseTubeService.updateTube.and.returnValue(of(updatedTube));
            spyOn(console, 'log');

            // act
            component.saveTube();

            // assert
            expect(firebaseTubeService.updateTube).toHaveBeenCalledWith(mockTube);
            expect(console.log).toHaveBeenCalledWith('Tube updated successfully:', updatedTube);
            expect(toastService.success).toHaveBeenCalledWith('Tube "ECC83" updated successfully!');
            expect(analyticsService.logTubeSave).toHaveBeenCalledWith('tube1', true);
        });

        it('should not save when tube is null', () => {
            // arrange
            component.tube = null;

            // act
            component.saveTube();

            // assert
            expect(firebaseTubeService.saveTube).not.toHaveBeenCalled();
            expect(firebaseTubeService.updateTube).not.toHaveBeenCalled();
        });

        it('should show error when user is not authenticated', () => {
            // arrange
            authService.isAuthenticated.and.returnValue(false);

            // act
            component.saveTube();

            // assert
            expect(toastService.error).toHaveBeenCalledWith('You must be signed in to save tubes.');
            expect(firebaseTubeService.saveTube).not.toHaveBeenCalled();
        });

        it('should validate required tube name', () => {
            // arrange
            component.tube!.name = '';

            // act
            component.saveTube();

            // assert
            expect(toastService.error).toHaveBeenCalledWith('Tube name is required.');
            expect(firebaseTubeService.saveTube).not.toHaveBeenCalled();
        });

        it('should validate tube name is not whitespace only', () => {
            // arrange
            component.tube!.name = '   ';

            // act
            component.saveTube();

            // assert
            expect(toastService.error).toHaveBeenCalledWith('Tube name is required.');
            expect(firebaseTubeService.saveTube).not.toHaveBeenCalled();
        });

        it('should handle error when saving new tube fails', () => {
            // arrange
            component.isNewTube = true;
            component.tube = { ...mockTube, id: '' };
            const error = new Error('Save error');
            firebaseTubeService.saveTube.and.returnValue(throwError(() => error));
            spyOn(console, 'error');

            // act
            component.saveTube();

            // assert
            expect(console.error).toHaveBeenCalledWith('Error saving tube:', error);
            expect(toastService.error).toHaveBeenCalledWith('Error saving tube. Please try again.');
        });

        it('should handle error when updating tube fails', () => {
            // arrange
            component.isNewTube = false;
            const error = new Error('Update error');
            firebaseTubeService.updateTube.and.returnValue(throwError(() => error));
            spyOn(console, 'error');

            // act
            component.saveTube();

            // assert
            expect(console.error).toHaveBeenCalledWith('Error updating tube:', error);
            expect(toastService.error).toHaveBeenCalledWith('Error updating tube. Please try again.');
        });
    });

    describe('deleteTube', () => {
        beforeEach(() => {
            component.tube = { ...mockTube };
            authService.isAuthenticated.and.returnValue(true);
            firebaseTubeService.isOwner.and.returnValue(true);
        });

        it('should delete tube when user is owner', () => {
            // arrange
            firebaseTubeService.deleteTube.and.returnValue(of(true));
            let confirmCallback: (() => void) | undefined;
            toastService.confirm.and.callFake((message: string, onConfirm: () => void) => {
                confirmCallback = onConfirm;
            });
            spyOn(console, 'log');

            // act
            component.deleteTube();
            if (confirmCallback) {
                confirmCallback();
            }

            // assert
            expect(toastService.confirm).toHaveBeenCalled();
            expect(console.log).toHaveBeenCalledWith('Tube "ECC83" deleted successfully');
            expect(toastService.success).toHaveBeenCalledWith('Tube "ECC83" deleted successfully!');
            expect(router.navigate).toHaveBeenCalledWith(['/tube']);
        });

        it('should not delete when tube is null', () => {
            // arrange
            component.tube = null;

            // act
            component.deleteTube();

            // assert
            expect(toastService.confirm).not.toHaveBeenCalled();
            expect(firebaseTubeService.deleteTube).not.toHaveBeenCalled();
        });

        it('should not delete when tube has no id', () => {
            // arrange
            component.tube = { ...mockTube, id: '' };

            // act
            component.deleteTube();

            // assert
            expect(toastService.confirm).not.toHaveBeenCalled();
            expect(firebaseTubeService.deleteTube).not.toHaveBeenCalled();
        });

        it('should show error when user is not authenticated', () => {
            // arrange
            authService.isAuthenticated.and.returnValue(false);

            // act
            component.deleteTube();

            // assert
            expect(toastService.error).toHaveBeenCalledWith('You must be signed in to delete tubes.');
            expect(toastService.confirm).not.toHaveBeenCalled();
        });

        it('should show error when user is not owner', () => {
            // arrange
            firebaseTubeService.isOwner.and.returnValue(false);

            // act
            component.deleteTube();

            // assert
            expect(toastService.error).toHaveBeenCalledWith('You can only delete tubes that you created.');
            expect(toastService.confirm).not.toHaveBeenCalled();
        });

        it('should handle error when deletion fails', () => {
            // arrange
            const error = new Error('Delete error');
            firebaseTubeService.deleteTube.and.returnValue(throwError(() => error));
            let confirmCallback: (() => void) | undefined;
            toastService.confirm.and.callFake((message: string, onConfirm: () => void) => {
                confirmCallback = onConfirm;
            });
            spyOn(console, 'error');

            // act
            component.deleteTube();
            if (confirmCallback) {
                confirmCallback();
            }

            // assert
            expect(console.error).toHaveBeenCalledWith('Error deleting tube:', error);
            expect(toastService.error).toHaveBeenCalledWith('Error deleting tube. Please try again.');
        });
    });

    describe('resetForm', () => {
        it('should create new tube when isNewTube is true', () => {
            // arrange
            component.isNewTube = true;
            authService.getCurrentUser.and.returnValue(mockUser);

            // act
            component.resetForm();

            // assert
            expect(component.tube).toBeTruthy();
            expect(component.tube?.name).toBe('');
            expect(component.tube?.type).toBe('Triode');
        });

        it('should reload tube when isNewTube is false', () => {
            // arrange
            component.isNewTube = false;
            component.tubeId = 'tube1';
            firebaseTubeService.getTubeById.and.returnValue(of(mockTube));

            // act
            component.resetForm();

            // assert
            expect(firebaseTubeService.getTubeById).toHaveBeenCalledWith('tube1');
        });
    });

    describe('isFormValid', () => {
        it('should return true when tube has name and type', () => {
            // arrange
            component.tube = { ...mockTube };

            // act
            const isValid = component.isFormValid();

            // assert
            expect(isValid).toBe(true);
        });

        it('should return false when tube is null', () => {
            // arrange
            component.tube = null;

            // act
            const isValid = component.isFormValid();

            // assert
            expect(isValid).toBe(false);
        });

        it('should return false when tube has no name', () => {
            // arrange
            component.tube = { ...mockTube, name: '' };

            // act
            const isValid = component.isFormValid();

            // assert
            expect(isValid).toBe(false);
        });

        it('should return false when tube has no type', () => {
            // arrange
            component.tube = { ...mockTube, type: '' as 'Triode' | 'Pentode' | 'Tetrode' };

            // act
            const isValid = component.isFormValid();

            // assert
            expect(isValid).toBe(false);
        });
    });

    describe('getTypeBadgeClass', () => {
        it('should return bg-success for Triode', () => {
            // act
            const badgeClass = component.getTypeBadgeClass('Triode');

            // assert
            expect(badgeClass).toBe('bg-success');
        });

        it('should return bg-info for Pentode', () => {
            // act
            const badgeClass = component.getTypeBadgeClass('Pentode');

            // assert
            expect(badgeClass).toBe('bg-info');
        });

        it('should return bg-warning text-dark for Tetrode', () => {
            // act
            const badgeClass = component.getTypeBadgeClass('Tetrode');

            // assert
            expect(badgeClass).toBe('bg-warning text-dark');
        });

        it('should return bg-secondary for unknown type', () => {
            // act
            const badgeClass = component.getTypeBadgeClass('Unknown');

            // assert
            expect(badgeClass).toBe('bg-secondary');
        });
    });

    describe('formatDate', () => {
        it('should format date string correctly', () => {
            // arrange
            const dateString = '2023-10-15';

            // act
            const formatted = component.formatDate(dateString);

            // assert
            expect(formatted).toMatch(/October 1\d, 2023/);
        });
    });

    describe('canSave', () => {
        it('should return true when user is authenticated', () => {
            // arrange
            authService.isAuthenticated.and.returnValue(true);

            // act
            const result = component.canSave();

            // assert
            expect(result).toBe(true);
        });

        it('should return false when user is not authenticated', () => {
            // arrange
            authService.isAuthenticated.and.returnValue(false);

            // act
            const result = component.canSave();

            // assert
            expect(result).toBe(false);
        });
    });

    describe('canDelete', () => {
        it('should return true when user is authenticated and is owner', () => {
            // arrange
            component.tube = { ...mockTube };
            component.isNewTube = false;
            authService.isAuthenticated.and.returnValue(true);
            firebaseTubeService.isOwner.and.returnValue(true);

            // act
            const result = component.canDelete();

            // assert
            expect(result).toBe(true);
        });

        it('should return false when user is not authenticated', () => {
            // arrange
            component.tube = { ...mockTube };
            authService.isAuthenticated.and.returnValue(false);

            // act
            const result = component.canDelete();

            // assert
            expect(result).toBe(false);
        });

        it('should return false when tube is null', () => {
            // arrange
            component.tube = null;
            authService.isAuthenticated.and.returnValue(true);

            // act
            const result = component.canDelete();

            // assert
            expect(result).toBe(false);
        });

        it('should return false when isNewTube is true', () => {
            // arrange
            component.tube = { ...mockTube };
            component.isNewTube = true;
            authService.isAuthenticated.and.returnValue(true);

            // act
            const result = component.canDelete();

            // assert
            expect(result).toBe(false);
        });

        it('should return false when user is not owner', () => {
            // arrange
            component.tube = { ...mockTube };
            component.isNewTube = false;
            authService.isAuthenticated.and.returnValue(true);
            firebaseTubeService.isOwner.and.returnValue(false);

            // act
            const result = component.canDelete();

            // assert
            expect(result).toBe(false);
        });
    });

    describe('duplicateTube', () => {
        it('should show info toast for future implementation', () => {
            // arrange
            component.tube = { ...mockTube };

            // act
            component.duplicateTube();

            // assert
            expect(toastService.info).toHaveBeenCalledWith('Duplicate functionality will be implemented in future updates.');
        });

        it('should not show toast when tube is null', () => {
            // arrange
            component.tube = null;

            // act
            component.duplicateTube();

            // assert
            expect(toastService.info).not.toHaveBeenCalled();
        });
    });

    describe('exportTube', () => {
        it('should export tube as JSON file', () => {
            // arrange
            component.tube = { ...mockTube };
            const mockAnchor = {
                href: '',
                download: '',
                click: jasmine.createSpy('click')
            } as unknown as HTMLAnchorElement;
            const createElementSpy = spyOn(document, 'createElement').and.returnValue(mockAnchor);
            const createObjectURLSpy = spyOn(URL, 'createObjectURL').and.returnValue('blob:url');
            const revokeObjectURLSpy = spyOn(URL, 'revokeObjectURL');
            spyOn(document.body, 'appendChild');
            spyOn(document.body, 'removeChild');

            // act
            component.exportTube();

            // assert
            expect(createElementSpy).toHaveBeenCalledWith('a');
            expect(createObjectURLSpy).toHaveBeenCalled();
            expect(revokeObjectURLSpy).toHaveBeenCalledWith('blob:url');
            expect(toastService.success).toHaveBeenCalledWith('Tube "ECC83" exported successfully!', 'Export Complete');
        });

        it('should not export when tube is null', () => {
            // arrange
            component.tube = null;
            const createElementSpy = spyOn(document, 'createElement');

            // act
            component.exportTube();

            // assert
            expect(createElementSpy).not.toHaveBeenCalled();
        });
    });

    describe('removeFile', () => {
        beforeEach(() => {
            component.tube = { ...mockTube, files: [mockTubeFile] };
        });

        it('should remove file after confirmation', () => {
            // arrange
            let confirmCallback: (() => void) | undefined;
            toastService.confirm.and.callFake((message: string, onConfirm: () => void) => {
                confirmCallback = onConfirm;
            });

            // act
            component.removeFile(0);
            if (confirmCallback) {
                confirmCallback();
            }

            // assert
            expect(toastService.confirm).toHaveBeenCalled();
            expect(component.tube?.files.length).toBe(0);
            expect(toastService.success).toHaveBeenCalledWith('File "test.utd" removed successfully.');
        });

        it('should not remove file with invalid index', () => {
            // arrange
            const initialLength = component.tube!.files.length;

            // act
            component.removeFile(-1);

            // assert
            expect(component.tube?.files.length).toBe(initialLength);
            expect(toastService.confirm).not.toHaveBeenCalled();
        });

        it('should not remove file when index is out of bounds', () => {
            // arrange
            const initialLength = component.tube!.files.length;

            // act
            component.removeFile(10);

            // assert
            expect(component.tube?.files.length).toBe(initialLength);
            expect(toastService.confirm).not.toHaveBeenCalled();
        });

        it('should not remove when tube is null', () => {
            // arrange
            component.tube = null;

            // act
            component.removeFile(0);

            // assert
            expect(toastService.confirm).not.toHaveBeenCalled();
        });
    });

    describe('viewFileData', () => {
        it('should display file information', () => {
            // arrange
            spyOn(console, 'log');

            // act
            component.viewFileData(mockTubeFile);

            // assert
            expect(console.log).toHaveBeenCalled();
            expect(toastService.info).toHaveBeenCalledWith(
                jasmine.stringContaining('test.utd'),
                'File Information'
            );
        });

        it('should include grid offset in message when egOffset is not zero', () => {
            // arrange
            const fileWithOffset = { ...mockTubeFile, egOffset: 5 };

            // act
            component.viewFileData(fileWithOffset);

            // assert
            expect(toastService.info).toHaveBeenCalledWith(
                jasmine.stringContaining('Grid Offset: 5V'),
                'File Information'
            );
        });
    });

    describe('getTotalPointsCount', () => {
        it('should return total points count', () => {
            // act
            const count = component.getTotalPointsCount(mockTubeFile);

            // assert
            expect(count).toBe(2);
        });

        it('should return zero for file with no series', () => {
            // arrange
            const emptyFile = { ...mockTubeFile, series: [] };

            // act
            const count = component.getTotalPointsCount(emptyFile);

            // assert
            expect(count).toBe(0);
        });
    });

    describe('plotFile', () => {
        it('should select file and switch to plot tab', () => {
            // act
            component.plotFile(mockTubeFile);

            // assert
            expect(component.selectedFileForPlot).toBe(mockTubeFile);
            expect(component.activeTab).toBe('plot');
            expect(analyticsService.logPlotGeneration).toHaveBeenCalled();
        });

        it('should show warning for unknown measurement type', () => {
            // arrange
            const unknownFile = { ...mockTubeFile, measurementType: 'UNKNOWN' };

            // act
            component.plotFile(unknownFile);

            // assert
            expect(toastService.warning).toHaveBeenCalledWith(
                'Cannot plot file: measurement type could not be determined. Please check the file format.',
                'Unknown File Type'
            );
            expect(component.selectedFileForPlot).toBeNull();
        });
    });

    describe('selectFileForPlot', () => {
        it('should select file for plotting', () => {
            // act
            component.selectFileForPlot(mockTubeFile);

            // assert
            expect(component.selectedFileForPlot).toBe(mockTubeFile);
        });

        it('should show warning for unknown measurement type', () => {
            // arrange
            const unknownFile = { ...mockTubeFile, measurementType: 'UNKNOWN' };

            // act
            component.selectFileForPlot(unknownFile);

            // assert
            expect(toastService.warning).toHaveBeenCalled();
            expect(component.selectedFileForPlot).toBeNull();
        });
    });

    describe('clearSelectedFile', () => {
        it('should clear selected file', () => {
            // arrange
            component.selectedFileForPlot = mockTubeFile;

            // act
            component.clearSelectedFile();

            // assert
            expect(component.selectedFileForPlot).toBeNull();
        });
    });

    describe('Tab management', () => {
        it('should set active tab', () => {
            // act
            component.setActiveTab('plot');

            // assert
            expect(component.activeTab).toBe('plot');
        });

        it('should check if tab is active', () => {
            // arrange
            component.activeTab = 'plot';

            // act & assert
            expect(component.isTabActive('plot')).toBe(true);
            expect(component.isTabActive('upload')).toBe(false);
        });
    });

    describe('Electrical Specifications', () => {
        it('should toggle electrical specs expanded state', () => {
            // arrange
            component.isElectricalSpecsExpanded = false;

            // act
            component.toggleElectricalSpecs();

            // assert
            expect(component.isElectricalSpecsExpanded).toBe(true);

            // act
            component.toggleElectricalSpecs();

            // assert
            expect(component.isElectricalSpecsExpanded).toBe(false);
        });

        it('should open datasheet URL in new tab', () => {
            // arrange
            component.tube = { ...mockTube, datasheetUrl: 'https://example.com/datasheet' };
            spyOn(window, 'open');

            // act
            component.openDatasheetUrl();

            // assert
            expect(window.open).toHaveBeenCalledWith('https://example.com/datasheet', '_blank');
        });

        it('should not open when datasheetUrl is undefined', () => {
            // arrange
            component.tube = { ...mockTube, datasheetUrl: undefined };
            spyOn(window, 'open');

            // act
            component.openDatasheetUrl();

            // assert
            expect(window.open).not.toHaveBeenCalled();
        });
    });
});
