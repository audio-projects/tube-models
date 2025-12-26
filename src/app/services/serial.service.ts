import { Injectable } from '@angular/core';
import type { SerialPort } from './serial.types';

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
     * @returns Promise that resolves when connection is established
     * @throws Error if Web Serial API is not supported or connection fails
     * @note Communication parameters are locked to uTracer requirements: 9600-8-N-1
     */
    async requestPort(): Promise<void> {
        // check for Web Serial API support
        if (!this.isSupported())
            return Promise.reject(new Error('Web Serial API is not supported in this browser'));
        // check if already connected
        if (this.isConnected())
            return Promise.reject(new Error('A serial port is already connected. Disconnect first.'));
        try {
            // request port from user
            this.port = await navigator.serial.requestPort();
            // open port with uTracer settings
            await this.port.open({baudRate: 9600, dataBits: 8, stopBits: 1, parity: 'none', bufferSize: 255, flowControl: 'none'});
            // reader
            if (this.port.readable)
                this.reader = this.port.readable.getReader();
            // writer
            if (this.port.writable)
                this.writer = this.port.writable.getWriter();
            // validate connection
            if (!this.port || !this.reader || !this.writer)
                return Promise.reject(new Error('Failed to establish serial port connection'));
        }
        catch (error) {
            // cleanup on failure
            this.port = null;
            this.reader = null;
            this.writer = null;
            // return rejected promise
            return Promise.reject(new Error(`Failed to connect to serial port: ${error}`));
        }
    }

    /**
     * Disconnect from the serial port
     * @returns Promise that resolves when disconnection is complete
     */
    async disconnect(): Promise<void> {
        try {
            // check reader is present
            if (this.reader) {
                // cancel reader
                await this.reader.cancel();
                // cancel stream
                this.readableStreamClosed = this.port?.readable?.cancel() ?? null;
                // reset value
                this.reader = null;
            }
            // check writer is present
            if (this.writer) {
                // close writer
                await this.writer.close();
                // close stream
                this.writableStreamClosed = this.port?.writable?.close() ?? null;
                // reset value
                this.writer = null;
            }
            // wait for streams to close
            await Promise.all([this.readableStreamClosed, this.writableStreamClosed]);
            // check port is present
            if (this.port) {
                // close port
                await this.port.close();
                // reset value
                this.port = null;
            }
            // reset streams
            this.readableStreamClosed = null;
            this.writableStreamClosed = null;
        }
        catch (error) {
            // error
            return Promise.reject(new Error(`Failed to disconnect: ${error}`));
        }
    }

    private async read(timeout: number): Promise<Uint8Array> {
        // ensure connected
        if (!this.isConnected() || !this.reader)
            return Promise.reject(new Error('Serial port is not connected'));
        try {
            // read from port
            let readPromise = this.reader.read();
            // apply timeout
            readPromise = Promise.race([readPromise, new Promise<ReadableStreamReadResult<Uint8Array>>((_, reject) =>setTimeout(() => reject(new Error('Read timeout')), timeout))]) as Promise<ReadableStreamReadResult<Uint8Array>>;
            // await read
            const { value, done } = await readPromise;
            // check channel is closed
            if (done)
                return Promise.reject(new Error('Serial port stream closed'));
            // return data
            return value || new Uint8Array();
        }
        catch (error) {
            // return rejected promise
            return Promise.reject(new Error(`Failed to read from serial port: ${error}`));
        }
    }

    private async readBytes(expectingBytes: number, timeout: number): Promise<Uint8Array> {
        try {
            // pre-allocate buffer to expected size
            const buffer = new Uint8Array(expectingBytes);
            let bytesRead = 0;
            // read all data up to expectingBytes
            while (bytesRead < expectingBytes) {
                // read data
                const data = await this.read(timeout);
                // copy to buffer
                buffer.set(data, bytesRead);
                // update bytes read
                bytesRead += data.length;
            }
            return buffer.slice(0, bytesRead);
        }
        catch (error) {
            // return rejected promise
            return Promise.reject(new Error(`Failed to read from serial port: ${error}`));
        }
    }

    /**
     * Abort the current operation on the uTracer
     * Command: 00 0000 0000 0000 0000
     *
     * @returns Promise that resolves when abort is successful
     * @throws Error if not connected or command fails
     */
    async abort(): Promise<void> {
        // 00 0000 0000 0000 0000
        const command = new Uint8Array([0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]);
        // send command with echo validation
        await this.sendCommand(command);
    }

    /**
     * Ends the current operation on the uTracer
     * Command: 30 0000 0000 0000 0000
     *
     * @returns Promise that resolves when end is successful
     * @throws Error if not connected or command fails
     */
    async end(): Promise<void> {
        // 30 0000 0000 0000 0000
        const command = new Uint8Array([0x30, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]);
        // send command with echo validation
        await this.sendCommand(command);
    }

    /**
     * Ping the uTracer to verify communication
     * Command: 50 0000 0000 0000 0000
     *
     * @returns Promise that resolves when ping is successful
     * @throws Error if not connected or command fails
     */
    async ping(): Promise<void> {
        // 50 0000 0000 0000 0000
        const command = new Uint8Array([0x50, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]);
        // send command with echo validation
        await this.sendCommand(command);
    }

    /**
     * Set the heater voltage on the uTracer
     * Command: 40 0000 0000 0000 (heater voltage in last 2 bytes)
     *
     * @param voltage Heater voltage to set
     * @param powerSupply Power supply voltage (default 19V)
     * @returns Promise that resolves when voltage is set
     * @throws Error if not connected or command fails
     */
    async setHeaterVoltage(voltage: number, powerSupply = 19): Promise<void> {
        // calculate 10-bit PWM value: n = 1023 * (voltage / powerSupply)^2
        const ratio = voltage / powerSupply;
        const n = Math.round(1023 * ratio * ratio);
        // build command: 40 0000 0000 0000 (heater voltage in last 2 bytes)
        const command = new Uint8Array([0x40, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00].concat(this.valueTo10BitBytes(n)));
        // send command with echo validation
        await this.sendCommand(command);
    }

    /**
     * Start a measurement sequence with the uTracer
     * Command: 00 0000 0000 (compliance, 2 bytes) (averaging, 2 bytes) (screen gain, 2 bytes) (plate gain, 2 bytes)
     *
     * @param compliance Maximum allowed current (compliance limit)
     * @param averaging Number of measurements to average
     * @param screenGain Screen grid gain setting
     * @param plateGain Plate (anode) gain setting
     * @returns Promise that resolves when measurement sequence is started
     * @throws Error if not connected or command fails
     */
    async start(compliance: number, averaging: number, screenGain: number, plateGain: number): Promise<void> {
        // 00 0000 0000 0000 0000
        const command = new Uint8Array([0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]);
        // send command with echo validation
        await this.sendCommand(command);
    }

    /**
     * Perform a measurement on the uTracer
     * @param plateVoltage Plate (anode) voltage
     * @param screenVoltage Screen grid voltage
     * @param gridVoltage Control grid voltage
     * @param heaterVoltage Heater voltage
     * @returns Promise that resolves when measurement is complete
     * @throws Error if not connected or command fails
     */
    async measure(_plateVoltage: number, _screenVoltage: number, _gridVoltage: number, _heaterVoltage: number): Promise<void> {
        // TODO: Implement uTracer measure command
    }

    /**
     * Convert a 10-bit value to two bytes for uTracer protocol
     * @param value 10-bit value (0-1023)
     * @returns Array with [high byte, low byte] where high byte uses only lower 2 bits
     */
    private valueTo10BitBytes(value: number): [number, number] {
        // clamp to 10-bit range
        const clamped = Math.max(0, Math.min(1023, value));
        // split into high and low bytes (upper 6 bits zero)
        const high = (clamped >> 8) & 0x03; // only lower 2 bits used
        const low = clamped & 0xFF;
        // return bytes
        return [high, low];
    }

    private async sendCommand(command: Uint8Array): Promise<void> {
        // ensure connected
        if (!this.isConnected() || !this.writer)
            return Promise.reject(new Error('Serial port is not connected'));
        // validate command length
        if (command.length !== 9)
            return Promise.reject(new Error(`uTracer command must be 9 bytes long. Received: ${command.length} bytes.`));
        // send command
        await this.writer.write(command);
        // read and validate echo (9 bytes, 1 second timeout)
        const echo = await this.readBytes(9, 1000);
        // loop data
        for (let i = 0; i < command.length; i++) {
            // compare byte
            if (echo[i] !== command[i])
                return Promise.reject(new Error(`uTracer echo validation failed at byte ${i}. Expected: ${command[i]}, Received: ${echo[i]}`));
        }
    }

    private async sendCommandWithResponse(command: Uint8Array): Promise<Uint8Array> {
        // send command
        await this.sendCommand(command);
        // read response (19 bytes, 2 second timeout)
        return await this.readBytes(19, 2000);
    }
}
