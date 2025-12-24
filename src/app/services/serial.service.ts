import { Injectable } from '@angular/core';
import type { SerialPort, SerialPortInfo } from './serial.types';

/**
 * Configuration options for serial port connection
 */
export interface SerialOptions {
    baudRate: number;
    dataBits?: 7 | 8;
    stopBits?: 1 | 2;
    parity?: 'none' | 'even' | 'odd';
    bufferSize?: number;
    flowControl?: 'none' | 'hardware';
}

/**
 * Default serial port configuration
 */
const DEFAULT_OPTIONS: SerialOptions = {
    baudRate: 9600,
    dataBits: 8,
    stopBits: 1,
    parity: 'none',
    bufferSize: 255,
    flowControl: 'none'
};

/**
 * Service for interacting with serial ports using the Web Serial API.
 * Provides methods to connect, send commands, read data, and manage serial port connections.
 */
@Injectable({
    providedIn: 'root'
})
export class SerialService {
    private port: SerialPort | null = null;
    private reader: ReadableStreamDefaultReader<Uint8Array> | null = null;
    private writer: WritableStreamDefaultWriter<Uint8Array> | null = null;
    private readableStreamClosed: Promise<void> | null = null;
    private writableStreamClosed: Promise<void> | null = null;

    /**
     * Check if the Web Serial API is supported in the current browser
     * @returns true if Web Serial API is available
     */
    isSupported(): boolean {
        return 'serial' in navigator;
    }

    /**
     * Check if a serial port is currently connected
     * @returns true if a port is connected
     */
    isConnected(): boolean {
        return this.port !== null && this.reader !== null && this.writer !== null;
    }

    /**
     * Request user to select a serial port and establish connection
     * @param options Serial port configuration options
     * @returns Promise that resolves when connection is established
     * @throws Error if Web Serial API is not supported or connection fails
     */
    async requestPort(options: Partial<SerialOptions> = {}): Promise<void> {
        // check for Web Serial API support
        if (!this.isSupported())
            throw new Error('Web Serial API is not supported in this browser');
        // check if already connected
        if (this.isConnected())
            throw new Error('A serial port is already connected. Disconnect first.');

        try {
            // Request port from user
            this.port = await navigator.serial.requestPort();

            // Merge options with defaults
            const serialOptions: SerialOptions = { ...DEFAULT_OPTIONS, ...options };

            // Open the port
            await this.port.open({
                baudRate: serialOptions.baudRate,
                dataBits: serialOptions.dataBits,
                stopBits: serialOptions.stopBits,
                parity: serialOptions.parity,
                bufferSize: serialOptions.bufferSize,
                flowControl: serialOptions.flowControl
            });

            // Setup reader and writer
            if (this.port.readable) {
                this.reader = this.port.readable.getReader();
            }

            if (this.port.writable) {
                this.writer = this.port.writable.getWriter();
            }

            console.log('Serial port connected successfully');
        }
        catch (error) {
            this.port = null;
            this.reader = null;
            this.writer = null;
            throw new Error(`Failed to connect to serial port: ${error}`);
        }
    }

    /**
     * Connect to a previously authorized serial port
     * @param port The SerialPort object to connect to
     * @param options Serial port configuration options
     * @returns Promise that resolves when connection is established
     */
    async connectToPort(port: SerialPort, options: Partial<SerialOptions> = {}): Promise<void> {
        if (this.isConnected()) {
            throw new Error('A serial port is already connected. Disconnect first.');
        }

        try {
            this.port = port;
            const serialOptions: SerialOptions = { ...DEFAULT_OPTIONS, ...options };

            await this.port.open({
                baudRate: serialOptions.baudRate,
                dataBits: serialOptions.dataBits,
                stopBits: serialOptions.stopBits,
                parity: serialOptions.parity,
                bufferSize: serialOptions.bufferSize,
                flowControl: serialOptions.flowControl
            });

            if (this.port.readable) {
                this.reader = this.port.readable.getReader();
            }

            if (this.port.writable) {
                this.writer = this.port.writable.getWriter();
            }

            console.log('Connected to serial port');
        }
        catch (error) {
            this.port = null;
            this.reader = null;
            this.writer = null;
            throw new Error(`Failed to connect to serial port: ${error}`);
        }
    }

    /**
     * Get list of previously authorized serial ports
     * @returns Promise that resolves to array of SerialPort objects
     */
    async getPorts(): Promise<SerialPort[]> {
        if (!this.isSupported()) {
            throw new Error('Web Serial API is not supported in this browser');
        }
        return await navigator.serial.getPorts();
    }

