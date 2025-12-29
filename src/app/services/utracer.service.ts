import { inject, Injectable } from '@angular/core';
import type { SerialPort } from './serial.types';
import { SettingsService } from './settings.service';

export interface UTracerResponse {
    status: number;
    plateCurrentAfterPGA: number;
    plateCurrentBeforePGA: number;
    screenCurrentAfterPGA: number;
    screenCurrentBeforePGA: number;
    plateVoltage: number;
    screenVoltage: number;
    powerSupplyVoltage: number;
    negativeVoltage: number;
    platePGAGain: number;
    screenPGAGain: number;
}

export type Compliance = 200 | 175 | 150 | 125 | 100 | 75 | 50 | 25 | 0;

export type Averaging = 0 | 2 | 4 | 8 | 16 | 32 | 0x40;

export type CurrentGain = 0x00 | 0x01 | 0x02 | 0x03 | 0x04 | 0x05 | 0x06 | 0x07 | 0x08;

const encoder = new TextEncoder();
const decoder = new TextDecoder();


@Injectable({
    providedIn: 'root'
})
export class UTracerService {

    private port: SerialPort | null = null;
    // private reader: ReadableStreamDefaultReader<Uint8Array> | null = null;
    // private writer: WritableStreamDefaultWriter<Uint8Array> | null = null;
    // private readableStreamClosed: Promise<void> | null = null;
    // private writableStreamClosed: Promise<void> | null = null;

    private settingsService = inject(SettingsService);

    private _hardwareVersion: string = this.settingsService.get<string>('utracer.version') ?? '3';

    // calibration related fields
    private _plateVoltageGain = this.settingsService.get<number>('utracer.calibration.plateVoltageGain') ?? 1.0;
    private _screenVoltageGain = this.settingsService.get<number>('utracer.calibration.screenVoltageGain') ?? 1.0;
    private _plateCurrentGain = this.settingsService.get<number>('utracer.calibration.plateCurrentGain') ?? 1.0;
    private _screenCurrentGain = this.settingsService.get<number>('utracer.calibration.screenCurrentGain') ?? 1.0;
    private _powerSupplyVoltageFactor = this.settingsService.get<number>('utracer.calibration.powerSupplyVoltageFactor') ?? 1.0;
    private _saturationVoltageFactor = this.settingsService.get<number>('utracer.calibration.saturationVoltageFactor') ?? 1.0;
    private _grid40VoltVoltageFactor = this.settingsService.get<number>('utracer.calibration.grid40VoltVoltageFactor') ?? 1.0;
    private _grid4VoltVoltageFactor = this.settingsService.get<number>('utracer.calibration.grid4VoltVoltageFactor') ?? 1.0;
    private _gridSaturationVoltageFactor = this.settingsService.get<number>('utracer.calibration.gridSaturationVoltageFactor') ?? 1.0;


    get hardwareVersion(): string {
        return this._hardwareVersion;
    }

    set hardwareVersion(value: string) {
        // set and persist value
        this._hardwareVersion = value;
        this.settingsService.set('utracer.version', value);
    }

    get plateVoltageGain(): number {
        return this._plateVoltageGain;
    }

    set plateVoltageGain(value: number) {
        // set and persist value
        this._plateVoltageGain = value;
        this.settingsService.set('utracer.calibration.plateVoltageGain', value);
    }

    get screenVoltageGain(): number {
        return this._screenVoltageGain;
    }

    set screenVoltageGain(value: number) {
        // set and persist value
        this._screenVoltageGain = value;
        this.settingsService.set('utracer.calibration.screenVoltageGain', value);
    }

    get plateCurrentGain(): number {
        return this._plateCurrentGain;
    }

    set plateCurrentGain(value: number) {
        // set and persist value
        this._plateCurrentGain = value;
        this.settingsService.set('utracer.calibration.plateCurrentGain', value);
    }

    get screenCurrentGain(): number {
        return this._screenCurrentGain;
    }

