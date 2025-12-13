import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DerkPentodeModelParametersComponent } from './derk-pentode-model-parameters.component';
import { ModelService } from '../services/model.service';
import { TubeInformation } from './tube-information';
import { DebugElement } from '@angular/core';
import { By } from '@angular/platform-browser';

describe('DerkPentodeModelParametersComponent', () => {
    let component: DerkPentodeModelParametersComponent;
    let fixture: ComponentFixture<DerkPentodeModelParametersComponent>;
    let modelService: jasmine.SpyObj<ModelService>;
    let compiled: DebugElement;

    const mockTube: TubeInformation = {
        id: '1',
        name: 'EL500',
        manufacturer: 'Philips',
        comments: 'Test pentode',
        lastUpdatedOn: '2023-01-01',
        type: 'Pentode',
        files: []
    };

    const mockDerkModelParameters = {
        mu: 70,
        ex: 1.5,
        kg1: 800,
        kg2: 400,
        kp: 500,
        kvb: 250,
        a: 0.5,
        alphaS: 0.1,
        beta: 0.2,
        secondaryEmission: true,
        s: 1.2,
        alphaP: 0.3,
        lambda: 0.001,
        v: 0.8,
        w: 0.6,
        calculatedOn: '2023-10-01T12:00:00Z',
        rmse: 0.6
    };

    beforeEach(async () => {
        const modelServiceSpy = jasmine.createSpyObj('ModelService', [
            'getDerkModel',
            'getDerkModelDefinition'
        ]);

        await TestBed.configureTestingModule({
            imports: [DerkPentodeModelParametersComponent],
            providers: [
                { provide: ModelService, useValue: modelServiceSpy }
            ]
        }).compileComponents();

        modelService = TestBed.inject(ModelService) as jasmine.SpyObj<ModelService>;
        fixture = TestBed.createComponent(DerkPentodeModelParametersComponent);
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

        it('should display secondary emission checkbox', () => {
            // arrange
            const checkbox = compiled.query(By.css('#secondaryEmissionCheck'));

            // assert
            expect(checkbox).toBeTruthy();
        });

        it('should have secondary emission checkbox unchecked by default', () => {
            // arrange
            const checkbox = compiled.query(By.css('#secondaryEmissionCheck'));

            // assert
            expect(checkbox.nativeElement.checked).toBe(false);
        });

        it('should display secondary emission label', () => {
            // arrange
            const label = compiled.query(By.css('label[for="secondaryEmissionCheck"]'));

            // assert
            expect(label).toBeTruthy();
            expect(label.nativeElement.textContent).toContain('Include Secondary Emission Effects');
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
            const helperTexts = compiled.queryAll(By.css('.form-text'));
            const dataRequirementText = helperTexts.find(el =>
                el.nativeElement.textContent.includes('Requires pentode measurement data')
            );

            // assert
            expect(dataRequirementText).toBeTruthy();
            expect(dataRequirementText?.nativeElement.textContent).toContain('Derk Reefman model parameters');
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

        it('should not display secondary emission checkbox when calculating', () => {
            // arrange
            const checkbox = compiled.query(By.css('#secondaryEmissionCheck'));

            // assert
            expect(checkbox).toBeFalsy();
        });
    });

    describe('Calculated state (with parameters)', () => {
        beforeEach(() => {
            // arrange
            component.tube = {
                ...mockTube,
                derkModelParameters: { ...mockDerkModelParameters }
            };
            component.isCalculating = false;
            component.canCalculate = true;

            modelService.getDerkModel.and.returnValue({
                name: 'EL500_DERK',
                model: '.subckt EL500_DERK P G2 G1 K\nG1 G1 K VALUE={PWR(V(P,K)/KP,EX) + V(G1,K)/MU}\nE1 1 0 VALUE={V(G1,K)/KG1*LOG(1+EXP(KG1*V(G1)))}\nRE1 1 0 1G\nGP P K VALUE={V(1)/KVB*ATAN(V(P,K)/KVB)}\n.ends'
            });
            modelService.getDerkModelDefinition.and.returnValue('.param KP=500 MU=70 EX=1.5 KG1=800 KG2=400 KVB=250 A=0.5');

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

        it('should display secondary emission checkbox in calculated state', () => {
            // arrange
            const checkbox = compiled.query(By.css('#secondaryEmissionCheckCalculated'));

            // assert
            expect(checkbox).toBeTruthy();
        });

        it('should reflect secondary emission state from parameters', () => {
            // arrange
            const checkbox = compiled.query(By.css('#secondaryEmissionCheckCalculated'));

            // assert
            expect(checkbox.nativeElement.checked).toBe(true);
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
            expect(preElement.nativeElement.textContent).toContain('.subckt EL500_DERK');
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

        it('should display helper text about recalculation after checkbox change', () => {
            // arrange
            const helperTexts = compiled.queryAll(By.css('.form-text'));
            const recalculateText = helperTexts.find(el =>
                el.nativeElement.textContent.includes('Click Recalculate to apply changes')
            );

            // assert
            expect(recalculateText).toBeTruthy();
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
        it('should delete derkModelParameters from tube', () => {
            // arrange
            component.tube = {
                ...mockTube,
                derkModelParameters: { ...mockDerkModelParameters }
            };

            // act
            component.resetParameters();

            // assert
            expect(component.tube.derkModelParameters).toBeUndefined();
        });

        it('should handle undefined tube gracefully', () => {
            // arrange
            component.tube = undefined;

            // act & assert
            expect(() => component.resetParameters()).not.toThrow();
        });

        it('should handle tube without derkModelParameters', () => {
            // arrange
            component.tube = { ...mockTube };

            // act & assert
            expect(() => component.resetParameters()).not.toThrow();
            expect(component.tube.derkModelParameters).toBeUndefined();
        });

        it('should trigger UI update after reset', () => {
            // arrange
            component.tube = {
                ...mockTube,
                derkModelParameters: { ...mockDerkModelParameters }
            };

            modelService.getDerkModel.and.returnValue({
                name: 'EL500_DERK',
                model: '.subckt EL500_DERK P G2 G1 K\n...\n.ends'
            });
            modelService.getDerkModelDefinition.and.returnValue('.param KP=500 MU=70');

            fixture.detectChanges();

            // act
            component.resetParameters();

            modelService.getDerkModel.and.returnValue({
                name: '',
                model: ''
            });
            modelService.getDerkModelDefinition.and.returnValue('');

            fixture.detectChanges();

            // assert
            expect(component.tube.derkModelParameters).toBeUndefined();
        });
    });

    describe('spiceModel getter', () => {
        beforeEach(() => {
            // arrange
            component.tube = {
                ...mockTube,
                derkModelParameters: { ...mockDerkModelParameters }
            };

            modelService.getDerkModel.and.returnValue({
                name: 'EL500_DERK',
                model: '.subckt EL500_DERK P G2 G1 K\n...\n.ends'
            });
            modelService.getDerkModelDefinition.and.returnValue('.param KP=500 MU=70');
        });

        it('should call modelService.getDerkModel with tube', () => {
            // act
            void component.spiceModel;

            // assert
            expect(modelService.getDerkModel).toHaveBeenCalledWith(component.tube);
        });

        it('should call modelService.getDerkModelDefinition with secondary emission flag', () => {
            // act
            void component.spiceModel;

            // assert
            expect(modelService.getDerkModelDefinition).toHaveBeenCalledWith(true);
        });

        it('should pass false to getDerkModelDefinition when secondary emission is disabled', () => {
            // arrange
            component.tube = {
                ...mockTube,
                derkModelParameters: {
                    ...mockDerkModelParameters,
                    secondaryEmission: false
                }
            };

            // act
            void component.spiceModel;

            // assert
            expect(modelService.getDerkModelDefinition).toHaveBeenCalledWith(false);
        });

        it('should combine model and definition with double newline separator', () => {
            // act
            const result = component.spiceModel;

            // assert
            expect(result).toBe('.subckt EL500_DERK P G2 G1 K\n...\n.ends\n\n.param KP=500 MU=70');
        });

        it('should handle empty model gracefully', () => {
            // arrange
            modelService.getDerkModel.and.returnValue({
                name: 'TEST',
                model: ''
            });
            modelService.getDerkModelDefinition.and.returnValue('');

            // act
            const result = component.spiceModel;

            // assert
            expect(result).toBe('\n\n');
        });
    });

    describe('secondaryEmission getter/setter', () => {
        beforeEach(() => {
            component.tube = { ...mockTube };
        });

        it('should return false when tube has no derkModelParameters', () => {
            // act
            const result = component.secondaryEmission;

            // assert
            expect(result).toBe(false);
        });

        it('should return false when derkModelParameters exists but secondaryEmission is not set', () => {
            // arrange
            component.tube = {
                ...mockTube,
                derkModelParameters: {}
            };

            // act
            const result = component.secondaryEmission;

            // assert
            expect(result).toBe(false);
        });

        it('should return true when secondaryEmission is set to true', () => {
            // arrange
            component.tube = {
                ...mockTube,
                derkModelParameters: {
                    secondaryEmission: true
                }
            };

            // act
            const result = component.secondaryEmission;

            // assert
            expect(result).toBe(true);
        });

        it('should return false when secondaryEmission is set to false', () => {
            // arrange
            component.tube = {
                ...mockTube,
                derkModelParameters: {
                    secondaryEmission: false
                }
            };

            // act
            const result = component.secondaryEmission;

            // assert
            expect(result).toBe(false);
        });

        it('should set secondaryEmission to true', () => {
            // act
            component.secondaryEmission = true;

            // assert
            expect(component.tube?.derkModelParameters?.secondaryEmission).toBe(true);
        });

        it('should set secondaryEmission to false', () => {
            // act
            component.secondaryEmission = false;

            // assert
            expect(component.tube?.derkModelParameters?.secondaryEmission).toBe(false);
        });

        it('should create derkModelParameters object if it does not exist', () => {
            // act
            component.secondaryEmission = true;

            // assert
            expect(component.tube?.derkModelParameters).toBeDefined();
            expect(component.tube?.derkModelParameters?.secondaryEmission).toBe(true);
        });

        it('should handle undefined tube gracefully in setter', () => {
            // arrange
            component.tube = undefined;

            // act & assert
            expect(() => { component.secondaryEmission = true; }).not.toThrow();
        });
    });

    describe('onSecondaryEmissionChange()', () => {
        beforeEach(() => {
            component.tube = { ...mockTube };
        });

        it('should update secondaryEmission when checkbox is checked', () => {
            // arrange
            const event = {
                target: { checked: true } as HTMLInputElement
            } as unknown as Event;

            // act
            component.onSecondaryEmissionChange(event);

            // assert
            expect(component.secondaryEmission).toBe(true);
        });

        it('should update secondaryEmission when checkbox is unchecked', () => {
            // arrange
            component.tube = {
                ...mockTube,
                derkModelParameters: { secondaryEmission: true }
            };
            const event = {
                target: { checked: false } as HTMLInputElement
            } as unknown as Event;

            // act
            component.onSecondaryEmissionChange(event);

            // assert
            expect(component.secondaryEmission).toBe(false);
        });

        it('should invalidate calculatedOn when checkbox changes and parameters exist', () => {
            // arrange
            component.tube = {
                ...mockTube,
                derkModelParameters: {
                    ...mockDerkModelParameters,
                    calculatedOn: '2023-10-01T12:00:00Z'
                }
            };
            const event = {
                target: { checked: false } as HTMLInputElement
            } as unknown as Event;

            // act
            component.onSecondaryEmissionChange(event);

            // assert
            expect(component.tube?.derkModelParameters?.calculatedOn).toBeUndefined();
        });

        it('should not throw when derkModelParameters does not exist', () => {
            // arrange
            const event = {
                target: { checked: true } as HTMLInputElement
            } as unknown as Event;

            // act & assert
            expect(() => component.onSecondaryEmissionChange(event)).not.toThrow();
        });

        it('should create derkModelParameters if it does not exist when checkbox is changed', () => {
            // arrange
            const event = {
                target: { checked: true } as HTMLInputElement
            } as unknown as Event;

            // act
            component.onSecondaryEmissionChange(event);

            // assert
            expect(component.tube?.derkModelParameters).toBeDefined();
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
        it('should handle tube with null derkModelParameters', () => {
            // arrange
            component.tube = {
                ...mockTube,
                derkModelParameters: undefined
            };
            component.isCalculating = false;

            // act
            fixture.detectChanges();

            // assert
            const notCalculatedMessage = compiled.query(By.css('.text-muted'));
            expect(notCalculatedMessage).toBeTruthy();
        });

        it('should handle tube with derkModelParameters but no calculatedOn', () => {
            // arrange
            component.tube = {
                ...mockTube,
                derkModelParameters: {
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

        it('should handle both isCalculating and tube.derkModelParameters (calculating should take precedence)', () => {
            // arrange
            component.tube = {
                ...mockTube,
                derkModelParameters: { ...mockDerkModelParameters }
            };
            component.isCalculating = true;

            modelService.getDerkModel.and.returnValue({
                name: 'EL500_DERK',
                model: '.subckt EL500_DERK P G2 G1 K\n...\n.ends'
            });
            modelService.getDerkModelDefinition.and.returnValue('.param KP=500 MU=70');

            // act
            fixture.detectChanges();

            // assert
            const spinner = compiled.query(By.css('.spinner-border'));
            expect(spinner).toBeTruthy();
        });

        it('should preserve secondary emission when switching between not calculated and calculated states', () => {
            // arrange
            component.tube = {
                ...mockTube,
                derkModelParameters: { secondaryEmission: true }
            };
            component.isCalculating = false;

            modelService.getDerkModel.and.returnValue({
                name: 'EL500_DERK',
                model: '.subckt EL500_DERK P G2 G1 K\n...\n.ends'
            });
            modelService.getDerkModelDefinition.and.returnValue('.param KP=500 MU=70');

            // act
            fixture.detectChanges();

            // assert
            const checkbox = compiled.query(By.css('#secondaryEmissionCheck'));
            expect(checkbox.nativeElement.checked).toBe(true);
        });
    });
});