    /**
     * Write a command or data to the serial port
     * @param data String or Uint8Array to send
     * @returns Promise that resolves when data is written
     * @throws Error if not connected or write fails
     */
    async write(data: string | Uint8Array): Promise<void> {
        if (!this.isConnected() || !this.writer) {
            throw new Error('Serial port is not connected');
        }

        try {
            const dataToWrite = typeof data === 'string'
                ? new TextEncoder().encode(data)
                : data;

            await this.writer.write(dataToWrite);
        }
        catch (error) {
            throw new Error(`Failed to write to serial port: ${error}`);
        }
    }

    /**
     * Write a command with line ending to the serial port
     * @param command Command string to send
     * @param lineEnding Line ending to append
     * @returns Promise that resolves when command is written
     */
    async writeCommand(command: string, lineEnding = '\r\n'): Promise<void> {
        await this.write(command + lineEnding);
    }

    /**
     * Read data from the serial port
     * @param timeout Optional timeout in milliseconds
     * @returns Promise that resolves to the data read as Uint8Array
     * @throws Error if not connected or read fails
     */
    async read(timeout?: number): Promise<Uint8Array> {
        if (!this.isConnected() || !this.reader) {
            throw new Error('Serial port is not connected');
        }

        try {
            let readPromise = this.reader.read();

            if (timeout) {
                readPromise = Promise.race([
                    readPromise,
                    new Promise<ReadableStreamReadResult<Uint8Array>>((_, reject) =>
                        setTimeout(() => reject(new Error('Read timeout')), timeout)
                    )
                ]) as Promise<ReadableStreamReadResult<Uint8Array>>;
            }

            const { value, done } = await readPromise;

            if (done) {
                throw new Error('Serial port stream closed');
            }

            return value || new Uint8Array();
        }
        catch (error) {
            throw new Error(`Failed to read from serial port: ${error}`);
        }
    }

    /**
     * Read data from the serial port as a text string
     * @param timeout Optional timeout in milliseconds
     * @returns Promise that resolves to the data read as string
     */
    async readText(timeout?: number): Promise<string> {
        const data = await this.read(timeout);
        return new TextDecoder().decode(data);
    }

    /**
     * Read data until a specific delimiter is found
     * @param delimiter Delimiter to read until
     * @param timeout Optional timeout in milliseconds
     * @returns Promise that resolves to the accumulated data as string
     */
    async readUntil(delimiter = '\n', timeout?: number): Promise<string> {
        if (!this.isConnected() || !this.reader) {
            throw new Error('Serial port is not connected');
        }

        const startTime = Date.now();
        let buffer = '';

        try {
            while (true) {
                if (timeout && (Date.now() - startTime) > timeout) {
                    throw new Error('Read timeout');
                }

                const text = await this.readText(timeout ? timeout - (Date.now() - startTime) : undefined);
                buffer += text;

                const delimiterIndex = buffer.indexOf(delimiter);
                if (delimiterIndex !== -1) {
                    return buffer.substring(0, delimiterIndex);
                }
            }
        }
        catch (error) {
            throw new Error(`Failed to read until delimiter: ${error}`);
        }
    }

    /**
     * Start continuous reading from the serial port
     * @param callback Function to call with each chunk of data received
     * @param onError Optional error handler
     * @returns Promise that resolves when reading stops
     */
    async startReading(
        callback: (data: Uint8Array) => void,
        onError?: (error: Error) => void
    ): Promise<void> {
        if (!this.isConnected() || !this.reader) {
            throw new Error('Serial port is not connected');
        }

        try {
            while (true) {
                const { value, done } = await this.reader.read();

                if (done) {
                    break;
                }

                if (value) {
                    callback(value);
                }
            }
        }
        catch (error) {
            if (onError) {
                onError(error as Error);
            }
            else {
                console.error('Error during continuous reading:', error);
            }
        }
    }

    /**
     * Disconnect from the serial port
     * @returns Promise that resolves when disconnection is complete
     */
    async disconnect(): Promise<void> {
        try {
            // Cancel reader
            if (this.reader) {
                await this.reader.cancel();
                this.readableStreamClosed = this.port?.readable?.cancel() ?? null;
                this.reader = null;
            }

            // Close writer
            if (this.writer) {
                await this.writer.close();
                this.writableStreamClosed = this.port?.writable?.close() ?? null;
                this.writer = null;
            }

            // Wait for streams to close
            await Promise.all([
                this.readableStreamClosed,
                this.writableStreamClosed
            ]);

            // Close port
            if (this.port) {
                await this.port.close();
                this.port = null;
            }

            this.readableStreamClosed = null;
            this.writableStreamClosed = null;

            console.log('Serial port disconnected');
        }
        catch (error) {
            console.error('Error disconnecting from serial port:', error);
            throw new Error(`Failed to disconnect: ${error}`);
        }
    }

    /**
     * Get information about the connected port
     * @returns SerialPortInfo object or null if not connected
     */
    getPortInfo(): SerialPortInfo | null {
        if (!this.port) {
            return null;
        }
        return this.port.getInfo();
    }
}