    set screenCurrentGain(value: number) {
        // set and persist value
        this._screenCurrentGain = value;
        this.settingsService.set('utracer.calibration.screenCurrentGain', value);
    }

    get powerSupplyVoltageFactor(): number {
        return this._powerSupplyVoltageFactor;
    }

    set powerSupplyVoltageFactor(value: number) {
        // set and persist value
        this._powerSupplyVoltageFactor = value;
        this.settingsService.set('utracer.calibration.powerSupplyVoltageFactor', value);
    }

    get saturationVoltageFactor(): number {
        return this._saturationVoltageFactor;
    }

    set saturationVoltageFactor(value: number) {
        // set and persist value
        this._saturationVoltageFactor = value;
        this.settingsService.set('utracer.calibration.saturationVoltageFactor', value);
    }

    get grid40VoltVoltageFactor(): number {
        return this._grid40VoltVoltageFactor;
    }

    set grid40VoltVoltageFactor(value: number) {
        // set and persist value
        this._grid40VoltVoltageFactor = value;
        this.settingsService.set('utracer.calibration.grid40VoltVoltageFactor', value);
    }

    get grid4VoltVoltageFactor(): number {
        return this._grid4VoltVoltageFactor;
    }

    set grid4VoltVoltageFactor(value: number) {
        // set and persist value
        this._grid4VoltVoltageFactor = value;
        this.settingsService.set('utracer.calibration.grid4VoltVoltageFactor', value);
    }

    get gridSaturationVoltageFactor(): number {
        return this._gridSaturationVoltageFactor;
    }

