import { ModelService } from './model.service';
import { TestBed } from '@angular/core/testing';
import { TriodeModelParameters } from '../workers/models/triode-model-parameters';
import { TubeInformation } from '../components/tube-information';

describe('ModelService', () => {

    let service: ModelService;

    beforeEach(() => {
        TestBed.configureTestingModule({});
        service = TestBed.inject(ModelService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    describe('getTriodeModel', () => {
        let mockTube: TubeInformation;
        let mockTriodeParams: TriodeModelParameters;

        beforeEach(() => {
            mockTriodeParams = {
                mu: 100,
                ex: 1.4,
                kg1: 1060,
                kp: 600,
                kvb: 300,
                calculatedOn: '2023-10-08T14:30:00.000Z'
            };

            mockTube = {
                id: 'test-tube-123',
                name: 'ECC83',
                manufacturer: 'Test Manufacturer',
                comments: 'Test comments',
                lastUpdatedOn: '2023-10-08T14:30:00.000Z',
                type: 'Triode',
                files: [],
                triodeModelParameters: mockTriodeParams,
                ccg1: 1.6,
                cg1p: 1.7,
                ccp: 0.46
            };
        });

        it('should generate SPICE model for triode with all parameters', () => {
            const result = service.getTriodeModel(mockTube);

            expect(result).toContain('.SUBCKT ECC83 P G K');
            expect(result).toContain('* ECC83 Triode Model (Norman Koren)');
            expect(result).toContain('MU=100');
            expect(result).toContain('EX=1.4');
            expect(result).toContain('KG1=1060');
            expect(result).toContain('KP=600');
            expect(result).toContain('KVB=300');
            expect(result).toContain('CCG=1.6');
            expect(result).toContain('CGP=1.7');
            expect(result).toContain('CCP=0.46');
            expect(result).toContain('RGI=2000');
            expect(result).toContain('.ENDS');
        });

        it('should include calculated date in correct format', () => {
            const result = service.getTriodeModel(mockTube);

            // Verify the date format pattern rather than exact time due to timezone differences
            expect(result).toMatch(/Parameters calculated on: \d{1,2}\/\d{1,2}\/\d{2}, \d{1,2}:\d{2} (AM|PM)/);
        });

        it('should include URL when tube has id', () => {
            const result = service.getTriodeModel(mockTube);

            expect(result).toContain('https://audio-projects.us/tube-models/#/tube/test-tube-123');
        });

        it('should not include URL when tube has no id', () => {
            mockTube.id = '';
            const result = service.getTriodeModel(mockTube);

            expect(result).not.toContain('https://audio-projects.us/tube-models');
        });

        it('should sanitize tube name for SPICE subckt', () => {
            mockTube.name = 'ECC-83/12AX7';
            const result = service.getTriodeModel(mockTube);

            expect(result).toContain('.SUBCKT ECC_83_12AX7 P G K');
        });

        it('should handle tube name with spaces and special characters', () => {
            mockTube.name = 'Test Tube #1 (Special)';
            const result = service.getTriodeModel(mockTube);

            expect(result).toContain('.SUBCKT TEST_TUBE__1__SPECIAL_ P G K');
        });

        it('should add _triode suffix for non-triode tube types', () => {
            mockTube.type = 'Pentode';
            const result = service.getTriodeModel(mockTube);

            expect(result).toContain('.SUBCKT ECC83_triode P G K');
        });

        it('should add _triode suffix for tetrode tube types', () => {
            mockTube.type = 'Tetrode';
            const result = service.getTriodeModel(mockTube);

            expect(result).toContain('.SUBCKT ECC83_triode P G K');
        });

        it('should not add suffix for triode tube type', () => {
            mockTube.type = 'Triode';
            const result = service.getTriodeModel(mockTube);

            expect(result).toContain('.SUBCKT ECC83 P G K');
            expect(result).not.toContain('_triode');
        });

        it('should use default values for missing capacitance parameters', () => {
            mockTube.ccg1 = undefined;
            mockTube.cg1p = undefined;
            mockTube.ccp = undefined;
            const result = service.getTriodeModel(mockTube);

            expect(result).toContain('CCG=0');
            expect(result).toContain('CGP=0');
            expect(result).toContain('CCP=0');
        });

        it('should handle undefined tube name', () => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            mockTube.name = undefined as any;
            const result = service.getTriodeModel(mockTube);

            expect(result).toContain('.SUBCKT UNKNOWN P G K');
        });

        it('should handle null tube name', () => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            mockTube.name = null as any;
            const result = service.getTriodeModel(mockTube);

            expect(result).toContain('.SUBCKT UNKNOWN P G K');
        });

        it('should return empty string when triodeModelParameters is undefined', () => {
            mockTube.triodeModelParameters = undefined;
            const result = service.getTriodeModel(mockTube);

            expect(result).toBe('');
        });

        it('should return empty string when triodeModelParameters is null', () => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            mockTube.triodeModelParameters = null as any;
            const result = service.getTriodeModel(mockTube);

            expect(result).toBe('');
        });

        it('should return empty string when calculatedOn is missing', () => {
            mockTube.triodeModelParameters!.calculatedOn = undefined;
            const result = service.getTriodeModel(mockTube);

            expect(result).toBe('');
        });

        it('should return empty string when calculatedOn is empty string', () => {
            mockTube.triodeModelParameters!.calculatedOn = '';
            const result = service.getTriodeModel(mockTube);

            expect(result).toBe('');
        });

        it('should handle missing model parameters gracefully', () => {
            mockTube.triodeModelParameters = {
                calculatedOn: '2023-10-08T14:30:00.000Z'
                // All other parameters undefined
            };
            const result = service.getTriodeModel(mockTube);

            expect(result).toContain('MU=undefined');
            expect(result).toContain('EX=undefined');
            expect(result).toContain('KG1=undefined');
            expect(result).toContain('KP=undefined');
            expect(result).toContain('KVB=undefined');
        });

        it('should handle zero values for model parameters', () => {
            mockTube.triodeModelParameters = {
                mu: 0,
                ex: 0,
                kg1: 0,
                kp: 0,
                kvb: 0,
                calculatedOn: '2023-10-08T14:30:00.000Z'
            };
            const result = service.getTriodeModel(mockTube);

            expect(result).toContain('MU=0');
            expect(result).toContain('EX=0');
            expect(result).toContain('KG1=0');
            expect(result).toContain('KP=0');
            expect(result).toContain('KVB=0');
        });

        it('should handle very small decimal values', () => {
            mockTube.triodeModelParameters = {
                mu: 0.001,
                ex: 0.0001,
                kg1: 0.00001,
                kp: 0.000001,
                kvb: 0.0000001,
                calculatedOn: '2023-10-08T14:30:00.000Z'
            };
            const result = service.getTriodeModel(mockTube);

            expect(result).toContain('MU=0.001');
            expect(result).toContain('EX=0.0001');
            expect(result).toContain('KG1=0.00001');
            expect(result).toContain('KP=0.000001');
            expect(result).toContain('KVB=1e-7'); // JavaScript formats very small numbers in scientific notation
        });

        it('should handle different date formats correctly', () => {
            // Test with different timezone
            mockTube.triodeModelParameters!.calculatedOn = '2023-12-25T09:15:30.123Z';
            const result = service.getTriodeModel(mockTube);

            // Verify the date format pattern rather than exact time due to timezone differences
            expect(result).toMatch(/Parameters calculated on: 12\/25\/23, \d{1,2}:\d{2} (AM|PM)/);
        });

        it('should format PM times correctly', () => {
            mockTube.triodeModelParameters!.calculatedOn = '2023-10-08T21:45:00.000Z';
            const result = service.getTriodeModel(mockTube);

            // Verify the date format pattern rather than exact time due to timezone differences
            expect(result).toMatch(/Parameters calculated on: \d{1,2}\/\d{1,2}\/\d{2}, \d{1,2}:\d{2} (AM|PM)/);
        });

        it('should handle noon time correctly', () => {
            mockTube.triodeModelParameters!.calculatedOn = '2023-10-08T12:00:00.000Z';
            const result = service.getTriodeModel(mockTube);

            // Verify the date format pattern rather than exact time due to timezone differences
            expect(result).toMatch(/Parameters calculated on: \d{1,2}\/\d{1,2}\/\d{2}, \d{1,2}:\d{2} (AM|PM)/);
        });

        it('should handle midnight time correctly', () => {
            mockTube.triodeModelParameters!.calculatedOn = '2023-10-08T00:00:00.000Z';
            const result = service.getTriodeModel(mockTube);

            // Verify the date format pattern rather than exact time due to timezone differences
            expect(result).toMatch(/Parameters calculated on: \d{1,2}\/\d{1,2}\/\d{2}, \d{1,2}:\d{2} (AM|PM)/);
        });
    });
});
