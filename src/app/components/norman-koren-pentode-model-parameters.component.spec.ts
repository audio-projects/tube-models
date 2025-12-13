import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NormanKorenPentodeModelParametersComponent } from './norman-koren-pentode-model-parameters.component';
import { ModelService } from '../services/model.service';
import { TubeInformation } from './tube-information';
import { DebugElement } from '@angular/core';
import { By } from '@angular/platform-browser';

describe('NormanKorenPentodeModelParametersComponent', () => {
    let component: NormanKorenPentodeModelParametersComponent;
    let fixture: ComponentFixture<NormanKorenPentodeModelParametersComponent>;
    let modelService: jasmine.SpyObj<ModelService>;
    let compiled: DebugElement;

    const mockTube: TubeInformation = {
        id: '1',
        name: 'EF80',
        manufacturer: 'Philips',
        comments: 'Test pentode',
        lastUpdatedOn: '2023-01-01',
        type: 'Pentode',
        files: []
    };

    const mockPentodeModelParameters = {
        mu: 70,
        ex: 1.5,
        kg1: 800,
        kg2: 400,
        kp: 500,
        kvb: 250,
        calculatedOn: '2023-10-01T12:00:00Z',
        rmse: 0.6
    };

    beforeEach(async () => {
        const modelServiceSpy = jasmine.createSpyObj('ModelService', [
            'getPentodeModel',
            'getPentodeModelDefinition'
        ]);

        await TestBed.configureTestingModule({
            imports: [NormanKorenPentodeModelParametersComponent],
            providers: [
                { provide: ModelService, useValue: modelServiceSpy }
            ]
        }).compileComponents();

        modelService = TestBed.inject(ModelService) as jasmine.SpyObj<ModelService>;
        fixture = TestBed.createComponent(NormanKorenPentodeModelParametersComponent);
        component = fixture.componentInstance;
        compiled = fixture.debugElement;
    });

    it('should create', () => {
        // assert
        expect(component).toBeTruthy();
    });

    describe('Initial state (no parameters calculated)', () => {
        beforeEach(() => {
            component.tube = { ...mockTube };
            component.isCalculating = false;
            component.canCalculate = true;
            fixture.detectChanges();
        });

        it('should display not calculated message', () => {
            // arrange
            const messageElement = compiled.query(By.css('.text-muted'));

            // assert
            expect(messageElement).toBeTruthy();
            expect(messageElement.nativeElement.textContent).toContain('SPICE model parameters have not been calculated yet');
        });

        it('should display calculate button', () => {
            // arrange
            const button = compiled.query(By.css('button.btn-outline-success'));

            // assert
            expect(button).toBeTruthy();
            expect(button.nativeElement.textContent).toContain('Calculate SPICE Parameters');
        });

        it('should enable calculate button when canCalculate is true', () => {
            // arrange
            const button = compiled.query(By.css('button.btn-outline-success'));

            // assert
            expect(button.nativeElement.disabled).toBe(false);
        });

        it('should disable calculate button when canCalculate is false', () => {
            // arrange
            component.canCalculate = false;

            // act
            fixture.detectChanges();
            const button = compiled.query(By.css('button.btn-outline-success'));

            // assert
            expect(button.nativeElement.disabled).toBe(true);
        });

        it('should display helper text about measurement data requirement', () => {
            // arrange
            const helperText = compiled.query(By.css('.form-text'));

            // assert
            expect(helperText).toBeTruthy();
            expect(helperText.nativeElement.textContent).toContain('Requires pentode measurement data files');
        });

        it('should emit calculateRequested when calculate button is clicked', () => {
            // arrange
            spyOn(component.calculateRequested, 'emit');
            const button = compiled.query(By.css('button.btn-outline-success'));

            // act
            button.nativeElement.click();

            // assert
            expect(component.calculateRequested.emit).toHaveBeenCalled();
        });
    });

    describe('Calculating state', () => {
        beforeEach(() => {
            component.tube = { ...mockTube };
            component.isCalculating = true;
            component.canCalculate = true;
            fixture.detectChanges();
        });

        it('should display spinner when calculating', () => {
            // arrange
            const spinner = compiled.query(By.css('.spinner-border'));

            // assert
            expect(spinner).toBeTruthy();
            expect(spinner.nativeElement.classList.contains('text-success')).toBe(true);
        });

        it('should display calculating message', () => {
            // arrange
            const message = compiled.query(By.css('.text-muted'));

            // assert
            expect(message).toBeTruthy();
            expect(message.nativeElement.textContent).toContain('Calculating SPICE model parameters');
        });

        it('should display helper text about processing time', () => {
            // arrange
            const smallText = compiled.query(By.css('small.text-muted'));

            // assert
            expect(smallText).toBeTruthy();
            expect(smallText.nativeElement.textContent).toContain('This may take a few moments');
        });

        it('should not display calculate button when calculating', () => {
            // assert
            // The calculating state should show a different div
            expect(compiled.queryAll(By.css('button')).length).toBe(0);
        });
    });

    describe('Calculated state (with parameters)', () => {
        beforeEach(() => {
            // arrange
            component.tube = {
                ...mockTube,
                pentodeModelParameters: { ...mockPentodeModelParameters }
            };
            component.isCalculating = false;
            component.canCalculate = true;

            modelService.getPentodeModel.and.returnValue({
                name: 'EF80_PENTODE',
                model: '.subckt EF80_PENTODE P G2 G1 K\nG1 G1 K VALUE={PWR(V(P,K)/KP,EX) + V(G1,K)/MU}\nE1 1 0 VALUE={V(G1,K)/KG1*LOG(1+EXP(KG1*V(G1)))}\nRE1 1 0 1G\nGP P K VALUE={V(1)/KVB*ATAN(V(P,K)/KVB)}\n.ends'
            });
            modelService.getPentodeModelDefinition.and.returnValue('.param KP=500 MU=70 EX=1.5 KG1=800 KG2=400 KVB=250');

            fixture.detectChanges();
        });

        it('should display success message with checkmark', () => {
            // arrange
            const successIcon = compiled.query(By.css('.bi-check-circle-fill.text-success'));
            const message = compiled.query(By.css('.text-muted'));

            // assert
            expect(successIcon).toBeTruthy();
            expect(message.nativeElement.textContent).toContain('SPICE model parameters calculated');
        });

        it('should display recalculate button', () => {
            // arrange
            const recalculateButton = compiled.query(By.css('button.btn-outline-success'));

            // assert
            expect(recalculateButton).toBeTruthy();
            expect(recalculateButton.nativeElement.textContent).toContain('Recalculate');
        });

        it('should display reset button', () => {
            // arrange
            const resetButton = compiled.query(By.css('button.btn-outline-danger'));

            // assert
            expect(resetButton).toBeTruthy();
            expect(resetButton.nativeElement.textContent).toContain('Reset');
        });

        it('should enable recalculate button when not calculating and can calculate', () => {
            // arrange
            const recalculateButton = compiled.query(By.css('button.btn-outline-success'));

            // assert
            expect(recalculateButton.nativeElement.disabled).toBe(false);
        });

        it('should disable recalculate button when calculating', () => {
            // arrange
            component.isCalculating = true;

            // act
            fixture.detectChanges();

            // assert
            const recalculateButton = compiled.query(By.css('button.btn-outline-success'));
            expect(recalculateButton.nativeElement.disabled).toBe(true);
        });

        it('should disable recalculate button when canCalculate is false', () => {
            // arrange
            component.canCalculate = false;

            // act
            fixture.detectChanges();

            // assert
            const recalculateButton = compiled.query(By.css('button.btn-outline-success'));
            expect(recalculateButton.nativeElement.disabled).toBe(true);
        });

        it('should disable reset button when calculating', () => {
            // arrange
            component.isCalculating = true;

            // act
            fixture.detectChanges();

            // assert
            const resetButton = compiled.query(By.css('button.btn-outline-danger'));
            expect(resetButton.nativeElement.disabled).toBe(true);
        });

        it('should emit calculateRequested when recalculate button is clicked', () => {
            // arrange
            spyOn(component.calculateRequested, 'emit');
            const recalculateButton = compiled.query(By.css('button.btn-outline-success'));

            // act
            recalculateButton.nativeElement.click();

            // assert
            expect(component.calculateRequested.emit).toHaveBeenCalled();
        });

        it('should display SPICE model code', () => {
            // arrange
            const preElement = compiled.query(By.css('pre.bg-dark'));

            // assert
            expect(preElement).toBeTruthy();
            expect(preElement.nativeElement.textContent).toContain('.subckt EF80_PENTODE');
        });

        it('should display SPICE model header', () => {
            // arrange
            const header = compiled.query(By.css('h6'));

            // assert
            expect(header).toBeTruthy();
            expect(header.nativeElement.textContent).toContain('SPICE Model');
        });

        it('should display SPICE simulator labels', () => {
            // arrange
            const labels = compiled.query(By.css('small.text-muted'));

            // assert
            expect(labels).toBeTruthy();
            expect(labels.nativeElement.textContent).toContain('ltspice');
            expect(labels.nativeElement.textContent).toContain('ngspice');
        });
    });

    describe('calculateSpiceModelParameters()', () => {
        it('should emit calculateRequested event', () => {
            // arrange
            spyOn(component.calculateRequested, 'emit');

            // act
            component.calculateSpiceModelParameters();

            // assert
            expect(component.calculateRequested.emit).toHaveBeenCalled();
        });

        it('should emit event without arguments', () => {
            // arrange
            spyOn(component.calculateRequested, 'emit');

            // act
            component.calculateSpiceModelParameters();

            // assert
            expect(component.calculateRequested.emit).toHaveBeenCalledWith();
        });
    });

    describe('resetParameters()', () => {
        it('should delete pentodeModelParameters from tube', () => {
            // arrange
            component.tube = {
                ...mockTube,
                pentodeModelParameters: { ...mockPentodeModelParameters }
            };

            // act
            component.resetParameters();

            // assert
            expect(component.tube.pentodeModelParameters).toBeUndefined();
        });

        it('should handle undefined tube gracefully', () => {
            // arrange
            component.tube = undefined;

            // act & assert
            expect(() => component.resetParameters()).not.toThrow();
        });

        it('should handle tube without pentodeModelParameters', () => {
            // arrange
            component.tube = { ...mockTube };

            // act & assert
            expect(() => component.resetParameters()).not.toThrow();
            expect(component.tube.pentodeModelParameters).toBeUndefined();
        });

        it('should trigger UI update after reset', () => {
            // arrange
            component.tube = {
                ...mockTube,
                pentodeModelParameters: { ...mockPentodeModelParameters }
            };

            modelService.getPentodeModel.and.returnValue({
                name: 'EF80_PENTODE',
                model: '.subckt EF80_PENTODE P G2 G1 K\n...\n.ends'
            });
            modelService.getPentodeModelDefinition.and.returnValue('.param KP=500 MU=70');

            fixture.detectChanges();

            // act
            component.resetParameters();

            modelService.getPentodeModel.and.returnValue({
                name: '',
                model: ''
            });
            modelService.getPentodeModelDefinition.and.returnValue('');

            fixture.detectChanges();

            // assert
            expect(component.tube.pentodeModelParameters).toBeUndefined();
        });
    });

    describe('spiceModel getter', () => {
        beforeEach(() => {
            // arrange
            component.tube = {
                ...mockTube,
                pentodeModelParameters: { ...mockPentodeModelParameters }
            };

            modelService.getPentodeModel.and.returnValue({
                name: 'EF80_PENTODE',
                model: '.subckt EF80_PENTODE P G2 G1 K\n...\n.ends'
            });
            modelService.getPentodeModelDefinition.and.returnValue('.param KP=500 MU=70');
        });

        it('should call modelService.getPentodeModel with tube', () => {
            // act
            void component.spiceModel;

            // assert
            expect(modelService.getPentodeModel).toHaveBeenCalledWith(component.tube);
        });

        it('should call modelService.getPentodeModelDefinition', () => {
            // act
            void component.spiceModel;

            // assert
            expect(modelService.getPentodeModelDefinition).toHaveBeenCalled();
        });

        it('should combine model and definition with double newline separator', () => {
            // act
            const result = component.spiceModel;

            // assert
            expect(result).toBe('.subckt EF80_PENTODE P G2 G1 K\n...\n.ends\n\n.param KP=500 MU=70');
        });

        it('should handle empty model gracefully', () => {
            // arrange
            modelService.getPentodeModel.and.returnValue({
                name: 'TEST',
                model: ''
            });
            modelService.getPentodeModelDefinition.and.returnValue('');

            // act
            const result = component.spiceModel;

            // assert
            expect(result).toBe('\n\n');
        });
    });

    describe('Input bindings', () => {
        it('should accept tube input', () => {
            // act
            component.tube = mockTube;

            // assert
            expect(component.tube).toEqual(mockTube);
        });

        it('should accept isCalculating input', () => {
            // act
            component.isCalculating = true;

            // assert
            expect(component.isCalculating).toBe(true);

            // act
            component.isCalculating = false;

            // assert
            expect(component.isCalculating).toBe(false);
        });

        it('should accept canCalculate input', () => {
            // act
            component.canCalculate = true;

            // assert
            expect(component.canCalculate).toBe(true);

            // act
            component.canCalculate = false;

            // assert
            expect(component.canCalculate).toBe(false);
        });

        it('should have default values for inputs', () => {
            // assert
            expect(component.tube).toBeUndefined();
            expect(component.isCalculating).toBe(false);
            expect(component.canCalculate).toBe(true);
        });
    });

    describe('Output bindings', () => {
        it('should have calculateRequested output', () => {
            // assert
            expect(component.calculateRequested).toBeDefined();
        });

        it('should be able to subscribe to calculateRequested', (done) => {
            // arrange
            component.calculateRequested.subscribe(() => {
                // assert
                expect(true).toBe(true);
                done();
            });

            // act
            component.calculateSpiceModelParameters();
        });
    });

    describe('Edge cases', () => {
        it('should handle tube with null pentodeModelParameters', () => {
            // arrange
            component.tube = {
                ...mockTube,
                pentodeModelParameters: undefined
            };
            component.isCalculating = false;

            // act
            fixture.detectChanges();

            // assert
            const notCalculatedMessage = compiled.query(By.css('.text-muted'));
            expect(notCalculatedMessage).toBeTruthy();
        });

        it('should handle tube with pentodeModelParameters but no calculatedOn', () => {
            // arrange
            component.tube = {
                ...mockTube,
                pentodeModelParameters: {
                    mu: 70,
                    ex: 1.5,
                    kg1: 800,
                    kg2: 400,
                    kp: 500,
                    kvb: 250
                    // No calculatedOn field
                }
            };
            component.isCalculating = false;

            // act
            fixture.detectChanges();

            // assert
            const notCalculatedMessage = compiled.query(By.css('.text-muted'));
            expect(notCalculatedMessage).toBeTruthy();
            expect(notCalculatedMessage.nativeElement.textContent).toContain('have not been calculated yet');
        });

        it('should handle both isCalculating and tube.pentodeModelParameters (calculating should take precedence)', () => {
            // arrange
            component.tube = {
                ...mockTube,
                pentodeModelParameters: { ...mockPentodeModelParameters }
            };
            component.isCalculating = true;

            modelService.getPentodeModel.and.returnValue({
                name: 'EF80_PENTODE',
                model: '.subckt EF80_PENTODE P G2 G1 K\n...\n.ends'
            });
            modelService.getPentodeModelDefinition.and.returnValue('.param KP=500 MU=70');

            // act
            fixture.detectChanges();

            // assert
            const spinner = compiled.query(By.css('.spinner-border'));
            expect(spinner).toBeTruthy();
        });
    });
});
