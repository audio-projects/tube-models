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

    describe('getTriodeModelDefinition', () => {
        it('should return SPICE subcircuit definition for triode', () => {
            const result = service.getTriodeModelDefinition();

            expect(result).toContain('.SUBCKT TriodeK 1 2 3 PARAMS: MU=0 EX=0 KG1=0 KP=0 KVB=0 CCG=0 CGP=0 CCP=0 RGI=2000');
            expect(result).toContain('*               P G K');
            expect(result).toContain('E1 7 0 VALUE={V(1,3)/KP*LOG(1+EXP(KP*(1/MU+V(2,3)/SQRT(KVB+V(1,3)*V(1,3)))))}');
            expect(result).toContain('R1 7 0 1G');
            expect(result).toContain('G1 1 3 VALUE={0.5*PWR(V(7),EX)*(1+SGN(V(7)))/KG1}');
            expect(result).toContain('R2 1 3 1G');
            expect(result).toContain('C1 2 3 {CCG}');
            expect(result).toContain('C2 2 1 {CGP}');
            expect(result).toContain('C3 3 1 {CCP}');
            expect(result).toContain('R3 2 5 {RGI}');
            expect(result).toContain('D3 5 3 DX');
            expect(result).toContain('.MODEL DX D(IS=1N RS=1 CJO=10PF TT=1N)');
            expect(result).toContain('.ENDS');
        });
    });

    describe('getPentodeModelDefinition', () => {
        it('should return SPICE subcircuit definition for pentode', () => {
            const result = service.getPentodeModelDefinition();

            expect(result).toContain('.SUBCKT PentodeK 1 2 3 4 PARAMS: MU=0 EX=0 KG1=0 KP=0 KVB=0 KG2=0 CCG=0 CCS=0 CGS=0 CGP=0 CCP=0 RGI=2000');
            expect(result).toContain('*                P G K S');
            expect(result).toContain('E1 7 0 VALUE={V(4,3)*LOG(1+EXP(KP*(1/MU+V(2,3)/SQRT(KVB+V(4,3)*V(4,3)))))/KP}');
            expect(result).toContain('R1 7 0 1G');
            expect(result).toContain('G1 1 3 VALUE={0.5*PWR(V(7),EX)*(1+SGN(V(7)))*ATAN(V(1,3)/KVB)/KG1}');
            expect(result).toContain('G2 4 3 VALUE={0.5*PWR(V(7),EX)*(1+SGN(V(7)))/KG2}');
            expect(result).toContain('R2 1 3 1G');
            expect(result).toContain('C1 3 2 {CCG}');
            expect(result).toContain('C2 3 4 {CCS}');
            expect(result).toContain('C3 2 4 {CGS}');
            expect(result).toContain('C4 2 1 {CGP}');
            expect(result).toContain('C5 3 1 {CCP}');
            expect(result).toContain('R3 2 5 {RGI}');
            expect(result).toContain('D3 5 3 DX');
            expect(result).toContain('.MODEL DX D(IS=1N RS=1 CJO=10PF TT=1N)');
            expect(result).toContain('.ENDS');
        });
    });

    describe('getDerkModelDefinition', () => {
        it('should return SPICE subcircuit definition for Derk model with secondary emissions', () => {
            const result = service.getDerkModelDefinition(true);

            expect(result).toContain('.SUBCKT Derk_SE 1 2 3 4 PARAMS: MU=0 EX=0 KG1=0 KP=0 KVB=0 KG2=0 A=0 ALPHAS=0 BETA=0 ALPHA=0 S=0 ALPHAP=0 LAMBDA=0 V=0 W=0 CCG=0 CCS=0 CGS=0 CGP=0 CCP=0 RGI=2000');
            expect(result).toContain('*               P G K S');
            expect(result).toContain('E1 7 0 VALUE={V(4,3)*LOG(1+EXP(KP*(1/MU+V(2,3)/SQRT(KVB+V(4,3)*V(4,3)))))/KP}');
            expect(result).toContain('R1 7 0 1G');
            expect(result).toContain('E2 8 0 VALUE={S*V(1,3)*(1+(EXP(-2*ALPHAP*(V(1,3)-(V(4,3)/LAMBDA-V*V(2,3)-W)))-1)/(EXP(-2*ALPHAP*(V(1,3)-(V(4,3)/LAMBDA-V*V(2,3)-W)))+1))}');
            expect(result).toContain('R2 8 0 1G');
            expect(result).toContain('G1 1 3 VALUE={(0.5*PWR(V(7),EX)*(1+SGN(V(7))))*(1/KG1-1/KG2+A*V(1,3)/KG1-V(8)/KG2-(ALPHA/KG1+ALPHAS/KG2)/(1+BETA*V(1,3)))}');
            expect(result).toContain('R3 1 3 1G');
            expect(result).toContain('G2 4 3 VALUE={(0.5*PWR(V(7),EX)*(1+SGN(V(7))))*(1+ALPHAS/(1+BETA*V(1,3))+V(8))/KG2}');
            expect(result).toContain('R4 4 3 1G');
            expect(result).toContain('R5 2 5 {RGI}');
            expect(result).toContain('D3 5 3 DX');
            expect(result).toContain('.MODEL DX D(IS=1N RS=1 CJO=10PF TT=1N)');
            expect(result).toContain('.ENDS');
        });

        it('should return SPICE subcircuit definition for Derk model without secondary emissions', () => {
            const result = service.getDerkModelDefinition(false);

            expect(result).toContain('.SUBCKT Derk 1 2 3 4 PARAMS: MU=0 EX=0 KG1=0 KP=0 KVB=0 KG2=0 A=0 ALPHAS=0 BETA=0 ALPHA=0 CCG=0 CCS=0 CGS=0 CGP=0 CCP=0 RGI=2000');
            expect(result).toContain('*            P G K S');
            expect(result).not.toContain('E2 8 0');
            expect(result).not.toContain('V(8)');
            expect(result).toContain('G1 1 3 VALUE={(0.5*PWR(V(7),EX)*(1+SGN(V(7))))*(1/KG1-1/KG2+A*V(1,3)/KG1-(ALPHA/KG1+ALPHAS/KG2)/(1+BETA*V(1,3)))}');
            expect(result).toContain('G2 4 3 VALUE={(0.5*PWR(V(7),EX)*(1+SGN(V(7))))*(1+ALPHAS/(1+BETA*V(1,3)))/KG2}');
            expect(result).toContain('.ENDS');
        });
    });

    describe('getDerkEModelDefinition', () => {
        it('should return SPICE subcircuit definition for DerkE model with secondary emissions', () => {
            const result = service.getDerkEModelDefinition(true);

            expect(result).toContain('.SUBCKT DerkE_SE 1 2 3 4 PARAMS: MU=0 EX=0 KG1=0 KP=0 KVB=0 KG2=0 A=0 ALPHAS=0 BETA=0 ALPHA=0 S=0 ALPHAP=0 LAMBDA=0 V=0 W=0 CCG=0 CCS=0 CGS=0 CGP=0 CCP=0 RGI=2000');
            expect(result).toContain('*                P G K S');
            expect(result).toContain('E1 7 0 VALUE={V(4,3)*LOG(1+EXP(KP*(1/MU+V(2,3)/SQRT(KVB+V(4,3)*V(4,3)))))/KP}');
            expect(result).toContain('R1 7 0 1G');
            expect(result).toContain('E2 8 0 VALUE={S*V(1,3)*(1+(EXP(-2*ALPHAP*(V(1,3)-(V(4,3)/LAMBDA-V*V(2,3)-W)))-1)/(EXP(-2*ALPHAP*(V(1,3)-(V(4,3)/LAMBDA-V*V(2,3)-W)))+1))}');
            expect(result).toContain('R2 8 0 1G');
            expect(result).toContain('G1 1 3 VALUE={(0.5*PWR(V(7),EX)*(1+SGN(V(7))))*(1/KG1-1/KG2+A*V(1,3)/KG1-V(8)/KG2-EXP(-PWR(BETA*V(1,3),1.5))*(ALPHA/KG1+ALPHAS/KG2))}');
            expect(result).toContain('R3 1 3 1G');
            expect(result).toContain('G2 4 3 VALUE={(0.5*PWR(V(7),EX)*(1+SGN(V(7))))*(1+ALPHAS*EXP(-PWR(BETA*V(1,3),1.5))+V(8))/KG2}');
            expect(result).toContain('R4 4 3 1G');
            expect(result).toContain('R5 2 5 {RGI}');
            expect(result).toContain('D3 5 3 DX');
            expect(result).toContain('.MODEL DX D(IS=1N RS=1 CJO=10PF TT=1N)');
            expect(result).toContain('.ENDS');
        });

        it('should return SPICE subcircuit definition for DerkE model without secondary emissions', () => {
            const result = service.getDerkEModelDefinition(false);

            expect(result).toContain('.SUBCKT DerkE 1 2 3 4 PARAMS: MU=0 EX=0 KG1=0 KP=0 KVB=0 KG2=0 A=0 ALPHAS=0 BETA=0 ALPHA=0 CCG=0 CCS=0 CGS=0 CGP=0 CCP=0 RGI=2000');
            expect(result).toContain('*             P G K S');
            expect(result).not.toContain('E2 8 0');
            expect(result).not.toContain('V(8)');
            expect(result).toContain('G1 1 3 VALUE={(0.5*PWR(V(7),EX)*(1+SGN(V(7))))*(1/KG1-1/KG2+A*V(1,3)/KG1-EXP(-PWR(BETA*V(1,3),1.5))*(ALPHA/KG1+ALPHAS/KG2))}');
            expect(result).toContain('G2 4 3 VALUE={(0.5*PWR(V(7),EX)*(1+SGN(V(7))))*(1+ALPHAS*EXP(-PWR(BETA*V(1,3),1.5)))/KG2}');
            expect(result).toContain('.ENDS');
        });
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
                rmse: 0.12345,
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

        it('should generate SPICE model for triode with all parameters formatted to 6 decimal places', () => {
            const result = service.getTriodeModel(mockTube);

            expect(result.name).toBe('ECC83');
            expect(result.model).toContain('.SUBCKT ECC83 P G K');
            expect(result.model).toContain('* ECC83 Triode Model (Norman Koren)');
            expect(result.model).toContain('* Root Mean Square Error: 0.1235 mA');
            expect(result.model).toContain('X1 P G K TriodeK PARAMS: MU=100.000000 EX=1.400000 KG1=1060.000000 KP=600.000000 KVB=300.000000');
            expect(result.model).toContain('CCG=1.6');
            expect(result.model).toContain('CGP=1.7');
            expect(result.model).toContain('CCP=0.46');
            expect(result.model).toContain('.ENDS');
        });

        it('should include calculated date in correct format', () => {
            const result = service.getTriodeModel(mockTube);

            // Verify the date format pattern rather than exact time due to timezone differences
            expect(result.model).toMatch(/Parameters calculated on: \d{1,2}\/\d{1,2}\/\d{2}, \d{1,2}:\d{2} (AM|PM)/);
        });

        it('should include URL when tube has id', () => {
            const result = service.getTriodeModel(mockTube);

            expect(result.model).toContain('https://audio-projects.us/tube-models/#/tube/test-tube-123');
        });

        it('should not include URL when tube has no id', () => {
            mockTube.id = '';
            const result = service.getTriodeModel(mockTube);

            expect(result.model).not.toContain('https://audio-projects.us/tube-models');
        });

        it('should sanitize tube name for SPICE subckt', () => {
            mockTube.name = 'ECC-83/12AX7';
            const result = service.getTriodeModel(mockTube);

            expect(result.name).toBe('ECC_83_12AX7');
            expect(result.model).toContain('.SUBCKT ECC_83_12AX7 P G K');
        });

        it('should handle tube name with spaces and special characters', () => {
            mockTube.name = 'Test Tube #1 (Special)';
            const result = service.getTriodeModel(mockTube);

            expect(result.name).toBe('TEST_TUBE__1__SPECIAL_');
            expect(result.model).toContain('.SUBCKT TEST_TUBE__1__SPECIAL_ P G K');
        });

        it('should add _triode suffix for non-triode tube types', () => {
            mockTube.type = 'Pentode';
            const result = service.getTriodeModel(mockTube);

            expect(result.name).toBe('ECC83_triode');
            expect(result.model).toContain('.SUBCKT ECC83_triode P G K');
        });

        it('should add _triode suffix for tetrode tube types', () => {
            mockTube.type = 'Tetrode';
            const result = service.getTriodeModel(mockTube);

            expect(result.name).toBe('ECC83_triode');
            expect(result.model).toContain('.SUBCKT ECC83_triode P G K');
        });

        it('should not add suffix for triode tube type', () => {
            mockTube.type = 'Triode';
            const result = service.getTriodeModel(mockTube);

            expect(result.name).toBe('ECC83');
            expect(result.model).toContain('.SUBCKT ECC83 P G K');
            expect(result.model).not.toContain('_triode');
        });

        it('should use default values for missing capacitance parameters', () => {
            mockTube.ccg1 = undefined;
            mockTube.cg1p = undefined;
            mockTube.ccp = undefined;
            const result = service.getTriodeModel(mockTube);

            expect(result.model).not.toContain('CCG=');
            expect(result.model).not.toContain('CGP=');
            expect(result.model).not.toContain('CCP=');
        });

        it('should handle undefined tube name', () => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            mockTube.name = undefined as any;
            const result = service.getTriodeModel(mockTube);

            expect(result.name).toBe('UNKNOWN');
            expect(result.model).toContain('.SUBCKT UNKNOWN P G K');
        });

        it('should handle null tube name', () => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            mockTube.name = null as any;
            const result = service.getTriodeModel(mockTube);

            expect(result.name).toBe('UNKNOWN');
            expect(result.model).toContain('.SUBCKT UNKNOWN P G K');
        });

        it('should return empty strings when triodeModelParameters is undefined', () => {
            mockTube.triodeModelParameters = undefined;
            const result = service.getTriodeModel(mockTube);

            expect(result.name).toBe('');
            expect(result.model).toBe('');
        });

        it('should return empty strings when triodeModelParameters is null', () => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            mockTube.triodeModelParameters = null as any;
            const result = service.getTriodeModel(mockTube);

            expect(result.name).toBe('');
            expect(result.model).toBe('');
        });

        it('should return empty strings when calculatedOn is missing', () => {
            mockTube.triodeModelParameters!.calculatedOn = undefined;
            const result = service.getTriodeModel(mockTube);

            expect(result.name).toBe('');
            expect(result.model).toBe('');
        });

        it('should return empty strings when calculatedOn is empty string', () => {
            mockTube.triodeModelParameters!.calculatedOn = '';
            const result = service.getTriodeModel(mockTube);

            expect(result.name).toBe('');
            expect(result.model).toBe('');
        });

        it('should handle missing model parameters gracefully with 6 decimal places', () => {
            mockTube.triodeModelParameters = {
                calculatedOn: '2023-10-08T14:30:00.000Z'
                // All other parameters undefined
            };
            const result = service.getTriodeModel(mockTube);

            expect(result.model).toContain('MU=0.000000');
            expect(result.model).toContain('EX=0.000000');
            expect(result.model).toContain('KG1=0.000000');
            expect(result.model).toContain('KP=0.000000');
            expect(result.model).toContain('KVB=0.000000');
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

            expect(result.model).toContain('MU=0.000000');
            expect(result.model).toContain('EX=0.000000');
            expect(result.model).toContain('KG1=0.000000');
            expect(result.model).toContain('KP=0.000000');
            expect(result.model).toContain('KVB=0.000000');
        });

        it('should format very small decimal values to 6 decimal places', () => {
            mockTube.triodeModelParameters = {
                mu: 0.001234,
                ex: 0.000123,
                kg1: 0.000012,
                kp: 0.000001,
                kvb: 0.9999999,
                calculatedOn: '2023-10-08T14:30:00.000Z'
            };
            const result = service.getTriodeModel(mockTube);

            expect(result.model).toContain('MU=0.001234');
            expect(result.model).toContain('EX=0.000123');
            expect(result.model).toContain('KG1=0.000012');
            expect(result.model).toContain('KP=0.000001');
            expect(result.model).toContain('KVB=1.000000');
        });

        it('should handle undefined tube argument', () => {
            const result = service.getTriodeModel(undefined);

            expect(result.name).toBe('');
            expect(result.model).toBe('');
        });

        it('should handle undefined rmse gracefully', () => {
            mockTube.triodeModelParameters!.rmse = undefined;
            const result = service.getTriodeModel(mockTube);

            expect(result.model).toContain('* Root Mean Square Error: undefined mA');
        });

        it('should format rmse to 4 decimal places when present', () => {
            mockTube.triodeModelParameters!.rmse = 1.23456789;
            const result = service.getTriodeModel(mockTube);

            expect(result.model).toContain('* Root Mean Square Error: 1.2346 mA');
        });
    });

    describe('getPentodeModel', () => {
        let mockTube: TubeInformation;

        beforeEach(() => {
            mockTube = {
                id: 'pentode-123',
                name: 'EF80',
                manufacturer: 'Test',
                comments: '',
                lastUpdatedOn: '2023-10-15T10:00:00.000Z',
                type: 'Pentode',
                files: [],
                pentodeModelParameters: {
                    mu: 50,
                    ex: 1.5,
                    kg1: 500,
                    kp: 300,
                    kvb: 150,
                    kg2: 8000,
                    rmse: 0.5678,
                    calculatedOn: '2023-10-15T10:00:00.000Z'
                },
                ccg1: 2.5,
                ccg2: 3.0,
                cg1g2: 0.1,
                cg1p: 0.05,
                ccp: 0.5
            };
        });

        it('should generate SPICE model for pentode with all parameters formatted to 6 decimal places', () => {
            const result = service.getPentodeModel(mockTube);

            expect(result.name).toBe('EF80');
            expect(result.model).toContain('.SUBCKT EF80 P G K S');
            expect(result.model).toContain('* EF80 Pentode Model (Norman Koren)');
            expect(result.model).toContain('* Root Mean Square Error: 0.5678 mA');
            expect(result.model).toContain('X1 P G K S PentodeK PARAMS: MU=50.000000 EX=1.500000 KG1=500.000000 KP=300.000000 KVB=150.000000 KG2=8000.000000');
            expect(result.model).toContain('CCG=2.5');
            expect(result.model).toContain('CCS=3');
            expect(result.model).toContain('CGS=0.1');
            expect(result.model).toContain('CGP=0.05');
            expect(result.model).toContain('CCP=0.5');
            expect(result.model).toContain('.ENDS');
        });

        it('should return empty strings when pentodeModelParameters is undefined', () => {
            mockTube.pentodeModelParameters = undefined;
            const result = service.getPentodeModel(mockTube);

            expect(result.name).toBe('');
            expect(result.model).toBe('');
        });

        it('should return empty strings when calculatedOn is missing', () => {
            mockTube.pentodeModelParameters!.calculatedOn = undefined;
            const result = service.getPentodeModel(mockTube);

            expect(result.name).toBe('');
            expect(result.model).toBe('');
        });

        it('should handle undefined tube argument', () => {
            const result = service.getPentodeModel(undefined);

            expect(result.name).toBe('');
            expect(result.model).toBe('');
        });

        it('should use default values for missing capacitance parameters', () => {
            mockTube.ccg1 = undefined;
            mockTube.ccg2 = undefined;
            mockTube.cg1g2 = undefined;
            mockTube.cg1p = undefined;
            mockTube.ccp = undefined;
            const result = service.getPentodeModel(mockTube);

            expect(result.model).not.toContain('CCG=');
            expect(result.model).not.toContain('CCS=');
            expect(result.model).not.toContain('CGS=');
            expect(result.model).not.toContain('CGP=');
            expect(result.model).not.toContain('CCP=');
        });

        it('should handle missing model parameters with default zeros', () => {
            mockTube.pentodeModelParameters = {
                calculatedOn: '2023-10-15T10:00:00.000Z'
            };
            const result = service.getPentodeModel(mockTube);

            expect(result.model).toContain('MU=0.000000');
            expect(result.model).toContain('EX=0.000000');
            expect(result.model).toContain('KG1=0.000000');
            expect(result.model).toContain('KP=0.000000');
            expect(result.model).toContain('KVB=0.000000');
            expect(result.model).toContain('KG2=0.000000');
        });

        it('should include URL when tube has id', () => {
            const result = service.getPentodeModel(mockTube);

            expect(result.model).toContain('https://audio-projects.us/tube-models/#/tube/pentode-123');
        });

        it('should sanitize tube name', () => {
            mockTube.name = 'EF-80 (Test)';
            const result = service.getPentodeModel(mockTube);

            expect(result.name).toBe('EF_80__TEST_');
            expect(result.model).toContain('.SUBCKT EF_80__TEST_ P G K S');
        });
    });

    describe('getDerkModel', () => {
        let mockTube: TubeInformation;

        beforeEach(() => {
            mockTube = {
                id: 'derk-123',
                name: 'TestPentode',
                manufacturer: 'Test',
                comments: '',
                lastUpdatedOn: '2023-11-01T12:00:00.000Z',
                type: 'Pentode',
                files: [],
                derkModelParameters: {
                    mu: 45,
                    ex: 1.35,
                    kg1: 450,
                    kp: 280,
                    kvb: 140,
                    kg2: 7500,
                    a: 0.001,
                    alphaS: 0.5,
                    beta: 0.002,
                    secondaryEmission: false,
                    rmse: 0.234,
                    calculatedOn: '2023-11-01T12:00:00.000Z'
                },
                ccg1: 2.0,
                ccg2: 2.5,
                cg1g2: 0.15,
                cg1p: 0.04,
                ccp: 0.45
            };
        });

        it('should generate SPICE model for Derk without secondary emissions', () => {
            const result = service.getDerkModel(mockTube);

            expect(result.name).toBe('TESTPENTODE');
            expect(result.model).toContain('.SUBCKT TESTPENTODE P G K S');
            expect(result.model).toContain('* TestPentode Derk Model (Derk Reefman)');
            expect(result.model).toContain('* Root Mean Square Error: 0.2340 mA');
            expect(result.model).toContain('X1 P G K S Derk PARAMS: MU=45.000000');
            expect(result.model).toContain('EX=1.350000');
            expect(result.model).toContain('KG1=450.000000');
            expect(result.model).toContain('KP=280.000000');
            expect(result.model).toContain('KVB=140.000000');
            expect(result.model).toContain('KG2=7500.000000');
            expect(result.model).toContain('A=0.001000');
            expect(result.model).toContain('ALPHAS=0.500000');
            expect(result.model).toContain('BETA=0.002000');
            expect(result.model).toContain('ALPHA='); // Calculated alpha value
            expect(result.model).not.toContain('_SE'); // No secondary emission suffix
            expect(result.model).not.toContain(' S='); // No S parameter
            expect(result.model).not.toContain('ALPHAP=');
            expect(result.model).not.toContain('LAMBDA=');
            expect(result.model).not.toContain(' V=');
            expect(result.model).not.toContain(' W=');
            expect(result.model).toContain('CCG=2');
            expect(result.model).toContain('CCS=2.5');
            expect(result.model).toContain('CGS=0.15');
            expect(result.model).toContain('CGP=0.04');
            expect(result.model).toContain('CCP=0.45');
            expect(result.model).toContain('.ENDS');
        });

        it('should generate SPICE model for Derk with secondary emissions', () => {
            mockTube.derkModelParameters!.secondaryEmission = true;
            mockTube.derkModelParameters!.s = 0.1;
            mockTube.derkModelParameters!.alphaP = 0.05;
            mockTube.derkModelParameters!.lambda = 2.5;
            mockTube.derkModelParameters!.v = 0.03;
            mockTube.derkModelParameters!.w = 1.5;

            const result = service.getDerkModel(mockTube);

            expect(result.model).toContain('X1 P G K S Derk_SE PARAMS:');
            expect(result.model).toContain('S=0.100000');
            expect(result.model).toContain('ALPHAP=0.050000');
            expect(result.model).toContain('LAMBDA=2.500000');
            expect(result.model).toContain('V=0.030000');
            expect(result.model).toContain('W=1.500000');
        });

        it('should calculate alpha parameter correctly', () => {
            // alpha = 1 - kg1 * (1 + alphaS) / kg2
            // alpha = 1 - 450 * (1 + 0.5) / 7500 = 1 - 450 * 1.5 / 7500 = 1 - 675/7500 = 1 - 0.09 = 0.91
            const result = service.getDerkModel(mockTube);
            const alphaValue = 1 - 450 * (1 + 0.5) / 7500;

            expect(result.model).toContain(`ALPHA=${alphaValue.toFixed(6)}`);
        });

        it('should return empty strings when derkModelParameters is undefined', () => {
            mockTube.derkModelParameters = undefined;
            const result = service.getDerkModel(mockTube);

            expect(result.name).toBe('');
            expect(result.model).toBe('');
        });

        it('should return empty strings when calculatedOn is missing', () => {
            mockTube.derkModelParameters!.calculatedOn = undefined;
            const result = service.getDerkModel(mockTube);

            expect(result.name).toBe('');
            expect(result.model).toBe('');
        });

        it('should handle undefined tube argument', () => {
            const result = service.getDerkModel(undefined);

            expect(result.name).toBe('');
            expect(result.model).toBe('');
        });

        it('should use default values for missing parameters in alpha calculation', () => {
            mockTube.derkModelParameters = {
                calculatedOn: '2023-11-01T12:00:00.000Z'
            };
            const result = service.getDerkModel(mockTube);

            // alpha = 1 - (0 ?? 0) * (1 + (undefined ?? 0)) / (undefined ?? 1) = 1 - 0 = 1
            expect(result.model).toContain('ALPHA=1.000000');
        });

        it('should handle missing secondary emission parameters with defaults', () => {
            mockTube.derkModelParameters!.secondaryEmission = true;
            // Don't set s, alphaP, lambda, v, w

            const result = service.getDerkModel(mockTube);

            expect(result.model).toContain('S=0.000000');
            expect(result.model).toContain('ALPHAP=0.000000');
            expect(result.model).toContain('LAMBDA=0.000000');
            expect(result.model).toContain('V=0.000000');
            expect(result.model).toContain('W=0.000000');
        });

        it('should use default capacitance values', () => {
            mockTube.ccg1 = undefined;
            mockTube.ccg2 = undefined;
            mockTube.cg1g2 = undefined;
            mockTube.cg1p = undefined;
            mockTube.ccp = undefined;

            const result = service.getDerkModel(mockTube);

            expect(result.model).not.toContain('CCG=');
            expect(result.model).not.toContain('CCS=');
            expect(result.model).not.toContain('CGS=');
            expect(result.model).not.toContain('CGP=');
            expect(result.model).not.toContain('CCP=');
        });
    });

    describe('getDerkEModel', () => {
        let mockTube: TubeInformation;

        beforeEach(() => {
            mockTube = {
                id: 'derke-123',
                name: 'TestDerkE',
                manufacturer: 'Test',
                comments: '',
                lastUpdatedOn: '2023-11-10T15:30:00.000Z',
                type: 'Pentode',
                files: [],
                derkEModelParameters: {
                    mu: 42,
                    ex: 1.32,
                    kg1: 430,
                    kp: 270,
                    kvb: 135,
                    kg2: 7200,
                    a: 0.0015,
                    alphaS: 0.55,
                    beta: 0.0025,
                    secondaryEmission: false,
                    rmse: 0.345,
                    calculatedOn: '2023-11-10T15:30:00.000Z'
                },
                ccg1: 1.9,
                ccg2: 2.4,
                cg1g2: 0.12,
                cg1p: 0.06,
                ccp: 0.48
            };
        });

        it('should generate SPICE model for DerkE without secondary emissions', () => {
            const result = service.getDerkEModel(mockTube);

            expect(result.name).toBe('TESTDERKE');
            expect(result.model).toContain('.SUBCKT TESTDERKE P G K S');
            expect(result.model).toContain('* TestDerkE DerkE Model (Derk Reefman)');
            expect(result.model).toContain('* Root Mean Square Error: 0.3450 mA');
            expect(result.model).toContain('X1 P G K S DerkE PARAMS: MU=42.000000');
            expect(result.model).toContain('EX=1.320000');
            expect(result.model).toContain('KG1=430.000000');
            expect(result.model).toContain('KP=270.000000');
            expect(result.model).toContain('KVB=135.000000');
            expect(result.model).toContain('KG2=7200.000000');
            expect(result.model).toContain('A=0.001500');
            expect(result.model).toContain('ALPHAS=0.550000');
            expect(result.model).toContain('BETA=0.002500');
            expect(result.model).toContain('ALPHA=');
            expect(result.model).not.toContain('_SE');
            expect(result.model).not.toContain(' S=');
            expect(result.model).toContain('.ENDS');
        });

        it('should generate SPICE model for DerkE with secondary emissions', () => {
            mockTube.derkEModelParameters!.secondaryEmission = true;
            mockTube.derkEModelParameters!.s = 0.12;
            mockTube.derkEModelParameters!.alphaP = 0.06;
            mockTube.derkEModelParameters!.lambda = 2.8;
            mockTube.derkEModelParameters!.v = 0.035;
            mockTube.derkEModelParameters!.w = 1.7;

            const result = service.getDerkEModel(mockTube);

            expect(result.model).toContain('X1 P G K S DerkE_SE PARAMS:');
            expect(result.model).toContain('S=0.120000');
            expect(result.model).toContain('ALPHAP=0.060000');
            expect(result.model).toContain('LAMBDA=2.800000');
            expect(result.model).toContain('V=0.035000');
            expect(result.model).toContain('W=1.700000');
        });

        it('should calculate alpha parameter correctly', () => {
            const result = service.getDerkEModel(mockTube);
            const alphaValue = 1 - 430 * (1 + 0.55) / 7200;

            expect(result.model).toContain(`ALPHA=${alphaValue.toFixed(6)}`);
        });

        it('should return empty strings when derkEModelParameters is undefined', () => {
            mockTube.derkEModelParameters = undefined;
            const result = service.getDerkEModel(mockTube);

            expect(result.name).toBe('');
            expect(result.model).toBe('');
        });

        it('should return empty strings when calculatedOn is missing', () => {
            mockTube.derkEModelParameters!.calculatedOn = undefined;
            const result = service.getDerkEModel(mockTube);

            expect(result.name).toBe('');
            expect(result.model).toBe('');
        });

        it('should handle undefined tube argument', () => {
            const result = service.getDerkEModel(undefined);

            expect(result.name).toBe('');
            expect(result.model).toBe('');
        });

        it('should handle missing model parameters with defaults', () => {
            mockTube.derkEModelParameters = {
                calculatedOn: '2023-11-10T15:30:00.000Z'
            };
            const result = service.getDerkEModel(mockTube);

            expect(result.model).toContain('MU=0.000000');
            expect(result.model).toContain('EX=0.000000');
            expect(result.model).toContain('KG1=0.000000');
            expect(result.model).toContain('KP=0.000000');
            expect(result.model).toContain('KVB=0.000000');
            expect(result.model).toContain('KG2=0.000000');
            expect(result.model).toContain('A=0.000000');
            expect(result.model).toContain('ALPHAS=0.000000');
            expect(result.model).toContain('BETA=0.000000');
            expect(result.model).toContain('ALPHA=1.000000');
        });

        it('should handle missing secondary emission parameters with defaults', () => {
            mockTube.derkEModelParameters!.secondaryEmission = true;

            const result = service.getDerkEModel(mockTube);

            expect(result.model).toContain('S=0.000000');
            expect(result.model).toContain('ALPHAP=0.000000');
            expect(result.model).toContain('LAMBDA=0.000000');
            expect(result.model).toContain('V=0.000000');
            expect(result.model).toContain('W=0.000000');
        });

        it('should include URL when tube has id', () => {
            const result = service.getDerkEModel(mockTube);

            expect(result.model).toContain('https://audio-projects.us/tube-models/#/tube/derke-123');
        });

        it('should sanitize tube name', () => {
            mockTube.name = 'Test-DerkE (V2)';
            const result = service.getDerkEModel(mockTube);

            expect(result.name).toBe('TEST_DERKE__V2_');
            expect(result.model).toContain('.SUBCKT TEST_DERKE__V2_ P G K S');
        });

        it('should use default capacitance values', () => {
            mockTube.ccg1 = undefined;
            mockTube.ccg2 = undefined;
            mockTube.cg1g2 = undefined;
            mockTube.cg1p = undefined;
            mockTube.ccp = undefined;

            const result = service.getDerkEModel(mockTube);

            expect(result.model).not.toContain('CCG=');
            expect(result.model).not.toContain('CCS=');
            expect(result.model).not.toContain('CGS=');
            expect(result.model).not.toContain('CGP=');
            expect(result.model).not.toContain('CCP=');
        });

        it('should handle undefined rmse gracefully', () => {
            mockTube.derkEModelParameters!.rmse = undefined;
            const result = service.getDerkEModel(mockTube);

            expect(result.model).toContain('* Root Mean Square Error: undefined mA');
        });

        it('should format rmse to 4 decimal places when present', () => {
            mockTube.derkEModelParameters!.rmse = 2.3456789;
            const result = service.getDerkEModel(mockTube);

            expect(result.model).toContain('* Root Mean Square Error: 2.3457 mA');
        });

        it('should handle null tube name for DerkE', () => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            mockTube.name = null as any;
            const result = service.getDerkEModel(mockTube);

            expect(result.name).toBe('UNKNOWN');
            expect(result.model).toContain('.SUBCKT UNKNOWN P G K S');
        });

        it('should handle empty tube id for DerkE', () => {
            mockTube.id = '';
            const result = service.getDerkEModel(mockTube);

            expect(result.model).not.toContain('https://');
        });

        it('should handle null calculatedOn for pentode', () => {
            mockTube.pentodeModelParameters = {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                calculatedOn: null as any
            };
            const result = service.getPentodeModel(mockTube);

            expect(result.name).toBe('');
            expect(result.model).toBe('');
        });

        it('should handle null calculatedOn for Derk', () => {
            mockTube.derkModelParameters = {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                calculatedOn: null as any
            };
            const result = service.getDerkModel(mockTube);

            expect(result.name).toBe('');
            expect(result.model).toBe('');
        });

        it('should handle null calculatedOn for DerkE', () => {
            mockTube.derkEModelParameters = {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                calculatedOn: null as any
            };
            const result = service.getDerkEModel(mockTube);

            expect(result.name).toBe('');
            expect(result.model).toBe('');
        });

        it('should handle zero kg2 in alpha calculation for Derk', () => {
            const mockDerkTube: TubeInformation = {
                id: 'test',
                name: 'Test',
                manufacturer: 'Test',
                comments: '',
                lastUpdatedOn: '2023-10-10T10:00:00.000Z',
                type: 'Pentode',
                files: [],
                derkModelParameters: {
                    kg1: 100,
                    alphaS: 0.5,
                    kg2: 0, // This will trigger default to 1 in the calculation
                    calculatedOn: '2023-10-10T10:00:00.000Z'
                }
            };

            const result = service.getDerkModel(mockDerkTube);
            // With kg2 = 0, the nullish coalescing will default it to 1
            // alpha = 1 - (100 * 1.5) / 1 = 1 - 150 = -149
            expect(result.model).toContain('ALPHA=');
        });

        it('should handle false secondaryEmission for Derk', () => {
            const mockDerkTube: TubeInformation = {
                id: 'test',
                name: 'Test',
                manufacturer: 'Test',
                comments: '',
                lastUpdatedOn: '2023-10-10T10:00:00.000Z',
                type: 'Pentode',
                files: [],
                derkModelParameters: {
                    secondaryEmission: false,
                    calculatedOn: '2023-10-10T10:00:00.000Z'
                }
            };

            const result = service.getDerkModel(mockDerkTube);

            expect(result.model).not.toContain(' S=');
            expect(result.model).toContain('X1 P G K S Derk PARAMS:');
        });

        it('should handle false secondaryEmission for DerkE', () => {
            const mockDerkETube: TubeInformation = {
                id: 'test',
                name: 'Test',
                manufacturer: 'Test',
                comments: '',
                lastUpdatedOn: '2023-10-10T10:00:00.000Z',
                type: 'Pentode',
                files: [],
                derkEModelParameters: {
                    secondaryEmission: false,
                    calculatedOn: '2023-10-10T10:00:00.000Z'
                }
            };

            const result = service.getDerkEModel(mockDerkETube);

            expect(result.model).not.toContain(' S=');
            expect(result.model).toContain('X1 P G K S DerkE PARAMS:');
        });
    });
});