    set gridSaturationVoltageFactor(value: number) {
        // set and persist value
        this._gridSaturationVoltageFactor = value;
        this.settingsService.set('utracer.calibration.gridSaturationVoltageFactor', value);
    }

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
        return this.port !== null; // && this.reader !== null && this.writer !== null;
    }

    /**
     * Request user to select a serial port and establish connection
     * @returns Promise that resolves when connection is established
     * @throws Error if Web Serial API is not supported or connection fails
     * @note Communication parameters are locked to uTracer requirements: 9600-8-N-1
     */
    async connect(): Promise<void> {
        try {
            // check for Web Serial API support
            if (!this.isSupported())
                return Promise.reject(new Error('Web Serial API is not supported in this browser'));
            // check if already connected
            if (this.isConnected())
                return Promise.reject(new Error('A serial port is already connected. Disconnect first.'));
            // request port from user
            this.port = await navigator.serial.requestPort();
            // open port with uTracer settings
            await this.port.open({baudRate: 9600, dataBits: 8, stopBits: 1, parity: 'none', bufferSize: 255, flowControl: 'none'});
            // // reader
            // if (this.port.readable)
            //     this.reader = this.port.readable.getReader();
            // // writer
            // if (this.port.writable)
            //     this.writer = this.port.writable.getWriter();
            // // validate connection
            // if (!this.port || !this.reader || !this.writer)
            //     return Promise.reject(new Error('Failed to establish serial port connection'));
        }
        catch (error) {
            // cleanup on failure
            this.port = null;
            // this.reader = null;
            // this.writer = null;
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
            // // check reader is present
            // if (this.reader) {
            //     // cancel reader
            //     await this.reader.cancel();
            //     // cancel stream
            //     this.readableStreamClosed = this.port?.readable?.cancel() ?? null;
            //     // reset value
            //     this.reader = null;
            // }
            // // check writer is present
            // if (this.writer) {
            //     // close writer
            //     await this.writer.close();
            //     // close stream
            //     this.writableStreamClosed = this.port?.writable?.close() ?? null;
            //     // reset value
            //     this.writer = null;
            // }
            // // wait for streams to close
            // await Promise.all([this.readableStreamClosed, this.writableStreamClosed]);
            // check port is present
            if (this.port) {
                // close port
                await this.port.close();
                // reset value
                this.port = null;
            }
            // reset streams
            // this.readableStreamClosed = null;
            // this.writableStreamClosed = null;
        }
        catch (error) {
            // error
            return Promise.reject(new Error(`Failed to disconnect: ${error}`));
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
     * Ping the uTracer to verify communication, reads response data
     * Command: 50 0000 0000 0000 0000
     *
     * @returns Promise that resolves with the uTracer response data
     * @throws Error if not connected or command fails
     */
    async ping(): Promise<UTracerResponse> {
        // 50 0000 0000 0000 0000
        const command = new Uint8Array([0x50, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]);
        // send command
        return await this.sendCommandWithResponse(command);
    }

    private calculatePlateBytes(plateVoltage: number): [number, number] {
        // bytes
        return this.valueTo10BitBytes(0);
    }

    private calculateScreenBytes(screenVoltage: number): [number, number] {
        // bytes
        return this.valueTo10BitBytes(0);
    }

    private calculateGridBytes(gridVoltage: number): [number, number] {
        // bytes
        return this.valueTo10BitBytes(0);
    }

    private calculateHeaterBytes(heaterVoltage: number, powerSupplyVoltage: number): [number, number] {
        // prevent division by zero
        if (powerSupplyVoltage <= 0)
            return [0, 0];
        // calculate 10-bit PWM value: n = 1023 * (voltage / powerSupply)^2
        const ratio = heaterVoltage / powerSupplyVoltage;
        // n
        const n = Math.floor(1023 * ratio * ratio);
        // bytes
        return this.valueTo10BitBytes(n);
    }

    /**
     * Set the heater voltage on the uTracer
     * Command: 40 0000 0000 0000 (heater voltage in last 2 bytes)
     *
     * @param voltage Heater voltage to set
     * @param powerSupplyVoltage Power supply voltage (~ 19V)
     * @returns Promise that resolves when voltage is set
     * @throws Error if not connected or command fails
     */
    async setHeaterVoltage(voltage: number, powerSupplyVoltage: number): Promise<void> {
        // build command: 40 0000 0000 0000 (heater voltage in last 2 bytes)
        const command = new Uint8Array([0x40, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00].concat(this.calculateHeaterBytes(voltage, powerSupplyVoltage)));
        // send command with echo validation
        await this.sendCommand(command);
    }

    /**
     * Start a measurement sequence with the uTracer
     * Command: 00 0000 0000 (compliance, 1 byte) (averaging, 1 byte) (screen gain, 1 byte) (plate gain, 1 byte)
     *
     * @param compliance Maximum allowed current (compliance limit)
     * @param averaging Number of measurements to average
     * @param plateGain Plate (anode) gain setting
     * @param screenGain Screen grid gain setting
     * @returns Promise that resolves when measurement sequence is started
     * @throws Error if not connected or command fails
     */
    async start(compliance: Compliance = 0, averaging: Averaging = 0x40, plateGain: CurrentGain = 0x08, screenGain: CurrentGain = 0x08): Promise<void> {
        // 00 0000 0000 (compliance, 1 byte) (averaging, 1 byte) (screen gain, 1 byte) (plate gain, 1 byte)
        const command = new Uint8Array([0x00, 0x00, 0x00, 0x00, 0x00, compliance & 0xFF, averaging & 0xFF, plateGain & 0xFF, screenGain & 0xFF]);
        // send command with echo validation
        await this.sendCommand(command);
    }

    /**
     * Set all the voltages on the uTracer to the given values and hold
     * Command: 20 (plate voltage, 2 bytes) (screen voltage, 2 bytes) (grid voltage, 2 bytes) (heater voltage, 2 bytes)
     *
     * @param plateVoltage Plate (anode) voltage
     * @param screenVoltage Screen grid voltage
     * @param gridVoltage Control grid voltage
     * @param heaterVoltage Heater voltage
     *
     * @returns Promise that resolves when voltages are set
     * @throws Error if not connected or command fails
     */
    async set(powerSupplyVoltage: number, plateVoltage: number, screenVoltage: number, gridVoltage: number, heaterVoltage: number): Promise<void> {
        // build command: 20 (plate voltage) (screen voltage) (grid voltage) (heater voltage)
        const command = new Uint8Array([0x20].concat(...this.calculatePlateBytes(plateVoltage), ...this.calculateScreenBytes(screenVoltage),  ...this.calculateGridBytes(gridVoltage), ...this.calculateHeaterBytes(heaterVoltage, powerSupplyVoltage)));
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
    async measure(powerSupplyVoltage: number, plateVoltage: number, screenVoltage: number, gridVoltage: number, heaterVoltage: number): Promise<UTracerResponse> {
        // build command: 10 (plate voltage) (screen voltage) (grid voltage) (heater voltage)
        const command = new Uint8Array([0x10].concat(...this.calculatePlateBytes(plateVoltage), ...this.calculateScreenBytes(screenVoltage),  ...this.calculateGridBytes(gridVoltage), ...this.calculateHeaterBytes(heaterVoltage, powerSupplyVoltage)));
        // send command
        return await this.sendCommandWithResponse(command);
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

    /**
     * Convert two bytes from uTracer protocol back to 10-bit value (reverse of valueTo10BitBytes)
     * @param high High byte (only lower 2 bits used)
     * @param low Low byte
     * @returns 10-bit value (0-1023)
     */
    private bytesTo10BitValue(high: number, low: number): number {
        // combine bytes, masking high byte to only use lower 2 bits
        return ((high & 0x03) << 8) | (low & 0xFF);
    }

    private async read(reader: ReadableStreamDefaultReader<Uint8Array>, timeout: number): Promise<Uint8Array> {
        // timer
        let timer: ReturnType<typeof setTimeout> | null = null;
        // timeout promise
        const timeoutPromise = new Promise<ReadableStreamReadResult<Uint8Array>>((_, reject) => {
            // create timer
            timer = setTimeout(() => reject(new Error('Read timeout')), timeout);
        });
        try {
            // apply timeout
            const readPromise = Promise.race([reader.read(), timeoutPromise]);
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
        finally {
            // clear timer
            if (timer)
                clearTimeout(timer);
        }
    }

    private async sendCommand(command: Uint8Array): Promise<void> {
        // ensure connected
        if (!this.isConnected())
            return Promise.reject(new Error('Serial port is not connected'));
        // validate command length
        if (command.length !== 9)
            return Promise.reject(new Error(`uTracer command must be 9 bytes long. Received: ${command.length} bytes.`));
        // reader and writer
        const reader = this.port!.readable?.getReader();
        const writer = this.port!.writable?.getWriter();
        // validate streams
        if (!reader || !writer)
            return Promise.reject(new Error('Serial port streams are not available'));

        try {
            // command bytes
            const commandString = Array.from(command)
                .map(b => b.toString(16).padStart(2, '0').toUpperCase())
                .join('');
            // log command
            console.log(`uTracer => ${commandString}`);
            // send command
            await writer.write(encoder.encode(commandString));
            // read and validate echo (18 bytes for 9-byte command, 1 second timeout)
            let echo = "";
            while (echo.length < 18) {
                // read data, wait 1 second per read
                const data = await this.read(reader, 1000);
                // append
                echo += decoder.decode(data);
            }
            // compare echo
            if (echo !== commandString)
                return Promise.reject(new Error(`uTracer echo validation failed. Expected: ${commandString}, Received: ${echo}`));
        }
        finally {
            // release locks
            reader.releaseLock();
            writer.releaseLock();
        }
    }

    private async sendCommandWithResponse(command: Uint8Array): Promise<UTracerResponse> {
        // ensure connected
        if (!this.isConnected())
            return Promise.reject(new Error('Serial port is not connected'));
        // validate command length
        if (command.length !== 9)
            return Promise.reject(new Error(`uTracer command must be 9 bytes long. Received: ${command.length} bytes.`));
        // reader and writer
        const reader = this.port!.readable?.getReader();
        const writer = this.port!.writable?.getWriter();
        // validate streams
        if (!reader || !writer)
            return Promise.reject(new Error('Serial port streams are not available'));

        try {
            // command bytes
            const commandString = Array.from(command)
                .map(b => b.toString(16).padStart(2, '0').toUpperCase())
                .join('');
            // log command
            console.log(`uTracer => ${commandString}`);
            // send command
            await writer.write(encoder.encode(commandString));
            // expected response (9 bytes from echo + 19 bytes from response)
            const bytes = new Uint8Array(56);
            let bytesRead = 0;
            while (bytesRead < 56) {
                // read data, wait 1 second per read
                const data = await this.read(reader, 1000);
                // append data
                bytes.set(data, bytesRead);
                bytesRead += data.length;
            }
            // echo
            const echo = decoder.decode(bytes);
            // compare echo (first 9 bytes)
            if (echo.substring(0, 18) !== commandString)
                return Promise.reject(new Error(`uTracer echo validation failed. Expected: ${commandString}, Received: ${echo}`));
            // data
            const data = echo.substring(18);
            // log data
            console.log(`uTracer <= ${data}`);
            // response
            const response = data.match(/.{1,2}/g)?.map(byteStr => parseInt(byteStr, 16)) ?? [];
            // validate response length
            if (response.length !== 19)
                return Promise.reject(new Error(`uTracer response length invalid. Expected: 19 bytes, Received: ${response.length} bytes.`));
            // calculate
            const powerSupplyVoltage = this.readPowerSupplyVoltage(this.bytesTo10BitValue(response[13], response[14]));
            // parse response
            const uTracerResponse: UTracerResponse = {
                status: response[0],
                plateCurrentAfterPGA: this.readPlateAndScreenVoltage(this.bytesTo10BitValue(response[1], response[2]), powerSupplyVoltage, 1),
                plateCurrentBeforePGA: this.readPlateAndScreenVoltage(this.bytesTo10BitValue(response[3], response[4]), powerSupplyVoltage, 1),
                screenCurrentAfterPGA: this.bytesTo10BitValue(response[5], response[6]),
                screenCurrentBeforePGA: this.bytesTo10BitValue(response[7], response[8]),
                plateVoltage: this.readPlateAndScreenVoltage(this.bytesTo10BitValue(response[9], response[10]), powerSupplyVoltage, this.plateVoltageGain),
                screenVoltage: this.readPlateAndScreenVoltage(this.bytesTo10BitValue(response[11], response[12]), powerSupplyVoltage, this.screenVoltageGain),
                powerSupplyVoltage: powerSupplyVoltage * this.powerSupplyVoltageFactor,
                negativeVoltage: this.bytesTo10BitValue(response[15], response[16]),
                platePGAGain: response[17],
                screenPGAGain: response[18],
            };
            // log response
            console.log('uTracer <= ', uTracerResponse);
            // exit
            return uTracerResponse;
        }
        finally {
            // release locks
            reader.releaseLock();
            writer.releaseLock();
        }
    }

    /**
     * Convert 10-bit ADC value to high voltage using uTracer voltage divider formula
     * The buffer capacitor voltage is measured via resistive divider ([0, 350V] mapped to [0, 5V])
     * Note: Cathode is referenced to 18.5V power supply, so actual tube voltage = Vhv - 18.5V
     *
     * @param rawValue 10-bit ADC value (0-1023)
     * @returns High voltage in volts
     */
    private readPlateAndScreenVoltage(rawValue: number, powerSupplyVoltage: number, gain: number): number {
        return rawValue * 350 / (1023 * gain) - powerSupplyVoltage;
    }

    /**
     * Convert 10-bit ADC value to power supply voltage using uTracer voltage divider formula
     * Power supply voltage [0, 23.9V] is mapped to ADC input range [0, 5V] via resistive divider
     *
     * @param rawValue 10-bit ADC value [0, 1023]
     * @returns Power supply voltage in volts
     */
    private readPowerSupplyVoltage(rawValue: number): number {
        return rawValue * 23.9 / 1023;
    }
}
