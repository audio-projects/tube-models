import { TestBed } from '@angular/core/testing';
import { SettingsService } from './settings.service';

describe('SettingsService', () => {

    let service: SettingsService;
    let localStorageSpy: jasmine.SpyObj<Storage>;

    beforeEach(() => {
        const storage: Record<string, string> = {};
        localStorageSpy = jasmine.createSpyObj('localStorage', ['getItem', 'setItem', 'removeItem', 'clear', 'key'], { length: 0 });
        localStorageSpy.getItem.and.callFake((key: string) => storage[key] ?? null);
        localStorageSpy.setItem.and.callFake((key: string, value: string) => {
            storage[key] = value;
            Object.defineProperty(localStorageSpy, 'length', { value: Object.keys(storage).length, writable: true });
        });
        localStorageSpy.removeItem.and.callFake((key: string) => {
            delete storage[key];
            Object.defineProperty(localStorageSpy, 'length', { value: Object.keys(storage).length, writable: true });
        });
        localStorageSpy.key.and.callFake((index: number) => {
            const keys = Object.keys(storage);
            return keys[index] ?? null;
        });
        Object.defineProperty(window, 'localStorage', { value: localStorageSpy, writable: true });
        TestBed.configureTestingModule({});
        service = TestBed.inject(SettingsService);
    });

    afterEach(() => {
        localStorage.clear();
    });

    describe('get', () => {

        it('should return null for non-existent key', () => {
            // arrange
            const key = 'nonExistentKey';
            // act
            const result = service.get(key);
            // assert
            expect(result).toBeNull();
            expect(localStorageSpy.getItem).toHaveBeenCalledWith('tube_models_nonExistentKey');
        });

        it('should retrieve string value', () => {
            // arrange
            const key = 'testKey';
            const value = 'testValue';
            service.set(key, value);
            // act
            const result = service.get<string>(key);
            // assert
            expect(result).toBe(value);
        });

        it('should retrieve number value', () => {
            // arrange
            const key = 'numberKey';
            const value = 42;
            service.set(key, value);
            // act
            const result = service.get<number>(key);
            // assert
            expect(result).toBe(value);
        });

        it('should retrieve boolean value', () => {
            // arrange
            const key = 'boolKey';
            const value = true;
            service.set(key, value);
            // act
            const result = service.get<boolean>(key);
            // assert
            expect(result).toBe(value);
        });

        it('should retrieve object value', () => {
            // arrange
            const key = 'objKey';
            const value = {name: 'test', count: 5};
            service.set(key, value);
            // act
            const result = service.get<{name: string; count: number}>(key);
            // assert
            expect(result).toEqual(value);
        });

        it('should retrieve array value', () => {
            // arrange
            const key = 'arrayKey';
            const value = [1, 2, 3];
            service.set(key, value);
            // act
            const result = service.get<number[]>(key);
            // assert
            expect(result).toEqual(value);
        });

        it('should return null on JSON parse error', () => {
            // arrange
            const key = 'invalidKey';
            localStorageSpy.getItem.and.returnValue('invalid json');
            // act
            const result = service.get(key);
            // assert
            expect(result).toBeNull();
        });
    });

    describe('set', () => {

        it('should store string value with prefix', () => {
            // arrange
            const key = 'testKey';
            const value = 'testValue';
            // act
            service.set(key, value);
            // assert
            expect(localStorageSpy.setItem).toHaveBeenCalledWith('tube_models_testKey', JSON.stringify(value));
        });

        it('should store number value', () => {
            // arrange
            const key = 'numberKey';
            const value = 123;
            // act
            service.set(key, value);
            // assert
            expect(localStorageSpy.setItem).toHaveBeenCalledWith('tube_models_numberKey', '123');
        });

        it('should store object value', () => {
            // arrange
            const key = 'objKey';
            const value = {test: 'data'};
            // act
            service.set(key, value);
            // assert
            expect(localStorageSpy.setItem).toHaveBeenCalledWith('tube_models_objKey', JSON.stringify(value));
        });

        it('should handle errors gracefully', () => {
            // arrange
            const key = 'errorKey';
            const value = 'test';
            localStorageSpy.setItem.and.throwError('Storage full');
            spyOn(console, 'error');
            // act
            service.set(key, value);
            // assert
            expect(console.error).toHaveBeenCalled();
        });
    });

    describe('remove', () => {

        it('should remove existing key', () => {
            // arrange
            const key = 'removeKey';
            service.set(key, 'value');
            // act
            service.remove(key);
            // assert
            expect(localStorageSpy.removeItem).toHaveBeenCalledWith('tube_models_removeKey');
            expect(service.get(key)).toBeNull();
        });

        it('should handle removing non-existent key', () => {
            // arrange
            const key = 'nonExistent';
            // act
            service.remove(key);
            // assert
            expect(localStorageSpy.removeItem).toHaveBeenCalledWith('tube_models_nonExistent');
        });

        it('should handle errors gracefully', () => {
            // arrange
            const key = 'errorKey';
            localStorageSpy.removeItem.and.throwError('Remove error');
            spyOn(console, 'error');
            // act
            service.remove(key);
            // assert
            expect(console.error).toHaveBeenCalled();
        });
    });

    describe('has', () => {

        it('should return true for existing key', () => {
            // arrange
            const key = 'existingKey';
            service.set(key, 'value');
            // act
            const result = service.has(key);
            // assert
            expect(result).toBe(true);
        });

        it('should return false for non-existent key', () => {
            // arrange
            const key = 'nonExistent';
            // act
            const result = service.has(key);
            // assert
            expect(result).toBe(false);
        });
    });

    describe('clear', () => {

        it('should remove all app settings', () => {
            // arrange
            service.set('key1', 'value1');
            service.set('key2', 'value2');
            service.set('key3', 'value3');
            // act
            service.clear();
            // assert
            expect(service.get('key1')).toBeNull();
            expect(service.get('key2')).toBeNull();
            expect(service.get('key3')).toBeNull();
        });

        it('should not remove keys from other apps', () => {
            // arrange
            service.set('appKey', 'appValue');
            localStorageSpy.setItem('other_app_key', 'otherValue');
            // act
            service.clear();
            // assert
            expect(service.get('appKey')).toBeNull();
            expect(localStorageSpy.getItem('other_app_key')).toBe('otherValue');
        });

        it('should handle errors gracefully', () => {
            // arrange
            service.set('key1', 'value1');
            localStorageSpy.removeItem.and.throwError('Clear error');
            spyOn(console, 'error');
            // act
            service.clear();
            // assert
            expect(console.error).toHaveBeenCalled();
        });
    });

    describe('keys', () => {

        it('should return empty array when no settings exist', () => {
            // arrange + act
            const result = service.keys();
            // assert
            expect(result).toEqual([]);
        });

        it('should return all app setting keys without prefix', () => {
            // arrange
            service.set('key1', 'value1');
            service.set('key2', 'value2');
            service.set('key3', 'value3');
            // act
            const result = service.keys();
            // assert
            expect(result).toContain('key1');
            expect(result).toContain('key2');
            expect(result).toContain('key3');
            expect(result.length).toBe(3);
        });

        it('should not return keys from other apps', () => {
            // arrange
            service.set('appKey', 'appValue');
            localStorageSpy.setItem('other_app_key', 'otherValue');
            Object.defineProperty(localStorageSpy, 'length', { value: 2, writable: true });
            // act
            const result = service.keys();
            // assert
            expect(result).toContain('appKey');
            expect(result).not.toContain('other_app_key');
            expect(result.length).toBe(1);
        });

        it('should handle errors gracefully', () => {
            // arrange
            Object.defineProperty(localStorageSpy, 'length', { get: () => { throw new Error('Length error'); } });
            spyOn(console, 'error');
            // act
            const result = service.keys();
            // assert
            expect(console.error).toHaveBeenCalled();
            expect(result).toEqual([]);
        });
    });
});
