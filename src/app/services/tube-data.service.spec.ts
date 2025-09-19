// import { TestBed } from '@angular/core/testing';
// import { TubeDataService } from './tube-data.service';
// import { TubeInformation } from '../components/tube-information';

// describe('TubeDataService', () => {
//     let service: TubeDataService;

//     beforeEach(() => {
//         TestBed.configureTestingModule({});
//         service = TestBed.inject(TubeDataService);
//         // Clear localStorage before each test
//         localStorage.clear();
//     });

//     it('should be created', () => {
//         expect(service).toBeTruthy();
//     });

//     it('should load default data when localStorage is empty', () => {
//         const tubes = service.tubes;
//         expect(tubes.length).toBe(5);
//         expect(tubes[0].name).toBe('ECC83');
//     });

//     it('should generate unique IDs', () => {
//         const tube1: TubeInformation = {
//             id: '',
//             name: 'Test Tube 1',
//             manufacturer: 'Test Manufacturer',
//             comments: 'Test comments',
//             lastUpdatedOn: '2023-01-01',
//             type: 'Triode',
//             files: []
//         };

//         service.saveTube(tube1).subscribe(savedTube => {
//             expect(savedTube.id).toBeTruthy();
//             expect(savedTube.id).not.toBe('');
//         });
//     });

//     it('should save and retrieve tubes', () => {
//         const testTube: TubeInformation = {
//             id: '',
//             name: 'Test Tube',
//             manufacturer: 'Test Manufacturer',
//             comments: 'Test comments',
//             lastUpdatedOn: '2023-01-01',
//             type: 'Triode',
//             files: []
//         };

//         service.saveTube(testTube).subscribe(savedTube => {
//             const retrievedTube = service.getTubeById(savedTube.id);
//             expect(retrievedTube).toBeTruthy();
//             expect(retrievedTube?.name).toBe('Test Tube');
//         });
//     });

//     it('should delete tubes', () => {
//         const initialCount = service.tubes.length;
//         const tubeToDelete = service.tubes[0];

//         service.deleteTube(tubeToDelete.id).subscribe(success => {
//             expect(success).toBe(true);
//             expect(service.tubes.length).toBe(initialCount - 1);
//             expect(service.getTubeById(tubeToDelete.id)).toBeNull();
//         });
//     });

//     it('should duplicate tubes', () => {
//         const originalTube = service.tubes[0];
//         const originalCount = service.tubes.length;

//         service.duplicateTube(originalTube).subscribe(duplicatedTube => {
//             expect(service.tubes.length).toBe(originalCount + 1);
//             expect(duplicatedTube.name).toBe(`${originalTube.name} (Copy)`);
//             expect(duplicatedTube.id).not.toBe(originalTube.id);
//         });
//     });

//     it('should export tubes data', () => {
//         const exportedData = service.exportAllTubes();
//         const parsedData = JSON.parse(exportedData);
//         expect(Array.isArray(parsedData)).toBe(true);
//         expect(parsedData.length).toBe(service.tubes.length);
//     });

//     it('should import tubes data', () => {
//         const testData = [
//             {
//                 id: '100',
//                 name: 'Imported Tube',
//                 manufacturer: 'Imported Manufacturer',
//                 comments: 'Imported comments',
//                 lastUpdatedOn: '2023-01-01',
//                 type: 'Triode',
//                 files: []
//             }
//         ];

//         service.importTubes(JSON.stringify(testData)).subscribe(importedTubes => {
//             expect(importedTubes.length).toBe(1);
//             expect(importedTubes[0].name).toBe('Imported Tube');
//             expect(service.tubes.length).toBe(1);
//         });
//     });
// });
