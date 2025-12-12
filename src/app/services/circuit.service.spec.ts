import { TestBed } from '@angular/core/testing';
import { CircuitService } from './circuit.service';
import { TubeInformation } from '../components/tube-information';
import { File, Series, Point } from '../files';
import { ModelService } from './model.service';

describe('CircuitService', () => {
    let service: CircuitService;
    let modelServiceMock: jasmine.SpyObj<ModelService>;

    beforeEach(() => {
        modelServiceMock = jasmine.createSpyObj('ModelService', ['generateModel']);

        TestBed.configureTestingModule({
            providers: [
                CircuitService,
                { provide: ModelService, useValue: modelServiceMock }
            ]
        });
        service = TestBed.inject(CircuitService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    describe('generateTriodePlateCharacteristicsCircuit', () => {
        let mockTube: TubeInformation;
        let mockFile: File;
        let mockModel: { name: string, model: string };
        let mockDefinition: string;

        beforeEach(() => {
            mockTube = {
                id: '1',
                name: 'ECC83',
                type: 'Triode',
                manufacturer: 'Test',
                comments: '',
                lastUpdatedOn: '2023-01-01',
                files: [],
                triodeModelParameters: {
                    mu: 100,
                    ex: 1.4,
                    kg1: 1060,
                    kp: 600,
                    kvb: 300
                }
            };

            const mockPoints: Point[] = [
                { ep: 100, ip: 10, eg: -1 },
                { ep: 150, ip: 15, eg: -1 },
                { ep: 200, ip: 20, eg: -1 }
            ];

            const mockSeries: Series[] = [
                { eg: -1.0, points: mockPoints },
                { eg: -1.5, points: mockPoints },
                { eg: -2.0, points: mockPoints }
            ];

            mockFile = {
                name: 'test-triode.utd',
                measurementType: 'IP_VA_VG_VH',
                measurementTypeLabel: 'Plate characteristics',
                series: mockSeries,
                egOffset: 0
            };

            mockModel = {
                name: 'ECC83_TRIODE',
                model: '.subckt ECC83_TRIODE P G K\n...\n.ends'
            };

            mockDefinition = '.model TRIODE TRIODE';
        });

        it('should generate valid SPICE circuit for triode plate characteristics', () => {
            const circuit = service.generateTriodePlateCharacteristicsCircuit(mockTube, mockFile, mockModel, mockDefinition);

            expect(circuit).toContain('* Plate Characteristics');
            expect(circuit).toContain('V1 1 0 0');
            expect(circuit).toContain('R1 1 G 10       ; Grid coupling resistor');
            expect(circuit).toContain('R2 G 0 1Meg     ; Grid leak resistor');
            expect(circuit).toContain('R3 K 0 0.01     ; Cathode sense resistor');
            expect(circuit).toContain('V2 2 0 0');
            expect(circuit).toContain('R4 2 P 1        ; Plate series resistor');
            expect(circuit).toContain(`X1 P G K ${mockModel.name}`);
            expect(circuit).toContain('.control');
            expect(circuit).toContain('dc V2');
            expect(circuit).toContain('.endc');
            expect(circuit).toContain('.end');
            expect(circuit).toContain(mockModel.model);
            expect(circuit).toContain(mockDefinition);
        });

        it('should calculate correct max plate voltage from file data', () => {
            const circuit = service.generateTriodePlateCharacteristicsCircuit(mockTube, mockFile, mockModel, mockDefinition);

            // Max Va from mockPoints is 200V
            expect(circuit).toContain('dc V2 0 200');
        });

        it('should extract and sort grid voltages from series', () => {
            const circuit = service.generateTriodePlateCharacteristicsCircuit(mockTube, mockFile, mockModel, mockDefinition);

            // Grid voltages: -2.0 to -1.0
            expect(circuit).toMatch(/dc V2 0 \d+ 1 V1 -2\.0 -1\.0/);
        });

        it('should calculate grid voltage step from series spacing', () => {
            const circuit = service.generateTriodePlateCharacteristicsCircuit(mockTube, mockFile, mockModel, mockDefinition);

            // Step size between -1.0, -1.5, -2.0 is 0.5
            expect(circuit).toMatch(/V1 -2\.0 -1\.0 0\.5/);
        });

        it('should apply grid voltage offset', () => {
            mockFile.egOffset = -0.5;

            const circuit = service.generateTriodePlateCharacteristicsCircuit(mockTube, mockFile, mockModel, mockDefinition);

            // With offset -0.5: -1.0 becomes -1.5, -2.0 becomes -2.5
            expect(circuit).toMatch(/V1 -2\.5 -1\.5/);
        });

        it('should return error for wrong measurement type', () => {
            mockFile.measurementType = 'WRONG_TYPE';

            const circuit = service.generateTriodePlateCharacteristicsCircuit(mockTube, mockFile, mockModel, mockDefinition);

            expect(circuit).toContain('* Error: File "test-triode.utd" is not a plate characteristics measurement');
            expect(circuit).toContain('* Expected measurement type: IP_VA_VG_VH');
            expect(circuit).toContain('* Actual measurement type: WRONG_TYPE');
        });

        it('should accept IPIS_VAVS_VG_VH measurement type for triodes', () => {
            mockFile.measurementType = 'IPIS_VAVS_VG_VH';

            const circuit = service.generateTriodePlateCharacteristicsCircuit(mockTube, mockFile, mockModel, mockDefinition);

            expect(circuit).not.toContain('* Error');
            expect(circuit).toContain('* Plate Characteristics');
        });

        it('should return error when model is null', () => {
            const circuit = service.generateTriodePlateCharacteristicsCircuit(mockTube, mockFile, null!, mockDefinition);

            expect(circuit).toContain('* Error: No triode model parameters available for this tube');
        });

        it('should use default grid voltage range when no series data', () => {
            mockFile.series = [];

            const circuit = service.generateTriodePlateCharacteristicsCircuit(mockTube, mockFile, mockModel, mockDefinition);

            // Default range: -3.5 to -1.5
            expect(circuit).toMatch(/V1 -3\.5 -1\.5/);
        });
    });

    describe('generatePentodePlateCharacteristicsCircuit', () => {
        let mockTube: TubeInformation;
        let mockFile: File;
        let mockModel: { name: string, model: string };
        let mockDefinition: string;

        beforeEach(() => {
            mockTube = {
                id: '1',
                name: 'EL34',
                type: 'Pentode',
                manufacturer: 'Test',
                comments: '',
                lastUpdatedOn: '2023-01-01',
                files: [],
                pentodeModelParameters: {
                    mu: 100,
                    ex: 1.4,
                    kg1: 1060,
                    kp: 600,
                    kvb: 300,
                    kg2: 4500
                }
            };

            const mockPoints: Point[] = [
                { ep: 100, ip: 50, eg: -1, es: 250, is: 5 },
                { ep: 200, ip: 75, eg: -1, es: 250, is: 7 },
                { ep: 300, ip: 100, eg: -1, es: 250, is: 10 }
            ];

            const mockSeries: Series[] = [
                { eg: -1.0, es: 250, points: mockPoints },
                { eg: -2.0, es: 250, points: mockPoints },
                { eg: -3.0, es: 250, points: mockPoints }
            ];

            mockFile = {
                name: 'test-pentode.utd',
                measurementType: 'IPIS_VA_VG_VS_VH',
                measurementTypeLabel: 'Pentode plate characteristics',
                series: mockSeries,
                egOffset: 0,
                es: 250
            };

            mockModel = {
                name: 'EL34_PENTODE',
                model: '.subckt EL34_PENTODE P G K S\n...\n.ends'
            };

            mockDefinition = '.model PENTODE PENTODE';
        });

        it('should generate valid SPICE circuit for pentode plate characteristics', () => {
            const circuit = service.generatePentodePlateCharacteristicsCircuit(mockTube, mockFile, mockModel, mockDefinition);

            expect(circuit).toContain('* Plate Characteristics');
            expect(circuit).toContain('V1 1 0 0');
            expect(circuit).toContain('R1 1 G 10       ; Grid coupling resistor');
            expect(circuit).toContain('R2 G 0 1Meg     ; Grid leak resistor');
            expect(circuit).toContain('R3 K 0 0.01     ; Cathode sense resistor');
            expect(circuit).toContain('V2 2 0 0');
            expect(circuit).toContain('R4 2 P 1        ; Plate series resistor');
            expect(circuit).toContain('V3 3 0 250');  // Screen voltage
            expect(circuit).toContain('R5 3 S 1        ; Screen series resistor');
            expect(circuit).toContain(`X1 P G K S ${mockModel.name}`);
            expect(circuit).toContain('.control');
            expect(circuit).toContain('save v(2) v(P) v(S) i(R4) i(R5)');
            expect(circuit).toContain('gnuplot dc v(2)-v(P) v(3)-v(S)');
            expect(circuit).toContain('.endc');
            expect(circuit).toContain('.end');
        });

        it('should include screen voltage in circuit', () => {
            const circuit = service.generatePentodePlateCharacteristicsCircuit(mockTube, mockFile, mockModel, mockDefinition);

            expect(circuit).toContain('V3 3 0 250');
        });

        it('should calculate correct max plate voltage from file data', () => {
            const circuit = service.generatePentodePlateCharacteristicsCircuit(mockTube, mockFile, mockModel, mockDefinition);

            // Max Va from mockPoints is 300V
            expect(circuit).toContain('dc V2 0 300');
        });

        it('should extract and sort grid voltages from series', () => {
            const circuit = service.generatePentodePlateCharacteristicsCircuit(mockTube, mockFile, mockModel, mockDefinition);

            // Grid voltages: -3.0 to -1.0
            expect(circuit).toMatch(/dc V2 0 \d+ 1 V1 -3\.0 -1\.0/);
        });

        it('should return error for wrong measurement type', () => {
            mockFile.measurementType = 'IP_VA_VG_VH'; // Triode measurement type

            const circuit = service.generatePentodePlateCharacteristicsCircuit(mockTube, mockFile, mockModel, mockDefinition);

            expect(circuit).toContain('* Error: File "test-pentode.utd" is not a plate characteristics measurement');
            expect(circuit).toContain('* Expected measurement type: IPIS_VA_VG_VS_VH');
            expect(circuit).toContain('* Actual measurement type: IP_VA_VG_VH');
        });

        it('should return error when model is null', () => {
            const circuit = service.generatePentodePlateCharacteristicsCircuit(mockTube, mockFile, null!, mockDefinition);

            expect(circuit).toContain('* Error: No pentode model parameters available for this tube');
        });

        it('should handle undefined screen voltage gracefully', () => {
            mockFile.es = undefined;

            const circuit = service.generatePentodePlateCharacteristicsCircuit(mockTube, mockFile, mockModel, mockDefinition);

            expect(circuit).toContain('V3 3 0 undefined');
        });

        it('should use default grid voltage range when no series data', () => {
            mockFile.series = [];

            const circuit = service.generatePentodePlateCharacteristicsCircuit(mockTube, mockFile, mockModel, mockDefinition);

            // Default range: -3.5 to -1.5
            expect(circuit).toMatch(/V1 -3\.5 -1\.5/);
        });

        it('should calculate grid voltage step from series spacing', () => {
            const circuit = service.generatePentodePlateCharacteristicsCircuit(mockTube, mockFile, mockModel, mockDefinition);

            // Step size between -1.0, -2.0, -3.0 is 1.0
            expect(circuit).toMatch(/V1 -3\.0 -1\.0 1\.0/);
        });
    });
});
