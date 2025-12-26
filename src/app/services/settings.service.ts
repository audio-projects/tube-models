import { Injectable } from '@angular/core';

@Injectable({
    providedIn: 'root'
})
export class SettingsService {

    private readonly storagePrefix = 'tube_models_';

    /**
     * Get a value from local storage
     * @param key The key to retrieve
     * @returns The stored value or null if not found
     */
    get<T>(key: string): T | null {
        try {
            // load from storage
            const item = localStorage.getItem(this.storagePrefix + key);
            if (item === null)
                return null;
            // parse and return
            return JSON.parse(item) as T;
        }
        catch (error) {
            // log error
            console.error(`Error getting setting "${key}":`, error);
            // return null on error
            return null;
        }
    }

    /**
     * Set a value in local storage
     * @param key The key to store
     * @param value The value to store
     */
    set<T>(key: string, value: T): void {
        try {
            // store in local storage
            localStorage.setItem(this.storagePrefix + key, JSON.stringify(value));
        }
        catch (error) {
            // log error
            console.error(`Error setting setting "${key}":`, error);
        }
    }

    /**
     * Remove a value from local storage
     * @param key The key to remove
     */
    remove(key: string): void {
        try {
            // remove from storage
            localStorage.removeItem(this.storagePrefix + key);
        }
        catch (error) {
            // log error
            console.error(`Error removing setting "${key}":`, error);
        }
    }

    /**
     * Check if a key exists in local storage
     * @param key The key to check
     * @returns True if the key exists
     */
    has(key: string): boolean {
        // check if key exists in local storage
        return localStorage.getItem(this.storagePrefix + key) !== null;
    }

    /**
     * Clear all settings with the app prefix
     */
    clear(): void {
        try {
            // keys to remove
            const keysToRemove: string[] = [];
            // loop through local storage
            for (let i = 0; i < localStorage.length; i++) {
                // check key is ours
                const key = localStorage.key(i);
                if (key?.startsWith(this.storagePrefix))
                    keysToRemove.push(key);
            }
            // remove keys
            keysToRemove.forEach(key => localStorage.removeItem(key));
        }
        catch (error) {
            // log error
            console.error('Error clearing settings:', error);
        }
    }

    /**
     * Get all keys with the app prefix
     * @returns Array of keys (without prefix)
     */
    keys(): string[] {
        try {
            const keys: string[] = [];
            // loop through local storage
            for (let i = 0; i < localStorage.length; i++) {
                // check key is ours
                const key = localStorage.key(i);
                if (key?.startsWith(this.storagePrefix))
                    keys.push(key.substring(this.storagePrefix.length));
            }
            return keys;
        }
        catch (error) {
            // log error
            console.error('Error getting setting keys:', error);
            // no keys
            return [];
        }
    }
}
