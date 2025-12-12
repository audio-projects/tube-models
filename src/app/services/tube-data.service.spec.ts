import { TestBed } from '@angular/core/testing';
import { TubeDataService } from './tube-data.service';
import { TubeInformation } from '../components/tube-information';

describe('TubeDataService', () => {
    let service: TubeDataService;
    const STORAGE_KEY = 'tube_models_data';

    beforeEach(() => {
        // Clear localStorage before each test
        localStorage.clear();

        TestBed.configureTestingModule({});
        service = TestBed.inject(TubeDataService);
    });

    afterEach(() => {
        localStorage.clear();
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    describe('initialization', () => {
        it('should load default data when localStorage is empty', (done) => {
            service.tubes$.subscribe(tubes => {
                expect(tubes.length).toBe(5);
                expect(tubes[0].name).toBe('ECC83');
                expect(tubes[1].name).toBe('12AX7');
                expect(tubes[2].name).toBe('EL34');
                done();
            });
        });

        it('should load data from localStorage when available', () => {
            const mockTubes: TubeInformation[] = [
                {
                    id: '100',
                    name: 'Test Tube',
                    manufacturer: 'Test Mfg',
                    comments: 'Test comments',
                    lastUpdatedOn: '2023-01-01',
                    type: 'Triode',
                    files: []
                }
            ];

            localStorage.setItem(STORAGE_KEY, JSON.stringify(mockTubes));

            // Create a new service instance to trigger loadFromStorage
            const newService = new TubeDataService();

            expect(newService.tubes.length).toBe(1);
            expect(newService.tubes[0].name).toBe('Test Tube');
        });

        it('should load default data when localStorage has invalid JSON', (done) => {
            localStorage.setItem(STORAGE_KEY, 'invalid json {]');

            const newService = new TubeDataService();

            newService.tubes$.subscribe(tubes => {
                expect(tubes.length).toBe(5);
                expect(tubes[0].name).toBe('ECC83');
                done();
            });
        });
    });

    describe('tubes$ observable', () => {
        it('should provide observable access to tubes', (done) => {
            service.tubes$.subscribe(tubes => {
                expect(Array.isArray(tubes)).toBe(true);
                done();
            });
        });

        it('should emit updates when tubes change', (done) => {
            let emissionCount = 0;

            service.tubes$.subscribe(tubes => {
                emissionCount++;

                if (emissionCount === 2) {
                    // Second emission after save
                    expect(tubes.length).toBe(6);
                    done();
                }
            });

            // Save a new tube to trigger emission
            const newTube: TubeInformation = {
                id: '',
                name: 'New Tube',
                manufacturer: 'Test',
                comments: '',
                lastUpdatedOn: '',
                type: 'Triode',
                files: []
            };

            service.saveTube(newTube).subscribe();
        });
    });

    describe('getTubeById', () => {
        it('should return tube when found', () => {
            const tube = service.getTubeById('1');
            expect(tube).toBeTruthy();
            expect(tube?.id).toBe('1');
            expect(tube?.name).toBe('ECC83');
        });

        it('should return null when tube not found', () => {
            const tube = service.getTubeById('999');
            expect(tube).toBeNull();
        });
    });

    describe('saveTube', () => {
        it('should create a new tube with generated ID', (done) => {
            const newTube: TubeInformation = {
                id: '',
                name: 'New Tube',
                manufacturer: 'Test Mfg',
                comments: 'Test comments',
                lastUpdatedOn: '',
                type: 'Triode',
                files: []
            };

            service.saveTube(newTube).subscribe(savedTube => {
                expect(savedTube.id).toBeTruthy();
                expect(savedTube.id).toBe('6'); // Next ID after default 5
                expect(savedTube.name).toBe('New Tube');
                expect(savedTube.lastUpdatedOn).toBeTruthy();

                // Verify it's in the tubes array
                const foundTube = service.getTubeById(savedTube.id);
                expect(foundTube).toBeTruthy();
                expect(foundTube?.name).toBe('New Tube');
                done();
            });
        });

        it('should update existing tube when ID is provided', (done) => {
            const updatedTube: TubeInformation = {
                id: '1',
                name: 'Updated ECC83',
                manufacturer: 'Updated Mfg',
                comments: 'Updated comments',
                lastUpdatedOn: '2023-01-01',
                type: 'Triode',
                files: []
            };

            service.saveTube(updatedTube).subscribe(savedTube => {
                expect(savedTube.id).toBe('1');
                expect(savedTube.name).toBe('Updated ECC83');
                expect(savedTube.manufacturer).toBe('Updated Mfg');

                // Verify update in array
                const foundTube = service.getTubeById('1');
                expect(foundTube?.name).toBe('Updated ECC83');
                done();
            });
        });

        it('should create tube if ID provided does not exist', (done) => {
            const newTube: TubeInformation = {
                id: '999',
                name: 'Non-existent ID Tube',
                manufacturer: 'Test',
                comments: '',
                lastUpdatedOn: '',
                type: 'Triode',
                files: []
            };

            service.saveTube(newTube).subscribe(savedTube => {
                expect(savedTube.id).toBe('999');
                expect(service.tubes.length).toBe(6);
                done();
            });
        });

        it('should save to localStorage', (done) => {
            const newTube: TubeInformation = {
                id: '',
                name: 'Storage Test Tube',
                manufacturer: 'Test',
                comments: '',
                lastUpdatedOn: '',
                type: 'Triode',
                files: []
            };

            service.saveTube(newTube).subscribe(() => {
                const storedData = localStorage.getItem(STORAGE_KEY);
                expect(storedData).toBeTruthy();

                const tubes = JSON.parse(storedData!);
                expect(tubes.length).toBe(6);
                expect(tubes[5].name).toBe('Storage Test Tube');
                done();
            });
        });
    });

    describe('deleteTube', () => {
        it('should delete tube by ID', (done) => {
            const initialCount = service.tubes.length;

            service.deleteTube('1').subscribe(result => {
                expect(result).toBe(true);
                expect(service.tubes.length).toBe(initialCount - 1);

                const deletedTube = service.getTubeById('1');
                expect(deletedTube).toBeNull();
                done();
            });
        });

        it('should save to localStorage after deletion', (done) => {
            service.deleteTube('2').subscribe(() => {
                const storedData = localStorage.getItem(STORAGE_KEY);
                const tubes = JSON.parse(storedData!);

                expect(tubes.length).toBe(4);
                expect(tubes.find((t: TubeInformation) => t.id === '2')).toBeUndefined();
                done();
            });
        });

        it('should handle deletion of non-existent tube gracefully', (done) => {
            const initialCount = service.tubes.length;

            service.deleteTube('999').subscribe(result => {
                expect(result).toBe(true);
                expect(service.tubes.length).toBe(initialCount);
                done();
            });
        });
    });

    describe('duplicateTube', () => {
        it('should create a duplicate with new ID and modified name', (done) => {
            const originalTube = service.getTubeById('1')!;

            service.duplicateTube(originalTube).subscribe(duplicatedTube => {
                expect(duplicatedTube.id).not.toBe(originalTube.id);
                expect(duplicatedTube.name).toBe('ECC83 (Copy)');
                expect(duplicatedTube.manufacturer).toBe(originalTube.manufacturer);
                expect(service.tubes.length).toBe(6);
                done();
            });
        });

        it('should deep copy files array', (done) => {
            const originalTube: TubeInformation = {
                id: '1',
                name: 'Test Tube',
                manufacturer: 'Test',
                comments: '',
                lastUpdatedOn: '2023-01-01',
                type: 'Triode',
                files: [
                    {
                        name: 'test.utd',
                        measurementType: 'IP_VA_VG_VH',
                        measurementTypeLabel: 'Test',
                        series: [],
                        egOffset: 0
                    }
                ]
            };

            service.duplicateTube(originalTube).subscribe(duplicatedTube => {
                expect(duplicatedTube.files).toEqual(originalTube.files);
                expect(duplicatedTube.files).not.toBe(originalTube.files); // Different reference
                done();
            });
        });
    });

    describe('refreshTubes', () => {
        it('should reload tubes from storage', (done) => {
            service.refreshTubes().subscribe(tubes => {
                expect(Array.isArray(tubes)).toBe(true);
                expect(tubes.length).toBe(5);
                done();
            });
        });
    });

    describe('exportAllTubes', () => {
        it('should export tubes as formatted JSON string', () => {
            const exported = service.exportAllTubes();
            expect(typeof exported).toBe('string');

            const parsed = JSON.parse(exported);
            expect(Array.isArray(parsed)).toBe(true);
            expect(parsed.length).toBe(5);
        });
    });

    describe('importTubes', () => {
        it('should import valid tubes data', (done) => {
            const importData: TubeInformation[] = [
                {
                    id: '100',
                    name: 'Imported Tube 1',
                    manufacturer: 'Import Mfg',
                    comments: '',
                    lastUpdatedOn: '2023-01-01',
                    type: 'Triode',
                    files: []
                },
                {
                    id: '101',
                    name: 'Imported Tube 2',
                    manufacturer: 'Import Mfg',
                    comments: '',
                    lastUpdatedOn: '2023-01-01',
                    type: 'Pentode',
                    files: []
                }
            ];

            const jsonData = JSON.stringify(importData);

            service.importTubes(jsonData).subscribe(tubes => {
                expect(tubes.length).toBe(2);
                expect(tubes[0].name).toBe('Imported Tube 1');
                expect(tubes[1].name).toBe('Imported Tube 2');

                // Verify storage
                const storedData = localStorage.getItem(STORAGE_KEY);
                const storedTubes = JSON.parse(storedData!);
                expect(storedTubes.length).toBe(2);
                done();
            });
        });

        it('should reject invalid JSON data', (done) => {
            const invalidJson = 'invalid json {]';

            service.importTubes(invalidJson).subscribe({
                next: () => fail('Should have thrown an error'),
                error: (error) => {
                    expect(error).toBeTruthy();
                    done();
                }
            });
        });

        it('should reject non-array data', (done) => {
            const nonArrayData = JSON.stringify({ id: '1', name: 'Not an array' });

            service.importTubes(nonArrayData).subscribe({
                next: () => fail('Should have thrown an error'),
                error: (error) => {
                    expect(error.message).toContain('expected an array');
                    done();
                }
            });
        });

        it('should reject tubes with missing required fields', (done) => {
            const invalidTubes = [
                {
                    id: '100',
                    name: 'Valid Tube',
                    type: 'Triode'
                },
                {
                    id: '101'
                    // Missing name and type
                }
            ];

            const jsonData = JSON.stringify(invalidTubes);

            service.importTubes(jsonData).subscribe({
                next: () => fail('Should have thrown an error'),
                error: (error) => {
                    expect(error.message).toContain('missing required fields');
                    done();
                }
            });
        });

        it('should add empty files array if missing', (done) => {
            const tubesWithoutFiles = [
                {
                    id: '100',
                    name: 'Tube Without Files',
                    type: 'Triode',
                    manufacturer: 'Test',
                    comments: '',
                    lastUpdatedOn: '2023-01-01'
                }
            ];

            const jsonData = JSON.stringify(tubesWithoutFiles);

            service.importTubes(jsonData).subscribe(tubes => {
                expect(tubes[0].files).toBeDefined();
                expect(Array.isArray(tubes[0].files)).toBe(true);
                expect(tubes[0].files.length).toBe(0);
                done();
            });
        });
    });

    describe('clearAllData', () => {
        it('should clear all tubes and localStorage', (done) => {
            service.clearAllData().subscribe(result => {
                expect(result).toBe(true);
                expect(service.tubes.length).toBe(0);

                const storedData = localStorage.getItem(STORAGE_KEY);
                expect(storedData).toBeNull();
                done();
            });
        });
    });

    describe('ID generation', () => {
        it('should generate sequential IDs', (done) => {
            const tube1: TubeInformation = {
                id: '',
                name: 'Tube 1',
                manufacturer: 'Test',
                comments: '',
                lastUpdatedOn: '',
                type: 'Triode',
                files: []
            };

            const tube2: TubeInformation = {
                id: '',
                name: 'Tube 2',
                manufacturer: 'Test',
                comments: '',
                lastUpdatedOn: '',
                type: 'Triode',
                files: []
            };

            service.saveTube(tube1).subscribe(saved1 => {
                service.saveTube(tube2).subscribe(saved2 => {
                    expect(parseInt(saved2.id)).toBe(parseInt(saved1.id) + 1);
                    done();
                });
            });
        });
    });
});
