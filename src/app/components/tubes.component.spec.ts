import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TubesComponent } from './tubes.component';
import { FirebaseTubeService } from '../services/firebase-tube.service';
import { AuthService } from '../services/auth.service';
import { ToastService } from '../services/toast.service';
import { TubeInformation } from './tube-information';
import { of, throwError } from 'rxjs';
import { User } from '@angular/fire/auth';
import { ActivatedRoute } from '@angular/router';

describe('TubesComponent', () => {
    let component: TubesComponent;
    let fixture: ComponentFixture<TubesComponent>;
    let firebaseTubeService: jasmine.SpyObj<FirebaseTubeService>;
    let authService: jasmine.SpyObj<AuthService>;
    let toastService: jasmine.SpyObj<ToastService>;

    const mockUser: User = {
        uid: 'user123',
        email: 'test@example.com',
        displayName: 'Test User'    } as User;

    const mockActivatedRoute = {
        snapshot: { params: {} },
        queryParams: of({})    };

    const mockTubes: TubeInformation[] = [
        {
            id: '1',
            name: 'ECC83',
            manufacturer: 'Mullard',
            type: 'Triode',
            comments: 'Test triode',
            lastUpdatedOn: '2023-10-01T12:00:00Z',
            files: [],
            owner: 'user123'
        },
        {
            id: '2',
            name: 'EL84',
            manufacturer: 'Telefunken',
            type: 'Pentode',
            comments: 'Test pentode',
            lastUpdatedOn: '2023-10-02T12:00:00Z',
            files: [],
            owner: 'user456'
        },
        {
            id: '3',
            name: '6L6',
            manufacturer: 'RCA',
            type: 'Tetrode',
            comments: 'Test tetrode',
            lastUpdatedOn: '2023-10-03T12:00:00Z',
            files: [],
            owner: 'user123'
        },
        {
            id: '4',
            name: 'ECC82',
            manufacturer: 'Mullard',
            type: 'Triode',
            comments: 'Another triode',
            lastUpdatedOn: '2023-10-04T12:00:00Z',
            files: [],
            owner: 'user456'
        }
    ];

    beforeEach(async () => {
        const firebaseTubeServiceSpy = jasmine.createSpyObj('FirebaseTubeService', [
            'getTubes',
            'deleteTube'
        ]);
        const authServiceSpy = jasmine.createSpyObj('AuthService', [
            'isAuthenticated',
            'getCurrentUser'
        ]);
        const toastServiceSpy = jasmine.createSpyObj('ToastService', [
            'success',
            'error',
            'warning',
            'info',
            'confirm'
        ]);

        await TestBed.configureTestingModule({
            imports: [TubesComponent],
            providers: [
                { provide: FirebaseTubeService, useValue: firebaseTubeServiceSpy },
                { provide: AuthService, useValue: authServiceSpy },
                { provide: ToastService, useValue: toastServiceSpy },
                { provide: ActivatedRoute, useValue: mockActivatedRoute }
            ]
        }).compileComponents();

        firebaseTubeService = TestBed.inject(FirebaseTubeService) as jasmine.SpyObj<FirebaseTubeService>;
        authService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
        toastService = TestBed.inject(ToastService) as jasmine.SpyObj<ToastService>;
        fixture = TestBed.createComponent(TubesComponent);
        component = fixture.componentInstance;
    });

    it('should create', () => {
        // assert
        expect(component).toBeTruthy();
    });

    describe('ngOnInit', () => {
        it('should subscribe to tubes from Firebase on init', () => {
            // arrange
            firebaseTubeService.getTubes.and.returnValue(of(mockTubes));

            // act
            component.ngOnInit();

            // assert
            expect(firebaseTubeService.getTubes).toHaveBeenCalled();
            expect(component.tubes).toEqual(mockTubes);
            expect(component.filteredTubes).toEqual(mockTubes);
        });

        it('should handle error when loading tubes fails', () => {
            // arrange
            const error = new Error('Firebase error');
            firebaseTubeService.getTubes.and.returnValue(throwError(() => error));
            spyOn(console, 'error');

            // act
            component.ngOnInit();

            // assert
            expect(console.error).toHaveBeenCalledWith('Error loading tubes from Firebase:', error);
            expect(toastService.error).toHaveBeenCalledWith('Error loading tubes from database. Please check your connection.');
        });
    });

    describe('ngOnDestroy', () => {
        it('should unsubscribe from tubes subscription on destroy', () => {
            // arrange
            firebaseTubeService.getTubes.and.returnValue(of(mockTubes));
            component.ngOnInit();
            const subscription = component['tubesSubscription'];
            spyOn(subscription!, 'unsubscribe');

            // act
            component.ngOnDestroy();

            // assert
            expect(subscription!.unsubscribe).toHaveBeenCalled();
        });

        it('should not throw error if subscription is undefined', () => {
            // arrange
            component['tubesSubscription'] = undefined;

            // act & assert
            expect(() => component.ngOnDestroy()).not.toThrow();
        });
    });

    describe('refreshTubes', () => {
        it('should refresh tubes from Firebase', () => {
            // arrange
            firebaseTubeService.getTubes.and.returnValue(of(mockTubes));
            spyOn(console, 'log');

            // act
            component.refreshTubes();

            // assert
            expect(console.log).toHaveBeenCalledWith('Refreshing tubes from Firebase...');
            expect(firebaseTubeService.getTubes).toHaveBeenCalled();
            expect(component.tubes).toEqual(mockTubes);
            expect(toastService.success).toHaveBeenCalledWith('Loaded 4 tubes from database');
        });

        it('should unsubscribe from existing subscription before refreshing', () => {
            // arrange
            firebaseTubeService.getTubes.and.returnValue(of(mockTubes));
            component.ngOnInit();
            const oldSubscription = component['tubesSubscription'];
            spyOn(oldSubscription!, 'unsubscribe');

            // act
            component.refreshTubes();

            // assert
            expect(oldSubscription!.unsubscribe).toHaveBeenCalled();
        });

        it('should handle error when refreshing tubes fails', () => {
            // arrange
            const error = new Error('Refresh error');
            firebaseTubeService.getTubes.and.returnValue(throwError(() => error));
            spyOn(console, 'error');

            // act
            component.refreshTubes();

            // assert
            expect(console.error).toHaveBeenCalledWith('Error refreshing tubes:', error);
            expect(toastService.error).toHaveBeenCalledWith('Error refreshing tubes. Please try again.');
        });
    });

    describe('getCountByType', () => {
        beforeEach(() => {
            component.tubes = mockTubes;
        });

        it('should return count of triodes', () => {
            // act
            const count = component.getCountByType('Triode');

            // assert
            expect(count).toBe(2);
        });

        it('should return count of pentodes', () => {
            // act
            const count = component.getCountByType('Pentode');

            // assert
            expect(count).toBe(1);
        });

        it('should return count of tetrodes', () => {
            // act
            const count = component.getCountByType('Tetrode');

            // assert
            expect(count).toBe(1);
        });

        it('should return zero for non-existent type', () => {
            // act
            const count = component.getCountByType('NonExistent');

            // assert
            expect(count).toBe(0);
        });
    });

    describe('isMyTube', () => {
        it('should return true for tube owned by current user', () => {
            // arrange
            authService.isAuthenticated.and.returnValue(true);
            authService.getCurrentUser.and.returnValue(mockUser);
            const tube = mockTubes[0]; // owner: 'user123'

            // act
            const result = component.isMyTube(tube);

            // assert
            expect(result).toBe(true);
        });

        it('should return false for tube not owned by current user', () => {
            // arrange
            authService.isAuthenticated.and.returnValue(true);
            authService.getCurrentUser.and.returnValue(mockUser);
            const tube = mockTubes[1]; // owner: 'user456'

            // act
            const result = component.isMyTube(tube);

            // assert
            expect(result).toBe(false);
        });

        it('should return false when user is not authenticated', () => {
            // arrange
            authService.isAuthenticated.and.returnValue(false);
            const tube = mockTubes[0];

            // act
            const result = component.isMyTube(tube);

            // assert
            expect(result).toBe(false);
        });

        it('should return false when current user is null', () => {
            // arrange
            authService.isAuthenticated.and.returnValue(true);
            authService.getCurrentUser.and.returnValue(null);
            const tube = mockTubes[0];

            // act
            const result = component.isMyTube(tube);

            // assert
            expect(result).toBe(false);
        });
    });

    describe('getUniqueManufacturers', () => {
        beforeEach(() => {
            component.tubes = mockTubes;
        });

        it('should return sorted unique manufacturers', () => {
            // act
            const manufacturers = component.getUniqueManufacturers();

            // assert
            expect(manufacturers).toEqual(['Mullard', 'RCA', 'Telefunken']);
        });

        it('should return empty array when no tubes', () => {
            // arrange
            component.tubes = [];

            // act
            const manufacturers = component.getUniqueManufacturers();

            // assert
            expect(manufacturers).toEqual([]);
        });

        it('should handle single manufacturer', () => {
            // arrange
            component.tubes = [mockTubes[0]];

            // act
            const manufacturers = component.getUniqueManufacturers();

            // assert
            expect(manufacturers).toEqual(['Mullard']);
        });
    });

    describe('filterTubes', () => {
        beforeEach(() => {
            component.tubes = mockTubes;
        });

        it('should filter tubes by search term in name', () => {
            // arrange
            component.searchTerm = 'ECC83';

            // act
            component.filterTubes();

            // assert
            expect(component.filteredTubes.length).toBe(1);
            expect(component.filteredTubes[0].name).toBe('ECC83');
        });

        it('should filter tubes by search term in manufacturer', () => {
            // arrange
            component.searchTerm = 'Mullard';

            // act
            component.filterTubes();

            // assert
            expect(component.filteredTubes.length).toBe(2);
            expect(component.filteredTubes.every(t => t.manufacturer === 'Mullard')).toBe(true);
        });

        it('should filter tubes by search term in comments', () => {
            // arrange
            component.searchTerm = 'pentode';

            // act
            component.filterTubes();

            // assert
            expect(component.filteredTubes.length).toBe(1);
            expect(component.filteredTubes[0].name).toBe('EL84');
        });

        it('should filter tubes by type', () => {
            // arrange
            component.selectedType = 'Triode';

            // act
            component.filterTubes();

            // assert
            expect(component.filteredTubes.length).toBe(2);
            expect(component.filteredTubes.every(t => t.type === 'Triode')).toBe(true);
        });

        it('should filter tubes by manufacturer', () => {
            // arrange
            component.selectedManufacturer = 'RCA';

            // act
            component.filterTubes();

            // assert
            expect(component.filteredTubes.length).toBe(1);
            expect(component.filteredTubes[0].manufacturer).toBe('RCA');
        });

        it('should filter by ownership when user is authenticated and selectedOwnership is mine', () => {
            // arrange
            authService.isAuthenticated.and.returnValue(true);
            authService.getCurrentUser.and.returnValue(mockUser);
            component.selectedOwnership = 'mine';

            // act
            component.filterTubes();

            // assert
            expect(component.filteredTubes.length).toBe(2);
            expect(component.filteredTubes.every(t => t.owner === 'user123')).toBe(true);
        });

        it('should filter by ownership when user is authenticated and selectedOwnership is others', () => {
            // arrange
            authService.isAuthenticated.and.returnValue(true);
            authService.getCurrentUser.and.returnValue(mockUser);
            component.selectedOwnership = 'others';

            // act
            component.filterTubes();

            // assert
            expect(component.filteredTubes.length).toBe(2);
            expect(component.filteredTubes.every(t => t.owner !== 'user123')).toBe(true);
        });

        it('should not filter by ownership when user is not authenticated', () => {
            // arrange
            authService.isAuthenticated.and.returnValue(false);
            component.selectedOwnership = 'mine';

            // act
            component.filterTubes();

            // assert
            expect(component.filteredTubes.length).toBe(4);
        });

        it('should combine multiple filters', () => {
            // arrange
            component.searchTerm = 'Mullard';
            component.selectedType = 'Triode';

            // act
            component.filterTubes();

            // assert
            expect(component.filteredTubes.length).toBe(2);
            expect(component.filteredTubes.every(t => t.manufacturer === 'Mullard' && t.type === 'Triode')).toBe(true);
        });

        it('should be case-insensitive for search term', () => {
            // arrange
            component.searchTerm = 'MULLARD';

            // act
            component.filterTubes();

            // assert
            expect(component.filteredTubes.length).toBe(2);
        });

        it('should return all tubes when no filters applied', () => {
            // act
            component.filterTubes();

            // assert
            expect(component.filteredTubes).toEqual(mockTubes);
        });
    });

    describe('filterByType', () => {
        beforeEach(() => {
            component.tubes = mockTubes;
        });

        it('should set selectedType and filter tubes', () => {
            // arrange
            spyOn(component, 'filterTubes');

            // act
            component.filterByType('Triode');

            // assert
            expect(component.selectedType).toBe('Triode');
            expect(component.filterTubes).toHaveBeenCalled();
        });
    });

    describe('clearFilters', () => {
        it('should reset all filter properties and call filterTubes', () => {
            // arrange
            component.searchTerm = 'test';
            component.selectedType = 'Triode';
            component.selectedManufacturer = 'Mullard';
            component.selectedOwnership = 'mine';
            spyOn(component, 'filterTubes');

            // act
            component.clearFilters();

            // assert
            expect(component.searchTerm).toBe('');
            expect(component.selectedType).toBe('');
            expect(component.selectedManufacturer).toBe('');
            expect(component.selectedOwnership).toBe('');
            expect(component.filterTubes).toHaveBeenCalled();
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
            const dateString = '2023-10-15T14:30:00Z';

            // act
            const formatted = component.formatDate(dateString);

            // assert
            expect(formatted).toMatch(/Oct 1\d, 2023/);
        });

        it('should handle different date formats', () => {
            // arrange
            const dateString = '2023-12-25';

            // act
            const formatted = component.formatDate(dateString);

            // assert
            expect(formatted).toMatch(/Dec 2\d, 2023/);
        });
    });

    describe('confirmDelete', () => {
        it('should show error toast when user is not authenticated', () => {
            // arrange
            authService.isAuthenticated.and.returnValue(false);
            const tube = mockTubes[0];

            // act
            component.confirmDelete(tube);

            // assert
            expect(toastService.error).toHaveBeenCalledWith('You must be signed in to delete tubes.');
            expect(toastService.confirm).not.toHaveBeenCalled();
        });

        it('should show confirmation dialog when user is authenticated', () => {
            // arrange
            authService.isAuthenticated.and.returnValue(true);
            const tube = mockTubes[0];

            // act
            component.confirmDelete(tube);

            // assert
            expect(toastService.confirm).toHaveBeenCalledWith(
                'Are you sure you want to delete "ECC83"? This action cannot be undone.',
                jasmine.any(Function),
                undefined,
                'Delete Tube'
            );
        });

        it('should call deleteTube when confirmation is accepted', () => {
            // arrange
            authService.isAuthenticated.and.returnValue(true);
            authService.getCurrentUser.and.returnValue(mockUser);
            firebaseTubeService.deleteTube.and.returnValue(of(true));
            const tube = mockTubes[0];
            let confirmCallback: (() => void) | undefined;
            toastService.confirm.and.callFake((message: string, onConfirm: () => void) => {
                confirmCallback = onConfirm;
            });

            // act
            component.confirmDelete(tube);
            if (confirmCallback) {
                confirmCallback();
            }

            // assert
            expect(firebaseTubeService.deleteTube).toHaveBeenCalledWith(tube);
        });
    });

    describe('deleteTube', () => {
        it('should delete tube when user is owner', () => {
            // arrange
            authService.isAuthenticated.and.returnValue(true);
            authService.getCurrentUser.and.returnValue(mockUser);
            firebaseTubeService.deleteTube.and.returnValue(of(true));
            const tube = mockTubes[0]; // owner: 'user123'
            spyOn(console, 'log');

            // act
            component['deleteTube'](tube);

            // assert
            expect(firebaseTubeService.deleteTube).toHaveBeenCalledWith(tube);
            expect(console.log).toHaveBeenCalledWith('Tube "ECC83" deleted successfully');
            expect(toastService.success).toHaveBeenCalledWith('Tube "ECC83" deleted successfully!');
        });

        it('should not delete tube when user is not owner', () => {
            // arrange
            authService.isAuthenticated.and.returnValue(true);
            authService.getCurrentUser.and.returnValue(mockUser);
            const tube = mockTubes[1]; // owner: 'user456'

            // act
            component['deleteTube'](tube);

            // assert
            expect(firebaseTubeService.deleteTube).not.toHaveBeenCalled();
            expect(toastService.error).toHaveBeenCalledWith('You can only delete tubes that you created.');
        });

        it('should show error toast when deletion fails with false response', () => {
            // arrange
            authService.isAuthenticated.and.returnValue(true);
            authService.getCurrentUser.and.returnValue(mockUser);
            firebaseTubeService.deleteTube.and.returnValue(of(false));
            const tube = mockTubes[0];

            // act
            component['deleteTube'](tube);

            // assert
            expect(toastService.error).toHaveBeenCalledWith('Failed to delete tube. Please try again.');
        });

        it('should handle error when deletion fails', () => {
            // arrange
            authService.isAuthenticated.and.returnValue(true);
            authService.getCurrentUser.and.returnValue(mockUser);
            const error = new Error('Delete error');
            firebaseTubeService.deleteTube.and.returnValue(throwError(() => error));
            const tube = mockTubes[0];
            spyOn(console, 'error');

            // act
            component['deleteTube'](tube);

            // assert
            expect(console.error).toHaveBeenCalledWith('Error deleting tube:', error);
            expect(toastService.error).toHaveBeenCalledWith('Error deleting tube. Please try again.');
        });

        it('should log delete request', () => {
            // arrange
            authService.isAuthenticated.and.returnValue(true);
            authService.getCurrentUser.and.returnValue(mockUser);
            firebaseTubeService.deleteTube.and.returnValue(of(true));
            const tube = mockTubes[0];
            spyOn(console, 'log');

            // act
            component['deleteTube'](tube);

            // assert
            expect(console.log).toHaveBeenCalledWith('Delete requested for tube: ECC83');
        });
    });
});
