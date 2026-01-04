import {
    AdcData,
    Averaging,
    plateVoltageDividerV3,
    plateVoltageDividerV3p,
    screenVoltageDividerV3,
    screenVoltageDividerV3p,
    UTracerService
} from './utracer.service';
import { SettingsService } from './settings.service';
import { TestBed } from '@angular/core/testing';

function makeAdc(override: Record<string, number | number[]> = {}): AdcData {
    // defaults
    const value = {
        status: 0,
        plateCurrentBytes: [0, 0],
        plateCurrent: 0,
        plateCurrentRawBytes: [0, 0],
        plateCurrentRaw: 0,
        screenCurrentBytes: [0, 0],
        screenCurrent: 0,
        screenCurrentRawBytes: [0, 0],
        screenCurrentRaw: 0,
        plateVoltageBytes: [0, 0],
        plateVoltage: 0,
        screenVoltageBytes: [0, 0],
        screenVoltage: 0,
        powerSupplyVoltageBytes: [0, 0],
        powerSupplyVoltage: 0,
        negativeVoltageBytes: [0, 0],
        negativeVoltage: 0,
        plateCurrentGain: 0,
        screenCurrentGain: 0
    };
    return { ...value, ...override } as AdcData;
}

describe('UTracerService', () => {

    const settingsService = jasmine.createSpyObj<SettingsService>('SettingsService', ['get', 'set']);
    settingsService.get.and.returnValue(null);
    settingsService.set.and.stub();

    let service: UTracerService;

    beforeEach(() => {
        // configure angular service
        TestBed.configureTestingModule({
            providers: [
                UTracerService,
                { provide: SettingsService, useValue: settingsService }
            ]
        });
        service = TestBed.inject(UTracerService);
    });

    describe('UTracerService.readAverage', () => {

        it('returns average for automatic averaging based in measured current gain', () => {
            // act, assert
            expect(service.readAverage(0, 0x40)).toBe(1);
            expect(service.readAverage(1, 0x40)).toBe(1);
            expect(service.readAverage(2, 0x40)).toBe(1);
            expect(service.readAverage(3, 0x40)).toBe(1);
            expect(service.readAverage(4, 0x40)).toBe(2);
            expect(service.readAverage(5, 0x40)).toBe(2);
            expect(service.readAverage(6, 0x40)).toBe(4);
            expect(service.readAverage(7, 0x40)).toBe(8);
        });

        it('returns average for non automatic averaging', () => {
            // act, assert
            expect(service.readAverage(0, 0)).toBe(1);
            expect(service.readAverage(0, 2)).toBe(2);
            expect(service.readAverage(0, 4)).toBe(4);
            expect(service.readAverage(0, 8)).toBe(8);
            expect(service.readAverage(0, 16)).toBe(16);
            expect(service.readAverage(0, 32)).toBe(32);
        });
    });

    describe('UTracerService.readGain', () => {

        it('returns gain for measured current', () => {
            // act, assert
            expect(service.readGain(10)).toBe(200);
            expect(service.readGain(0)).toBe(1);
            expect(service.readGain(1)).toBe(2);
            expect(service.readGain(2)).toBe(5);
            expect(service.readGain(3)).toBe(10);
            expect(service.readGain(4)).toBe(20);
            expect(service.readGain(5)).toBe(50);
            expect(service.readGain(6)).toBe(100);
            expect(service.readGain(7)).toBe(200);
        });
    });


    describe('UTracerService.readPlateVoltage', () => {

        it('returns 0 when ADC value is 0', () => {
            // arrange
            const adc = makeAdc({powerSupplyVoltage: 0});
            // act
            const result = service.readPowerSupplyVoltage(adc);
            // assert
            expect(result).toBe(0);
        });

        it('returns expected max voltage for ADC=1023 using default calibration', () => {
            // arrange
            const adc = makeAdc({powerSupplyVoltage: 1023});
            // act
            const result = service.readPowerSupplyVoltage(adc);
            // assert
            expect(result).toBeCloseTo(23.89, 2);
        });

        it('returns voltage for ADC=872 using default calibration', () => {
            // arrange
            const adc = makeAdc({powerSupplyVoltage: 872});
            // act
            const result = service.readPowerSupplyVoltage(adc);
            // assert
            expect(result).toBeCloseTo(20.36, 2);
        });

        it('returns voltage for ADC=872 using calibration', () => {
            // arrange
            const adc = makeAdc({powerSupplyVoltage: 872});
            spyOnProperty(service, 'powerSupplyVoltageGain', 'get').and.returnValue(1.1);
            // act
            const result = service.readPowerSupplyVoltage(adc);
            // assert
            expect(result).toBeCloseTo(22.40, 2);
        });
    });

    describe('UTracerService.readPlateVoltage', () => {

        it('computes plate voltage when plate and power supply ADC are zero', () => {
            // arrange
            const adc = makeAdc({ plateVoltage: 0, powerSupplyVoltage: 0 });
            const averaging: Averaging = 0;
            // act
            const result = service.readPlateVoltage(adc, averaging);
            // assert
            expect(result).toBeCloseTo(0.20, 2);
        });

        it('computes plate voltage for max plate ADC with zero power supply ADC - V3', () => {
            // arrange
            const adc = makeAdc({ plateVoltage: 1023, powerSupplyVoltage: 0 });
            spyOnProperty(service, 'plateVoltageDivider', 'get').and.returnValue(plateVoltageDividerV3);
            const averaging: Averaging = 0;
            // act
            const result = service.readPlateVoltage(adc, averaging);
            // assert
            expect(result).toBeCloseTo(350.79, 2);
        });

        it('computes plate voltage for max plate ADC with zero power supply ADC - V3+', () => {
            // arrange
            const adc = makeAdc({ plateVoltage: 1023, powerSupplyVoltage: 0 });
            spyOnProperty(service, 'plateVoltageDivider', 'get').and.returnValue(plateVoltageDividerV3p);
            const averaging: Averaging = 0;
            // act
            const result = service.readPlateVoltage(adc, averaging);
            // assert
            expect(result).toBeCloseTo(454.53, 2);
        });

        it('computes plate voltage for plate ADC=872 and power supply ADC=512', () => {
            // arrange
            const adc = makeAdc({ plateVoltage: 872, powerSupplyVoltage: 20.0 });
            const averaging: Averaging = 0x40;
            // act
            const result = service.readPlateVoltage(adc, averaging);
            // assert
            expect(result).toBeCloseTo(298.57, 2);
        });

        it('respects custom plateVoltageGain', () => {
            // arrange
            const adc = makeAdc({ plateVoltage: 872, powerSupplyVoltage: 20.0 });
            spyOnProperty(service, 'plateVoltageGain', 'get').and.returnValue(1.1);
            const averaging: Averaging = 0;
            // act
            const result = service.readPlateVoltage(adc, averaging);
            // assert
            expect(result).toBeCloseTo(328.46, 2);
        });
    });

    describe('UTracerService.readScreenVoltage', () => {

        it('computes screen voltage when screen and power supply ADC are zero', () => {
            // arrange
            const adc = makeAdc({ screenVoltage: 0, powerSupplyVoltage: 0 });
            const averaging: Averaging = 0;
            // act
            const result = service.readScreenVoltage(adc, averaging);
            // assert
            expect(result).toBeCloseTo(0.20, 2);
        });

        it('computes screen voltage for max screen ADC with zero power supply ADC - V3', () => {
            // arrange
            const adc = makeAdc({ screenVoltage: 1023, powerSupplyVoltage: 0 });
            spyOnProperty(service, 'screenVoltageDivider', 'get').and.returnValue(screenVoltageDividerV3);
            const averaging: Averaging = 0;
            // act
            const result = service.readScreenVoltage(adc, averaging);
            // assert
            expect(result).toBeCloseTo(350.79, 2);
        });

        it('computes screen voltage for max screen ADC with zero power supply ADC - V3+', () => {
            // arrange
            const adc = makeAdc({ screenVoltage: 1023, powerSupplyVoltage: 0 });
            spyOnProperty(service, 'screenVoltageDivider', 'get').and.returnValue(screenVoltageDividerV3p);
            const averaging: Averaging = 0;
            // act
            const result = service.readScreenVoltage(adc, averaging);
            // assert
            expect(result).toBeCloseTo(454.53, 2);
        });

        it('computes screen voltage for screen ADC=872 and power supply ADC=512', () => {
            // arrange
            const adc = makeAdc({ screenVoltage: 872, powerSupplyVoltage: 20.0 });
            const averaging: Averaging = 0;
            // act
            const result = service.readScreenVoltage(adc, averaging);
            // assert
            expect(result).toBeCloseTo(298.57, 2);
        });

        it('respects custom screenVoltageGain', () => {
            // arrange
            const adc = makeAdc({ screenVoltage: 872, powerSupplyVoltage: 20.0 });
            spyOnProperty(service, 'screenVoltageGain', 'get').and.returnValue(1.1);
            const averaging: Averaging = 0;
            // act
            const result = service.readScreenVoltage(adc, averaging);
            // assert
            expect(result).toBeCloseTo(328.46, 2);
        });
    });

    describe('UTracerService.calculatePlateBytes', () => {

        it('computes ADC values for zero plate and power supply voltages', () => {
            // arrange
            const powerSupplyVoltage = 0;
            const plateVoltage = 0.20;
            // act
            const result = service.calculatePlateBytes(powerSupplyVoltage, plateVoltage);
            // assert
            expect(result).toEqual([0, 0]);
        });

        it('computes ADC values for max plate voltage with zero power supply voltage - V3', () => {
            // arrange
            const powerSupplyVoltage = 0;
            const plateVoltage = 350.79;
            // act
            const result = service.calculatePlateBytes(powerSupplyVoltage, plateVoltage);
            // assert
            expect(result).toEqual([0x03, 0xFF]);
        });

        it('computes ADC values for max plate voltage with zero power supply voltage - V3+', () => {
            // arrange
            const powerSupplyVoltage = 0;
            const plateVoltage = 454.54;
            spyOnProperty(service, 'plateVoltageDivider', 'get').and.returnValue(plateVoltageDividerV3p);
            // act
            const result = service.calculatePlateBytes(powerSupplyVoltage, plateVoltage);
            // assert
            expect(result).toEqual([0x03, 0xFF]);
        });

        it('computes ADC values for max plate voltage and power supply voltage=20.0 - V3', () => {
            // arrange
            const powerSupplyVoltage = 20.0;
            const plateVoltage = 350.79;
            // act
            const result = service.calculatePlateBytes(powerSupplyVoltage, plateVoltage);
            // assert
            expect(result).toEqual([0x03, 0xFF]);
        });

        it('computes ADC values for max plate voltage and power supply voltage=20.0 - V3+', () => {
            // arrange
            const powerSupplyVoltage = 20.0;
            const plateVoltage = 454.54;
            spyOnProperty(service, 'plateVoltageDivider', 'get').and.returnValue(plateVoltageDividerV3p);
            // act
            const result = service.calculatePlateBytes(powerSupplyVoltage, plateVoltage);
            // assert
            expect(result).toEqual([0x03, 0xFF]);
        });
    });

    describe('UTracerService.calculateScreenBytes', () => {

        it('computes ADC values for zero screen and power supply voltages', () => {
            // arrange
            const powerSupplyVoltage = 0;
            const screenVoltage = 0.20;
            // act
            const result = service.calculateScreenBytes(powerSupplyVoltage, screenVoltage);
            // assert
            expect(result).toEqual([0, 0]);
        });

        it('computes ADC values for max screen voltage with zero power supply voltage - V3', () => {
            // arrange
            const powerSupplyVoltage = 0;
            const screenVoltage = 350.79;
            // act
            const result = service.calculateScreenBytes(powerSupplyVoltage, screenVoltage);
            // assert
            expect(result).toEqual([0x03, 0xFF]);
        });

        it('computes ADC values for max screen voltage with zero power supply voltage - V3+', () => {
            // arrange
            const powerSupplyVoltage = 0;
            const screenVoltage = 454.54;
            spyOnProperty(service, 'screenVoltageDivider', 'get').and.returnValue(screenVoltageDividerV3p);
            // act
            const result = service.calculateScreenBytes(powerSupplyVoltage, screenVoltage);
            // assert
            expect(result).toEqual([0x03, 0xFF]);
        });

        it('computes ADC values for max screen voltage and power supply voltage=20.0', () => {
            // arrange
            const powerSupplyVoltage = 20.0;
            const screenVoltage = 350.79;
            // act
            const result = service.calculateScreenBytes(powerSupplyVoltage, screenVoltage);
            // assert
            expect(result).toEqual([0x03, 0xFF]);
        });

        it('computes ADC values for max screen voltage and power supply voltage=20.0 - V3+', () => {
            // arrange
            const powerSupplyVoltage = 20.0;
            const screenVoltage = 454.54;
            spyOnProperty(service, 'screenVoltageDivider', 'get').and.returnValue(screenVoltageDividerV3p);
            // act
            const result = service.calculateScreenBytes(powerSupplyVoltage, screenVoltage);
            // assert
            expect(result).toEqual([0x03, 0xFF]);
        });
    });

    describe('UTracerService.calculateHeaterBytes', () => {

        it('returns [0, 0] when power supply voltage is zero (division by zero protection)', () => {
            // arrange
            const powerSupplyVoltage = 0;
            const heaterVoltage = 6.3;
            // act
            const result = service.calculateHeaterBytes(powerSupplyVoltage, heaterVoltage);
            // assert
            expect(result).toEqual([0, 0]);
        });

        it('computes PWM value for zero heater voltage', () => {
            // arrange
            const powerSupplyVoltage = 24.0;
            const heaterVoltage = 0;
            // act
            const result = service.calculateHeaterBytes(powerSupplyVoltage, heaterVoltage);
            // assert
            expect(result).toEqual([0, 0]);
        });

        it('computes PWM value for full heater voltage equal to power supply (100% duty cycle)', () => {
            // arrange
            const powerSupplyVoltage = 24.0;
            const heaterVoltage = 24.0;
            // act
            const result = service.calculateHeaterBytes(powerSupplyVoltage, heaterVoltage);
            // assert
            expect(result).toEqual([0x03, 0xFF]);
        });

        it('computes PWM value for half heater voltage (50% duty cycle)', () => {
            // arrange
            const powerSupplyVoltage = 24.0;
            const heaterVoltage = 12.0;
            // act
            const result = service.calculateHeaterBytes(powerSupplyVoltage, heaterVoltage);
            // assert
            expect(result).toEqual([0, 0xFF]);
        });

        it('computes PWM value for heater voltage=6.3V with powerSupply=20.0V', () => {
            // arrange
            const powerSupplyVoltage = 20.0;
            const heaterVoltage = 6.3;
            // act
            const result = service.calculateHeaterBytes(powerSupplyVoltage, heaterVoltage);
            // assert
            expect(result).toEqual([0, 101]);
        });

        it('computes PWM value for heater voltage=12.6V with powerSupply=20.0V', () => {
            // arrange
            const powerSupplyVoltage = 20.0;
            const heaterVoltage = 12.6;
            // act
            const result = service.calculateHeaterBytes(powerSupplyVoltage, heaterVoltage);
            // assert
            expect(result).toEqual([1, 150]);
        });

        it('clamps result to max 10-bit value (1023) when voltage exceeds power supply', () => {
            // arrange
            const powerSupplyVoltage = 20.0;
            const heaterVoltage = 30.0;  // exceeds power supply
            // act
            const result = service.calculateHeaterBytes(powerSupplyVoltage, heaterVoltage);
            // assert
            expect(result).toEqual([0x03, 0xFF]);
        });

        it('computes PWM value for low heater voltage (1V with 20V power supply)', () => {
            // arrange
            const powerSupplyVoltage = 20.0;
            const heaterVoltage = 1.0;
            // act
            const result = service.calculateHeaterBytes(powerSupplyVoltage, heaterVoltage);
            // assert
            expect(result).toEqual([0, 2]);
        });

        it('respects PWM scaling formula: n = 1023 * (voltage/powerSupply)^2', () => {
            // arrange
            const powerSupplyVoltage = 25.2;
            const heaterVoltage = 6.3;
            // act
            const result = service.calculateHeaterBytes(powerSupplyVoltage, heaterVoltage);
            // assert
            expect(result).toEqual([0, 63]);
        });
    });

    describe('UTracerService.calculateGridBytes', () => {

        it('computes bytes for zero grid voltage (boundary case)', () => {
            // arrange
            const negativeSupplyVoltage = -50;
            const gridVoltage = 0;
            // act
            const result = service.calculateGridBytes(negativeSupplyVoltage, gridVoltage);
            // assert
            expect(result).toEqual([0, 0]);
        });

        it('computes bytes for grid voltage in first range (-1 < V < 0): -0.5V', () => {
            // arrange
            const negativeSupplyVoltage = -50;
            const gridVoltage = -0.5;
            spyOnProperty(service, 'grid1VoltVoltageGain', 'get').and.returnValue(1.0);
            // act
            const result = service.calculateGridBytes(negativeSupplyVoltage, gridVoltage);
            // assert
            expect(result).toEqual([0, 10]);
        });

        it('computes bytes for grid voltage at boundary: exactly -1V', () => {
            // arrange
            const negativeSupplyVoltage = -50;
            const gridVoltage = -1;
            spyOnProperty(service, 'grid1VoltVoltageGain', 'get').and.returnValue(1.0);
            spyOnProperty(service, 'grid4VoltVoltageGain', 'get').and.returnValue(1.0);
            // act
            const result = service.calculateGridBytes(negativeSupplyVoltage, gridVoltage);
            // assert
            expect(result).toEqual([0, 20]);
        });

        it('computes bytes for grid voltage in second range (-4 < V <= -1): -2V', () => {
            // arrange
            const negativeSupplyVoltage = -50;
            const gridVoltage = -2;
            spyOnProperty(service, 'grid1VoltVoltageGain', 'get').and.returnValue(1.0);
            spyOnProperty(service, 'grid4VoltVoltageGain', 'get').and.returnValue(1.0);
            // act
            const result = service.calculateGridBytes(negativeSupplyVoltage, gridVoltage);
            // assert
            expect(result).toEqual([0, 40]);
        });

        it('computes bytes for grid voltage in second range (-4 < V <= -1): -3.5V', () => {
            // arrange
            const negativeSupplyVoltage = -50;
            const gridVoltage = -3.5;
            spyOnProperty(service, 'grid1VoltVoltageGain', 'get').and.returnValue(1.0);
            spyOnProperty(service, 'grid4VoltVoltageGain', 'get').and.returnValue(1.0);
            // act
            const result = service.calculateGridBytes(negativeSupplyVoltage, gridVoltage);
            // assert
            expect(result).toEqual([0, 71]);
        });

        it('computes bytes for grid voltage at boundary: exactly -4V', () => {
            // arrange
            const negativeSupplyVoltage = -50;
            const gridVoltage = -4;
            spyOnProperty(service, 'grid1VoltVoltageGain', 'get').and.returnValue(1.0);
            spyOnProperty(service, 'grid4VoltVoltageGain', 'get').and.returnValue(1.0);
            spyOnProperty(service, 'grid40VoltVoltageGain', 'get').and.returnValue(1.0);
            // act
            const result = service.calculateGridBytes(negativeSupplyVoltage, gridVoltage);
            // assert
            expect(result).toEqual([0, 81]);
        });

        it('computes bytes for grid voltage in third range (-40 < V <= -4): -10V', () => {
            // arrange
            const negativeSupplyVoltage = -50;
            const gridVoltage = -10;
            spyOnProperty(service, 'grid4VoltVoltageGain', 'get').and.returnValue(1.0);
            spyOnProperty(service, 'grid40VoltVoltageGain', 'get').and.returnValue(1.0);
            // act
            const result = service.calculateGridBytes(negativeSupplyVoltage, gridVoltage);
            // assert
            expect(result).toEqual([0, 204]);
        });

        it('computes bytes for grid voltage in third range (-40 < V <= -4): -20V', () => {
            // arrange
            const negativeSupplyVoltage = -50;
            const gridVoltage = -20;
            spyOnProperty(service, 'grid4VoltVoltageGain', 'get').and.returnValue(1.0);
            spyOnProperty(service, 'grid40VoltVoltageGain', 'get').and.returnValue(1.0);
            // act
            const result = service.calculateGridBytes(negativeSupplyVoltage, gridVoltage);
            // assert
            expect(result).toEqual([1, 153]);
        });

        it('computes bytes for grid voltage near maximum: -40V', () => {
            // arrange
            const negativeSupplyVoltage = -50;
            const gridVoltage = -40;
            spyOnProperty(service, 'grid4VoltVoltageGain', 'get').and.returnValue(1.0);
            spyOnProperty(service, 'grid40VoltVoltageGain', 'get').and.returnValue(1.0);
            // act
            const result = service.calculateGridBytes(negativeSupplyVoltage, gridVoltage);
            // assert
            expect(result).toEqual([3, 50]);
        });

        it('respects custom grid1VoltVoltageGain for first range', () => {
            // arrange
            const negativeSupplyVoltage = -50;
            const gridVoltage = -0.5;
            spyOnProperty(service, 'grid1VoltVoltageGain', 'get').and.returnValue(1.1);
            // act
            const result = service.calculateGridBytes(negativeSupplyVoltage, gridVoltage);
            // assert
            expect(result).toEqual([0, 11]);
        });

        it('respects custom grid4VoltVoltageGain for second range', () => {
            // arrange
            const negativeSupplyVoltage = -50;
            const gridVoltage = -2;
            spyOnProperty(service, 'grid1VoltVoltageGain', 'get').and.returnValue(1.0);
            spyOnProperty(service, 'grid4VoltVoltageGain', 'get').and.returnValue(1.2);
            // act
            const result = service.calculateGridBytes(negativeSupplyVoltage, gridVoltage);
            // assert
            expect(result).toEqual([0, 46]);
        });

        it('respects custom grid40VoltVoltageGain for third range', () => {
            // arrange
            const negativeSupplyVoltage = -50;
            const gridVoltage = -10;
            spyOnProperty(service, 'grid4VoltVoltageGain', 'get').and.returnValue(1.0);
            spyOnProperty(service, 'grid40VoltVoltageGain', 'get').and.returnValue(1.1);
            // act
            const result = service.calculateGridBytes(negativeSupplyVoltage, gridVoltage);
            // assert
            expect(result).toEqual([0, 218]);
        });

        it('respects varying negativeSupplyVoltage parameter', () => {
            // arrange
            const negativeSupplyVoltage = -40;
            const gridVoltage = -0.5;
            spyOnProperty(service, 'grid1VoltVoltageGain', 'get').and.returnValue(1.0);
            // act
            const result = service.calculateGridBytes(negativeSupplyVoltage, gridVoltage);
            // assert
            expect(result).toEqual([0, 12]);
        });

        it('clamps result to max 10-bit value (1023) for first range', () => {
            // arrange
            const negativeSupplyVoltage = -50;
            const gridVoltage = -0.1;
            spyOnProperty(service, 'grid1VoltVoltageGain', 'get').and.returnValue(100.0);
            // act
            const result = service.calculateGridBytes(negativeSupplyVoltage, gridVoltage);
            // assert
            expect(result).toEqual([0, 204]);
        });

        it('clamps result to max 10-bit value (1023) for second range', () => {
            // arrange
            const negativeSupplyVoltage = -50;
            const gridVoltage = -2;
            spyOnProperty(service, 'grid1VoltVoltageGain', 'get').and.returnValue(1.0);
            spyOnProperty(service, 'grid4VoltVoltageGain', 'get').and.returnValue(100.0);
            // act
            const result = service.calculateGridBytes(negativeSupplyVoltage, gridVoltage);
            // assert
            expect(result).toEqual([0x03, 0xFF]);
        });

        it('clamps result to max 10-bit value (1023) for third range', () => {
            // arrange
            const negativeSupplyVoltage = -50;
            const gridVoltage = -20;
            spyOnProperty(service, 'grid4VoltVoltageGain', 'get').and.returnValue(1.0);
            spyOnProperty(service, 'grid40VoltVoltageGain', 'get').and.returnValue(100.0);
            // act
            const result = service.calculateGridBytes(negativeSupplyVoltage, gridVoltage);
            // assert
            expect(result).toEqual([0x03, 0xFF]);
        });
    });
});
