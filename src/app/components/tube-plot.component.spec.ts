import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TubePlotComponent } from './tube-plot.component';
import { CircuitService } from '../services/circuit.service';
import { ModelService } from '../services/model.service';
import { TubeInformation } from './tube-information';
import { File as TubeFile, Series, Point } from '../files';
import { DebugElement } from '@angular/core';
import { By } from '@angular/platform-browser';
import { Chart } from 'chart.js';

describe('TubePlotComponent', () => {
    let component: TubePlotComponent;
    let fixture: ComponentFixture<TubePlotComponent>;
    let circuitService: jasmine.SpyObj<CircuitService>;
    let compiled: DebugElement;

    const mockPoint: Point = {
        index: 1,
        ip: 10.5,
        eg: -2.0,
        ep: 100,
        es: 100,
        is: 2.5,
        eh: 6.3
    };

    const mockSeries: Series = {
        eg: -2.0,
        points: [mockPoint]
    };

    const mockFile: TubeFile = {
        name: 'ECC83.utd',
        series: [mockSeries],
        measurementType: 'IP_VG_EP_EF',
        measurementTypeLabel: 'Plate Current vs Grid/Plate Voltage',
        egOffset: 0
    };

    const mockTube: TubeInformation = {
        id: '1',
        name: 'ECC83',
        manufacturer: 'Mullard',
        comments: 'Test triode',
        lastUpdatedOn: '2023-01-01',
        type: 'Triode',
        files: [mockFile],
        triodeModelParameters: {
            mu: 100,
            ex: 1.4,
            kg1: 1060,
            kp: 600,
            kvb: 300,
            calculatedOn: '2023-10-01T12:00:00Z',
            rmse: 0.5
        }
    };

    beforeEach(async () => {
        const circuitServiceSpy = jasmine.createSpyObj('CircuitService', [
            'generateTriodePlateCharacteristicsCircuit',
            'generatePentodePlateCharacteristicsCircuit'
        ]);
        const modelServiceSpy = jasmine.createSpyObj('ModelService', [
            'getTriodeModel',
            'getTriodeModelDefinition',
            'getPentodeModel',
            'getPentodeModelDefinition',
            'getDerkModel',
            'getDerkModelDefinition',
            'getDerkEModel',
            'getDerkEModelDefinition'
        ]);

        await TestBed.configureTestingModule({
            imports: [TubePlotComponent],
            providers: [
                { provide: CircuitService, useValue: circuitServiceSpy },
                { provide: ModelService, useValue: modelServiceSpy }
            ]
        }).compileComponents();

        circuitService = TestBed.inject(CircuitService) as jasmine.SpyObj<CircuitService>;
        fixture = TestBed.createComponent(TubePlotComponent);
        component = fixture.componentInstance;
        compiled = fixture.debugElement;

        // Mock Chart.js to avoid canvas rendering issues in tests
        spyOn(Chart.prototype, 'destroy').and.stub();
    });

    it('should create', () => {
        // assert
        expect(component).toBeTruthy();
    });

    describe('Initial state', () => {
        it('should have null file by default', () => {
            // assert
            expect(component.file).toBeNull();
        });

        it('should have null tube by default', () => {
            // assert
            expect(component.tube).toBeNull();
        });

        it('should have empty selectedModel by default', () => {
            // assert
            expect(component.selectedModel).toBe('');
        });

        it('should have empty availableModels array by default', () => {
            // assert
            expect(component.availableModels).toEqual([]);
        });

        it('should have null modelRmse by default', () => {
            // assert
            expect(component.modelRmse).toBeNull();
        });

        it('should not have chart initialized', () => {
            // assert
            expect(component['chart']).toBeNull();
        });
    });

    describe('ngAfterViewInit', () => {
        it('should set viewInitialized flag to true', () => {
            // act
            component.ngAfterViewInit();

            // assert
            expect(component['viewInitialized']).toBe(true);
        });

        it('should update available models', () => {
            // arrange
            component.tube = mockTube;
            spyOn(component as never, 'updateAvailableModels');

            // act
            component.ngAfterViewInit();

            // assert
            expect(component['updateAvailableModels']).toHaveBeenCalled();
        });

        it('should create chart if file is present', () => {
            // arrange
            component.file = mockFile;
            spyOn(component as never, 'createChart');

            // act
            component.ngAfterViewInit();

            // assert
            expect(component['createChart']).toHaveBeenCalled();
        });

        it('should not create chart if file is null', () => {
            // arrange
            component.file = null;
            spyOn(component as never, 'createChart');

            // act
            component.ngAfterViewInit();

            // assert
            expect(component['createChart']).not.toHaveBeenCalled();
        });
    });

    describe('ngOnChanges', () => {
        beforeEach(() => {
            component['viewInitialized'] = true;
        });

        it('should update available models when tube changes', () => {
            // arrange
            spyOn(component as never, 'updateAvailableModels');
            const changes = {
                tube: {
                    currentValue: mockTube,
                    previousValue: null,
                    firstChange: true,
                    isFirstChange: () => true
                }
            };

            // act
            component.ngOnChanges(changes);

            // assert
            expect(component['updateAvailableModels']).toHaveBeenCalled();
        });

        it('should create chart when file changes and viewInitialized is true', () => {
            // arrange
            component.file = mockFile;
            spyOn(component as never, 'createChart');
            const changes = {
                file: {
                    currentValue: mockFile,
                    previousValue: null,
                    firstChange: true,
                    isFirstChange: () => true
                }
            };

            // act
            component.ngOnChanges(changes);

            // assert
            expect(component['createChart']).toHaveBeenCalled();
        });

        it('should destroy chart when file becomes null', () => {
            // arrange
            component.file = null;
            spyOn(component as never, 'destroyChart');
            const changes = {
                file: {
                    currentValue: null,
                    previousValue: mockFile,
                    firstChange: false,
                    isFirstChange: () => false
                }
            };

            // act
            component.ngOnChanges(changes);

            // assert
            expect(component['destroyChart']).toHaveBeenCalled();
        });

        it('should not create chart if viewInitialized is false', () => {
            // arrange
            component['viewInitialized'] = false;
            component.file = mockFile;
            spyOn(component as never, 'createChart');
            const changes = {
                file: {
                    currentValue: mockFile,
                    previousValue: null,
                    firstChange: true,
                    isFirstChange: () => true
                }
            };

            // act
            component.ngOnChanges(changes);

            // assert
            expect(component['createChart']).not.toHaveBeenCalled();
        });
    });

    describe('ngOnDestroy', () => {
        it('should destroy chart', () => {
            // arrange
            spyOn(component as never, 'destroyChart');

            // act
            component.ngOnDestroy();

            // assert
            expect(component['destroyChart']).toHaveBeenCalled();
        });
    });

    describe('getTotalPointsCount', () => {
        it('should return 0 when file is null', () => {
            // arrange
            component.file = null;

            // act
            const count = component.getTotalPointsCount();

            // assert
            expect(count).toBe(0);
        });

        it('should return total points count from all series', () => {
            // arrange
            const fileWithMultipleSeries: TubeFile = {
                ...mockFile,
                series: [
                    { ...mockSeries, points: [mockPoint, mockPoint, mockPoint] },
                    { ...mockSeries, points: [mockPoint, mockPoint] }
                ]
            };
            component.file = fileWithMultipleSeries;

            // act
            const count = component.getTotalPointsCount();

            // assert
            expect(count).toBe(5);
        });

        it('should return 0 when series array is empty', () => {
            // arrange
            component.file = {
                ...mockFile,
                series: []
            };

            // act
            const count = component.getTotalPointsCount();

            // assert
            expect(count).toBe(0);
        });
    });

    describe('updateAvailableModels', () => {
        it('should populate availableModels for triode with triodeModelParameters', () => {
            // arrange
            component.tube = mockTube;

            // act
            component['updateAvailableModels']();

            // assert
            expect(component.availableModels.length).toBeGreaterThan(0);
            expect(component.availableModels.some(m => m.key === 'norman-koren-triode')).toBe(true);
        });

        it('should populate availableModels for pentode with pentodeModelParameters', () => {
            // arrange
            const pentodeTube: TubeInformation = {
                ...mockTube,
                type: 'Pentode',
                pentodeModelParameters: {
                    mu: 70,
                    ex: 1.5,
                    kg1: 800,
                    kg2: 400,
                    kp: 500,
                    kvb: 250,
                    calculatedOn: '2023-10-01T12:00:00Z',
                    rmse: 0.6
                }
            };
            component.tube = pentodeTube;

            // act
            component['updateAvailableModels']();

            // assert
            expect(component.availableModels.length).toBeGreaterThan(0);
            expect(component.availableModels.some(m => m.key === 'norman-koren-pentode')).toBe(true);
        });

        it('should include derk model when derkModelParameters exist', () => {
            // arrange
            const tubeWithDerk: TubeInformation = {
                ...mockTube,
                type: 'Pentode',
                derkModelParameters: {
                    mu: 70,
                    calculatedOn: '2023-10-01T12:00:00Z'
                }
            };
            component.tube = tubeWithDerk;

            // act
            component['updateAvailableModels']();

            // assert
            expect(component.availableModels.some(m => m.key === 'derk-pentode')).toBe(true);
        });

        it('should clear availableModels when tube is null', () => {
            // arrange
            component.tube = null;

            // act
            component['updateAvailableModels']();

            // assert
            expect(component.availableModels).toEqual([]);
        });
    });

    describe('onModelSelectionChange', () => {
        beforeEach(() => {
            component['viewInitialized'] = true;
            component.file = mockFile;
        });

        it('should recreate chart when model selection changes', () => {
            // arrange
            spyOn(component as never, 'createChart');

            // act
            component.onModelSelectionChange();

            // assert
            expect(component['createChart']).toHaveBeenCalled();
        });

        it('should not recreate chart if file is null', () => {
            // arrange
            component.file = null;
            spyOn(component as never, 'createChart');

            // act
            component.onModelSelectionChange();

            // assert
            expect(component['createChart']).not.toHaveBeenCalled();
        });
    });

    describe('canGenerateCircuit', () => {
        it('should return true when tube and file are present and model is selected', () => {
            // arrange
            component.tube = mockTube;
            component.file = {
                ...mockFile,
                measurementType: 'IP_VA_VG_VH'
            };
            component.selectedModel = 'norman-koren-triode';

            // act
            const result = component.canGenerateCircuit();

            // assert
            expect(result).toBe(true);
        });

        it('should return false when tube is null', () => {
            // arrange
            component.tube = null;
            component.file = mockFile;
            component.selectedModel = 'norman-koren-triode';

            // act
            const result = component.canGenerateCircuit();

            // assert
            expect(result).toBe(false);
        });

        it('should return false when file is null', () => {
            // arrange
            component.tube = mockTube;
            component.file = null;
            component.selectedModel = 'norman-koren-triode';

            // act
            const result = component.canGenerateCircuit();

            // assert
            expect(result).toBe(false);
        });

        it('should return false when selectedModel is empty', () => {
            // arrange
            component.tube = mockTube;
            component.file = mockFile;
            component.selectedModel = '';

            // act
            const result = component.canGenerateCircuit();

            // assert
            expect(result).toBe(false);
        });
    });

    describe('downloadCircuit', () => {
        beforeEach(() => {
            component.tube = mockTube;
            component.file = {
                ...mockFile,
                measurementType: 'IP_VA_VG_VH'
            };
            component.selectedModel = 'norman-koren-triode';
        });

        it('should call circuitService for triode model', () => {
            // arrange
            circuitService.generateTriodePlateCharacteristicsCircuit.and.returnValue('* Circuit content\n');
            spyOn(window.URL, 'createObjectURL').and.returnValue('blob:test');
            spyOn(window.URL, 'revokeObjectURL');
            spyOn(document, 'createElement').and.returnValue({
                click: jasmine.createSpy('click'),
                href: '',
                download: ''
            } as unknown as HTMLAnchorElement);

            // act
            component.downloadCircuit();

            // assert
            expect(circuitService.generateTriodePlateCharacteristicsCircuit).toHaveBeenCalled();
        });

        it('should not throw when tube is null', () => {
            // arrange
            component.tube = null;

            // act & assert
            expect(() => component.downloadCircuit()).not.toThrow();
        });

        it('should not throw when file is null', () => {
            // arrange
            component.file = null;

            // act & assert
            expect(() => component.downloadCircuit()).not.toThrow();
        });
    });

    describe('Input bindings', () => {
        it('should accept file input', () => {
            // act
            component.file = mockFile;

            // assert
            expect(component.file).toEqual(mockFile);
        });

        it('should accept tube input', () => {
            // act
            component.tube = mockTube;

            // assert
            expect(component.tube).toEqual(mockTube);
        });

        it('should accept null file input', () => {
            // act
            component.file = null;

            // assert
            expect(component.file).toBeNull();
        });

        it('should accept null tube input', () => {
            // act
            component.tube = null;

            // assert
            expect(component.tube).toBeNull();
        });
    });

    describe('Template rendering', () => {
        beforeEach(() => {
            fixture.detectChanges();
        });

        it('should display "No file selected" when file is null', () => {
            // arrange
            component.file = null;

            // act
            fixture.detectChanges();

            // assert
            const message = compiled.query(By.css('.text-center.py-4'));
            expect(message).toBeTruthy();
            expect(message.nativeElement.textContent).toContain('No file selected');
        });

        it('should display file name when file is present', () => {
            // arrange
            component.file = mockFile;

            // act
            fixture.detectChanges();

            // assert
            const heading = compiled.query(By.css('h5.fw-bold'));
            expect(heading).toBeTruthy();
            expect(heading.nativeElement.textContent).toContain('ECC83.utd');
        });

        it('should display measurement type label when file is present', () => {
            // arrange
            component.file = mockFile;

            // act
            fixture.detectChanges();

            // assert
            const paragraph = compiled.query(By.css('p.text-muted'));
            expect(paragraph).toBeTruthy();
            expect(paragraph.nativeElement.textContent).toContain('Plate Current vs Grid/Plate Voltage');
        });

        it('should display model selection dropdown when availableModels exist', () => {
            // arrange
            component.file = mockFile;
            component.availableModels = [
                { key: 'norman-koren-triode', name: 'Norman Koren Triode Model' }
            ];

            // act
            fixture.detectChanges();

            // assert
            const select = compiled.query(By.css('#modelSelect'));
            expect(select).toBeTruthy();
        });

        it('should not display model selection dropdown when availableModels is empty', () => {
            // arrange
            component.file = mockFile;
            component.availableModels = [];

            // act
            fixture.detectChanges();

            // assert
            const select = compiled.query(By.css('#modelSelect'));
            expect(select).toBeFalsy();
        });

        it('should display circuit download button when model is selected and can generate circuit', () => {
            // arrange
            component.file = {
                ...mockFile,
                measurementType: 'IP_VA_VG_VH'
            };
            component.tube = mockTube;
            component.selectedModel = 'norman-koren-triode';
            component.availableModels = [
                { key: 'norman-koren-triode', name: 'Norman Koren Triode Model' }
            ];

            // act
            fixture.detectChanges();

            // assert
            const button = compiled.query(By.css('button[title="Download SPICE circuit file"]'));
            expect(button).toBeTruthy();
        });

        it('should display RMSE when modelRmse is not null', () => {
            // arrange
            component.file = mockFile;
            component.modelRmse = 0.1234;

            // act
            fixture.detectChanges();

            // assert
            const alert = compiled.query(By.css('.alert.alert-info'));
            expect(alert).toBeTruthy();
            expect(alert.nativeElement.textContent).toContain('0.1234');
        });

        it('should not display RMSE when modelRmse is null', () => {
            // arrange
            component.file = mockFile;
            component.modelRmse = null;

            // act
            fixture.detectChanges();

            // assert
            const alert = compiled.query(By.css('.alert.alert-info'));
            expect(alert).toBeFalsy();
        });

        it('should always display canvas element', () => {
            // assert
            const canvas = compiled.query(By.css('canvas'));
            expect(canvas).toBeTruthy();
        });
    });

    describe('Edge cases', () => {
        it('should handle file with empty series array', () => {
            // arrange
            component.file = {
                ...mockFile,
                series: []
            };

            // act
            fixture.detectChanges();

            // assert
            expect(component.getTotalPointsCount()).toBe(0);
        });

        it('should handle file with UNKNOWN measurement type', () => {
            // arrange
            component.file = {
                ...mockFile,
                measurementType: 'UNKNOWN'
            };
            component['viewInitialized'] = true;
            spyOn(component as never, 'createChart');

            // act
            component.ngOnChanges({
                file: {
                    currentValue: component.file,
                    previousValue: null,
                    firstChange: true,
                    isFirstChange: () => true
                }
            });

            // assert - chart creation should still be called but might not render
            expect(component['createChart']).toHaveBeenCalled();
        });

        it('should handle tube without any model parameters', () => {
            // arrange
            const tubeWithoutParams: TubeInformation = {
                ...mockTube,
                triodeModelParameters: undefined,
                pentodeModelParameters: undefined,
                derkModelParameters: undefined,
                derkEModelParameters: undefined
            };
            component.tube = tubeWithoutParams;

            // act
            component['updateAvailableModels']();

            // assert
            expect(component.availableModels).toEqual([]);
        });

        it('should handle rapid model selection changes', () => {
            // arrange
            component.file = mockFile;
            component.tube = mockTube;
            component['viewInitialized'] = true;
            spyOn(component as never, 'createChart');

            // act
            component.selectedModel = 'norman-koren-triode';
            component.onModelSelectionChange();
            component.selectedModel = '';
            component.onModelSelectionChange();
            component.selectedModel = 'norman-koren-triode';
            component.onModelSelectionChange();

            // assert
            expect(component['createChart']).toHaveBeenCalledTimes(3);
        });
    });
});
