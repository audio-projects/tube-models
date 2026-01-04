import { inject, Injectable } from '@angular/core';
import type { SerialPort } from './serial.types';
import { SettingsService } from './settings.service';

export interface AdcData {
    status: number;
    plateCurrentBytes: number[];
    plateCurrent: number;
    plateCurrentRawBytes: number[];
    plateCurrentRaw: number;
    screenCurrentBytes: number[];
    screenCurrent: number;
    screenCurrentRawBytes: number[];
    screenCurrentRaw: number;
    plateVoltageBytes: number[];
    plateVoltage: number;
    screenVoltageBytes: number[];
    screenVoltage: number;
    powerSupplyVoltageBytes: number[];
    powerSupplyVoltage: number;
    negativeVoltageBytes: number[];
    negativeVoltage: number;
    plateCurrentGain: number;
    screenCurrentGain: number;
}

export type Compliance = 200 | 175 | 150 | 125 | 100 | 75 | 50 | 25 | 0;

export type Averaging = 0 | 2 | 4 | 8 | 16 | 32 | 0x40;

export type CurrentGain = 0x00 | 0x01 | 0x02 | 0x03 | 0x04 | 0x05 | 0x06 | 0x07 | 0x08;

const encoder = new TextEncoder();
const decoder = new TextDecoder();

// high voltage
const maximumHighVoltageV3 = 300;
const maximumHighVoltageV3p = 400;

// negative voltage
const maximumNegativeVoltageV3 = -50;

// resistor values
const currentSensingResistorV3 = 18.0; // R45 & R20 for v3
const currentLimitingResistorV3 = 2.7; // R38 & R24 for v3

// scales based on the uTracer hardware design (resistors)
const plateCurrentScale = 1000.0 * 5.0 / 1023.0 / currentSensingResistorV3;
const screenCurrentScale = 1000.0 * 5.0 / 1023.0 / currentSensingResistorV3;

const powerSupplyVoltageDividerV3 = 1.8 / (6.8 + 1.8);

// resistor voltage dividers in uTracer
export const plateVoltageDividerV3 = 6.8 / (470.0 + 6.8); // R32/R33
export const plateVoltageDividerV3p = 5.23 / (470.0 + 5.23); // R32/R33
export const screenVoltageDividerV3 = 6.8 / (470.0 + 6.8); // R18/R19
export const screenVoltageDividerV3p = 5.23 / (470.0 + 5.23); // R18/R19
export const negativeVoltageDividerV3 = 2.0 / (47.0 + 2.0); // R3/R4

const diodeDropVoltage = 0.7; // drop voltage acreoss D11
const darlingtonDropVoltage = 0.5; // drop voltage across MJE350

const adcGainLookup: number[] = [1, 2, 5, 10, 20, 50, 100, 200];
const autoAverageLookup: number[] = [1, 1, 1, 1, 2, 2, 4, 8];

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

    // hardware version & maximum defaults
    private _hardwareVersion: string = this.settingsService.get<string>('utracer.version') ?? '3';
    private _maximumHighVoltage: number = this.settingsService.get<number>('utracer.calibration.maximumHighVoltage') ?? maximumHighVoltageV3;
    private _maximumNegativeVoltage: number = this.settingsService.get<number>('utracer.calibration.maximumNegativeVoltage') ?? maximumNegativeVoltageV3;

    // calibration related fields
    private _plateVoltageGain = this.settingsService.get<number>('utracer.calibration.plateVoltageGain') ?? 1.0;
    private _screenVoltageGain = this.settingsService.get<number>('utracer.calibration.screenVoltageGain') ?? 1.0;
    private _plateCurrentGain = this.settingsService.get<number>('utracer.calibration.plateCurrentGain') ?? 1.0;
    private _screenCurrentGain = this.settingsService.get<number>('utracer.calibration.screenCurrentGain') ?? 1.0;
    private _powerSupplyVoltageGain = this.settingsService.get<number>('utracer.calibration.powerSupplyVoltageGain') ?? 1.0;
    private _negativeVoltageGain = this.settingsService.get<number>('utracer.calibration.negativeVoltageGain') ?? 1.0;
    private _grid1VoltVoltageGain = this.settingsService.get<number>('utracer.calibration.grid1VoltVoltageGain') ?? 1.0;
    private _grid4VoltVoltageGain = this.settingsService.get<number>('utracer.calibration.grid4VoltVoltageGain') ?? 1.0;
    private _grid40VoltVoltageGain = this.settingsService.get<number>('utracer.calibration.grid40VoltVoltageGain') ?? 1.0;

    // hardware fields
    private _powerSupplyVoltageDivider: number = this.settingsService.get<number>('utracer.calibration.powerSupplyVoltageDivider') ?? powerSupplyVoltageDividerV3;
    private _currentSensingResistor: number = this.settingsService.get<number>('utracer.calibration.currentSensingResistor') ?? currentSensingResistorV3;
    private _currentLimitingResistor: number = this.settingsService.get<number>('utracer.calibration.currentLimitingResistor') ?? currentLimitingResistorV3;
    private _plateVoltageDivider: number = this.settingsService.get<number>('utracer.calibration.plateVoltageDivider') ?? plateVoltageDividerV3;
    private _screenVoltageDivider: number = this.settingsService.get<number>('utracer.calibration.screenVoltageDivider') ?? screenVoltageDividerV3;
    private _negativeVoltageDivider: number = this.settingsService.get<number>('utracer.calibration.negativeVoltageDivider') ?? negativeVoltageDividerV3;

    /**
     * Get the uTracer hardware version ('3' or '3p')
     * @returns Hardware version string
     */
    get hardwareVersion(): string {
        return this._hardwareVersion;
    }

    /**
     * Set the uTracer hardware version and update dependent calibration values
     * Updates maximum high voltage and voltage dividers based on version
     * @param value Hardware version ('3' for v3, '3p' for v3+)
     */
    set hardwareVersion(value: string) {
        // set and persist value
        this._hardwareVersion = value;
        this.settingsService.set('utracer.version', value);
        // update dependent values
        this.maximumHighVoltage = (value === '3') ? maximumHighVoltageV3 : maximumHighVoltageV3p;
        this.plateVoltageDivider = (value === '3') ? plateVoltageDividerV3 : plateVoltageDividerV3p;
        this.screenVoltageDivider = (value === '3') ? screenVoltageDividerV3 : screenVoltageDividerV3p;
    }

    /**
     * Get the maximum high voltage the uTracer can safely output
     * @returns Maximum high voltage in volts (300V for v3, 400V for v3+)
     */
    get maximumHighVoltage(): number {
        return this._maximumHighVoltage;
    }

    /**
     * Set the maximum high voltage limit and persist to settings
     * @param value Maximum high voltage in volts
     */
    set maximumHighVoltage(value: number) {
        // set and persist value
        this._maximumHighVoltage = value;
        this.settingsService.set('utracer.calibration.maximumHighVoltage', value);
    }

    /**
     * Get the maximum negative voltage the uTracer can output
     * @returns Maximum negative voltage in volts (typically -50V)
     */
    get maximumNegativeVoltage(): number {
        return this._maximumNegativeVoltage;
    }

    /**
     * Set the maximum negative voltage limit and persist to settings
     * @param value Maximum negative voltage in volts
     */
    set maximumNegativeVoltage(value: number) {
        // set and persist value
        this._maximumNegativeVoltage = value;
        this.settingsService.set('utracer.calibration.maximumNegativeVoltage', value);
    }

    /**
     * Get the calibration gain factor for plate voltage measurements
     * @returns Plate voltage gain multiplier (default: 1.0)
     */
    get plateVoltageGain(): number {
        return this._plateVoltageGain;
    }

    /**
     * Set the plate voltage calibration gain and persist to settings
     * @param value Plate voltage gain multiplier
     */
    set plateVoltageGain(value: number) {
        // set and persist value
        this._plateVoltageGain = value;
        this.settingsService.set('utracer.calibration.plateVoltageGain', value);
    }

    /**
     * Get the calibration gain factor for screen voltage measurements
     * @returns Screen voltage gain multiplier (default: 1.0)
     */
    get screenVoltageGain(): number {
        return this._screenVoltageGain;
    }

    /**
     * Set the screen voltage calibration gain and persist to settings
     * @param value Screen voltage gain multiplier
     */
    set screenVoltageGain(value: number) {
        // set and persist value
        this._screenVoltageGain = value;
        this.settingsService.set('utracer.calibration.screenVoltageGain', value);
    }

    /**
     * Get the calibration gain factor for plate current measurements
     * @returns Plate current gain multiplier (default: 1.0)
     */
    get plateCurrentGain(): number {
        return this._plateCurrentGain;
    }

    /**
     * Set the plate current calibration gain and persist to settings
     * @param value Plate current gain multiplier
     */
    set plateCurrentGain(value: number) {
        // set and persist value
        this._plateCurrentGain = value;
        this.settingsService.set('utracer.calibration.plateCurrentGain', value);
    }

    /**
     * Get the calibration gain factor for screen current measurements
     * @returns Screen current gain multiplier (default: 1.0)
     */
    get screenCurrentGain(): number {
        return this._screenCurrentGain;
    }

    /**
     * Set the screen current calibration gain and persist to settings
     * @param value Screen current gain multiplier
     */
    set screenCurrentGain(value: number) {
        // set and persist value
        this._screenCurrentGain = value;
        this.settingsService.set('utracer.calibration.screenCurrentGain', value);
    }

    /**
     * Get the calibration gain factor for power supply voltage measurements
     * @returns Power supply voltage gain multiplier (default: 1.0)
     */
    get powerSupplyVoltageGain(): number {
        return this._powerSupplyVoltageGain;
    }

    /**
     * Set the power supply voltage calibration gain and persist to settings
     * @param value Power supply voltage gain multiplier
     */
    set powerSupplyVoltageGain(value: number) {
        // set and persist value
        this._powerSupplyVoltageGain = value;
        this.settingsService.set('utracer.calibration.powerSupplyVoltageGain', value);
    }

    /**
     * Get the calibration gain factor for negative voltage measurements
     * @returns Negative voltage gain multiplier (default: 1.0)
     */
    get negativeVoltageGain(): number {
        return this._negativeVoltageGain;
    }

    /**
     * Set the negative voltage calibration gain and persist to settings
     * @param value Negative voltage gain multiplier
     */
    set negativeVoltageGain(value: number) {
        // set and persist value
        this._negativeVoltageGain = value;
        this.settingsService.set('utracer.calibration.negativeVoltageGain', value);
    }

    /**
     * Get the calibration gain for grid voltage in the -1V to 0V range
     * @returns Grid 1 volt voltage gain multiplier (default: 1.0)
     */
    get grid1VoltVoltageGain(): number {
        return this._grid1VoltVoltageGain;
    }

    /**
     * Set the grid voltage calibration gain for -1V to 0V range and persist to settings
     * @param value Grid 1 volt voltage gain multiplier
     */
    set grid1VoltVoltageGain(value: number) {
        // set and persist value
        this._grid1VoltVoltageGain = value;
        this.settingsService.set('utracer.calibration.grid1VoltVoltageGain', value);
    }

    /**
     * Get the calibration gain for grid voltage in the -4V to -1V range
     * @returns Grid 4 volt voltage gain multiplier (default: 1.0)
     */
    get grid4VoltVoltageGain(): number {
        return this._grid4VoltVoltageGain;
    }

    /**
     * Set the grid voltage calibration gain for -4V to -1V range and persist to settings
     * @param value Grid 4 volt voltage gain multiplier
     */
    set grid4VoltVoltageGain(value: number) {
        // set and persist value
        this._grid4VoltVoltageGain = value;
        this.settingsService.set('utracer.calibration.grid4VoltVoltageGain', value);
    }

    /**
     * Get the calibration gain for grid voltage in the -40V to -4V range
     * @returns Grid 40 volt voltage gain multiplier (default: 1.0)
     */
    get grid40VoltVoltageGain(): number {
        return this._grid40VoltVoltageGain;
    }

    /**
     * Set the grid voltage calibration gain for -40V to -4V range and persist to settings
     * @param value Grid 40 volt voltage gain multiplier
     */
    set grid40VoltVoltageGain(value: number) {
        // set and persist value
        this._grid40VoltVoltageGain = value;
        this.settingsService.set('utracer.calibration.grid40VoltVoltageGain', value);
    }

    /**
     * Get the hardware voltage divider ratio for power supply measurements
     * @returns Power supply voltage divider ratio (default: 0.2091 for v3)
     */
    get powerSupplyVoltageDivider(): number {
        return this._powerSupplyVoltageDivider;
    }

    /**
     * Set the power supply voltage divider ratio and persist to settings
     * @param value Power supply voltage divider ratio
     */
    set powerSupplyVoltageDivider(value: number) {
        // set and persist value
        this._powerSupplyVoltageDivider = value;
        this.settingsService.set('utracer.calibration.powerSupplyVoltageDivider', value);
    }

    /**
     * Get the current sensing resistor value in ohms (R45 & R20 for v3)
     * @returns Current sensing resistor value in ohms (default: 18.0Ω)
     */
    get currentSensingResistor(): number {
        return this._currentSensingResistor;
    }

    /**
     * Set the current sensing resistor value and persist to settings
     * @param value Current sensing resistor value in ohms
     */
    set currentSensingResistor(value: number) {
        // set and persist value
        this._currentSensingResistor = value;
        this.settingsService.set('utracer.calibration.currentSensingResistor', value);
    }

    /**
     * Get the current limiting resistor value in ohms (R38 & R24 for v3)
     * @returns Current limiting resistor value in ohms (default: 2.7Ω)
     */
    get currentLimitingResistor(): number {
        return this._currentLimitingResistor;
    }

    /**
     * Set the current limiting resistor value and persist to settings
     * @param value Current limiting resistor value in ohms
     */
    set currentLimitingResistor(value: number) {
        // set and persist value
        this._currentLimitingResistor = value;
        this.settingsService.set('utracer.calibration.currentLimitingResistor', value);
    }

    /**
     * Get the hardware voltage divider ratio for plate voltage measurements (R32/R33)
     * @returns Plate voltage divider ratio (v3: 0.0143, v3+: 0.0110)
     */
    get plateVoltageDivider(): number {
        return this._plateVoltageDivider;
    }

    /**
     * Set the plate voltage divider ratio and persist to settings
     * @param value Plate voltage divider ratio
     */
    set plateVoltageDivider(value: number) {
        // set and persist value
        this._plateVoltageDivider = value;
        this.settingsService.set('utracer.calibration.plateVoltageDivider', value);
    }

    /**
     * Get the hardware voltage divider ratio for screen voltage measurements (R18/R19)
     * @returns Screen voltage divider ratio (v3: 0.0143, v3+: 0.0110)
     */
    get screenVoltageDivider(): number {
        return this._screenVoltageDivider;
    }

    /**
     * Set the screen voltage divider ratio and persist to settings
     * @param value Screen voltage divider ratio
     */
    set screenVoltageDivider(value: number) {
        // set and persist value
        this._screenVoltageDivider = value;
        this.settingsService.set('utracer.calibration.screenVoltageDivider', value);
    }

    /**
     * Get the hardware voltage divider ratio for negative voltage measurements (R3/R4)
     * @returns Negative voltage divider ratio (default: 0.0408)
     */
    get negativeVoltageDivider(): number {
        return this._negativeVoltageDivider;
    }

    /**
     * Set the negative voltage divider ratio and persist to settings
     * @param value Negative voltage divider ratio
     */
    set negativeVoltageDivider(value: number) {
        // set and persist value
        this._negativeVoltageDivider = value;
        this.settingsService.set('utracer.calibration.negativeVoltageDivider', value);
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
            // reset value
            this.port = null;
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
    async ping(): Promise<AdcData> {
        // 50 0000 0000 0000 0000
        const command = new Uint8Array([0x50, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]);
        // send command
        return await this.sendCommandWithResponse(command, 1000);
    }

    /**
     * Calculate the 10-bit ADC bytes needed to set the plate voltage on the uTracer
     * Converts target voltage to DAC setting, accounting for static hardware drops (diode, darlington)
     * but not current-dependent resistive drops (measured values will differ under load)
     *
     * @param powerSupplyVoltage Current measured power supply voltage (Vin)
     * @param plateVoltage Target plate (anode) voltage relative to cathode
     * @returns Array with [high byte, low byte] representing the 10-bit ADC value
     */
    calculatePlateBytes(powerSupplyVoltage: number, plateVoltage: number): [number, number] {
        // prevent negative voltages
        if (plateVoltage < 0)
            plateVoltage = 0;
        // int value [0...1023]
        const value = Math.min(Math.floor((plateVoltage + powerSupplyVoltage - diodeDropVoltage + darlingtonDropVoltage) *  (1023 * this.plateVoltageDivider) / (this.plateVoltageGain * 5)), 1023);
        // bytes`
        return this.valueTo10BitBytes(value);
    }

    /**
     * Calculate the 10-bit ADC bytes needed to set the screen voltage on the uTracer
     * Converts target voltage to DAC setting, accounting for static hardware drops (diode, darlington)
     * but not current-dependent resistive drops (measured values will differ under load)
     *
     * @param powerSupplyVoltage Current measured power supply voltage (Vin)
     * @param screenVoltage Target screen grid voltage relative to cathode
     * @returns Array with [high byte, low byte] representing the 10-bit ADC value
     */
    calculateScreenBytes(powerSupplyVoltage: number, screenVoltage: number): [number, number] {
        // prevent negative voltages
        if (screenVoltage < 0)
            screenVoltage = 0;
        // int value [0...1023]
        const value = Math.min(Math.floor((screenVoltage + powerSupplyVoltage - diodeDropVoltage + darlingtonDropVoltage) *  (1023 * this.screenVoltageDivider) / (this.screenVoltageGain * 5)), 1023);
        // bytes
        return this.valueTo10BitBytes(value);
    }

    /**
     * Calculate the 10-bit ADC bytes needed to set the grid voltage on the uTracer
     * Uses piecewise linear interpolation for three voltage ranges:
     * - 0V to -1V: Linear scaling
     * - -1V to -4V: Linear interpolation between calibration points
     * - -4V to -40V: Linear interpolation between calibration points
     *
     * @param negativeSupplyVoltage Current measured negative supply voltage from boost converter
     * @param gridVoltage Target control grid voltage (negative values only)
     * @returns Array with [high byte, low byte] representing the 10-bit ADC value
     */
    calculateGridBytes(negativeSupplyVoltage: number, gridVoltage: number): [number, number] {
        // only negative values allowed
        if (gridVoltage >= 0)
            return [0, 0];
        // prevent division by zero
        if (negativeSupplyVoltage === 0)
            return [0, 0];
        // -1 < V < 0, linear interpolation between 0V and -1V
        if (gridVoltage > -1) {
            // scaled bytes
            return this.valueTo10BitBytes(Math.min(Math.floor(1023 * Math.abs(gridVoltage / negativeSupplyVoltage) * this.grid1VoltVoltageGain), 1023));
        }
        // -4 < V <= -1, linear interpolation between -1V and -4V
        if (gridVoltage > -4) {
            // line between points
            const v0 = 1023 * Math.abs(-1 / negativeSupplyVoltage) * this.grid1VoltVoltageGain;
            const v1 = 1023 * Math.abs(-4 / negativeSupplyVoltage) * this.grid4VoltVoltageGain;
            // scaled bytes
            return this.valueTo10BitBytes(Math.min(Math.floor((v1 - v0) * (Math.abs(gridVoltage) - 1) / (4 - 1) + v0), 1023));
        }
        // -40 < V <= -4, linear interpolation between -4V and -40V
        const v0 = 1023 * Math.abs(-4 / negativeSupplyVoltage) * this.grid4VoltVoltageGain;
        const v1 = 1023 * Math.abs(-40 / negativeSupplyVoltage) * this.grid40VoltVoltageGain;
        // scaled bytes
        return this.valueTo10BitBytes(Math.min(Math.floor((v1 - v0) * (Math.abs(gridVoltage) - 4) / (40 - 4) + v0), 1023));
    }

    /**
     * Calculate the 10-bit PWM bytes needed to set the heater voltage on the uTracer
     * Uses quadratic relationship: PWM = 1023 * (heaterVoltage / powerSupplyVoltage)²
     *
     * @param powerSupplyVoltage Current measured power supply voltage
     * @param heaterVoltage Target heater voltage
     * @returns Array with [high byte, low byte] representing the 10-bit PWM value
     */
    calculateHeaterBytes(powerSupplyVoltage: number, heaterVoltage: number): [number, number] {
        // prevent division by zero
        if (powerSupplyVoltage == 0)
            return [0, 0];
        // calculate 10-bit PWM value: n = 1023 * (voltage / powerSupply)^2
        const ratio = heaterVoltage / powerSupplyVoltage;
        // n
        const n = Math.min(Math.floor(1023 * ratio * ratio), 1023);
        // bytes
        return this.valueTo10BitBytes(n);
    }

    /**
     * Set the heater voltage on the uTracer
     * Command: 40 0000 0000 0000 (heater voltage in last 2 bytes)
     *
     * @param powerSupplyVoltage Current measured power supply voltage (used for PWM calculation)
     * @param voltage Target heater voltage to set
     * @returns Promise that resolves when voltage is set
     * @throws Error if not connected or command fails
     */
    async setHeaterVoltage(powerSupplyVoltage: number, voltage: number): Promise<void> {
        // build command: 40 0000 0000 0000 (heater voltage in last 2 bytes)
        const command = new Uint8Array([0x40, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00].concat(this.calculateHeaterBytes(powerSupplyVoltage, voltage)));
        // send command with echo validation
        await this.sendCommand(command);
    }

    /**
     * Start a measurement sequence with the uTracer
     * Command: 00 0000 0000 (compliance, 1 byte) (averaging, 1 byte) (screen gain, 1 byte) (plate gain, 1 byte)
     *
     * @param compliance Maximum allowed current (compliance limit)
     * @param averaging Averaging mode: 0x40 for auto (default), 0 for 1x, or manual count (2, 4, 8, 16, 32)
     * @param plateGain Plate (anode) current gain setting [0x00-0x08]
     * @param screenGain Screen grid current gain setting [0x00-0x08]
     * @returns Promise that resolves when measurement sequence is started
     * @throws Error if not connected or command fails
     */
    async start(compliance: Compliance = 0, averaging: Averaging = 0x40, plateGain: CurrentGain = 0x08, screenGain: CurrentGain = 0x08): Promise<void> {
        // 00 0000 0000 (compliance, 1 byte) (averaging, 1 byte) (screen gain, 1 byte) (plate gain, 1 byte)
        const command = new Uint8Array([0x00, 0x00, 0x00, 0x00, 0x00, compliance & 0xFF, averaging & 0xFF, screenGain & 0xFF, plateGain & 0xFF]);
        // send command with echo validation
        await this.sendCommand(command);
    }

    /**
     * Set all the voltages on the uTracer to the given values and hold
     * Command: 20 (plate voltage, 2 bytes) (screen voltage, 2 bytes) (grid voltage, 2 bytes) (heater voltage, 2 bytes)
     *
     * @param powerSupplyVoltage Current measured power supply voltage (used for voltage calculations)
     * @param negativeSupplyVoltage Current measured negative supply voltage from boost converter
     * @param plateVoltage Target plate (anode) voltage relative to cathode
     * @param screenVoltage Target screen grid voltage relative to cathode
     * @param gridVoltage Target control grid voltage
     * @param heaterVoltage Target heater voltage
     * @returns Promise that resolves when voltages are set
     * @throws Error if not connected or command fails
     */
    async set(powerSupplyVoltage: number, negativeSupplyVoltage: number, plateVoltage: number, screenVoltage: number, gridVoltage: number, heaterVoltage: number): Promise<void> {
        // build command: 20 (plate voltage) (screen voltage) (grid voltage) (heater voltage)
        const command = new Uint8Array([0x20].concat(...this.calculatePlateBytes(powerSupplyVoltage, plateVoltage), ...this.calculateScreenBytes(powerSupplyVoltage, screenVoltage),  ...this.calculateGridBytes(negativeSupplyVoltage, gridVoltage), ...this.calculateHeaterBytes(powerSupplyVoltage, heaterVoltage)));
        // send command with echo validation
        await this.sendCommand(command);
    }

    /**
     * Perform a measurement on the uTracer at the specified voltages
     * Command: 10 (plate voltage, 2 bytes) (screen voltage, 2 bytes) (grid voltage, 2 bytes) (heater voltage, 2 bytes)
     *
     * @param powerSupplyVoltage Current measured power supply voltage (used for voltage calculations)
     * @param negativeSupplyVoltage Current measured negative supply voltage from boost converter
     * @param plateVoltage Target plate (anode) voltage relative to cathode
     * @param screenVoltage Target screen grid voltage relative to cathode
     * @param gridVoltage Target control grid voltage
     * @param heaterVoltage Target heater voltage
     * @returns Promise that resolves with the ADC measurement data when complete
     * @throws Error if not connected or command fails
     */
    async measure(powerSupplyVoltage: number, negativeSupplyVoltage: number, plateVoltage: number, screenVoltage: number, gridVoltage: number, heaterVoltage: number): Promise<AdcData> {
        // build command: 10 (plate voltage) (screen voltage) (grid voltage) (heater voltage)
        const command = new Uint8Array([0x10].concat(...this.calculatePlateBytes(powerSupplyVoltage, plateVoltage), ...this.calculateScreenBytes(powerSupplyVoltage, screenVoltage),  ...this.calculateGridBytes(negativeSupplyVoltage, gridVoltage), ...this.calculateHeaterBytes(powerSupplyVoltage, heaterVoltage)));
        // send command
        return await this.sendCommandWithResponse(command, 10000);
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

    /**
     * Read data from the serial port with a timeout
     * @param reader The readable stream reader for the serial port
     * @param timeout Timeout in milliseconds
     * @returns Promise that resolves with the data read from the port
     * @throws Error if timeout occurs or stream is closed
     * @private
     */
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
            // check stream closed
            if (done)
                return Promise.reject(new Error('Serial port stream closed'));
            // return data
            return value || new Uint8Array([]);
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

    /**
     * Send a command to the uTracer and validate echo response
     * Sends each byte as two hexadecimal ASCII characters and validates the echo
     *
     * @param command 9-byte command array to send to uTracer
     * @returns Promise that resolves when command is sent and validated
     * @throws Error if not connected, invalid command length, or echo validation fails
     * @private
     */
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
            // command string
            let commandString = '';
            // loop bytes
            for (const byte of command) {
                // hex value
                const hex = byte.toString(16).padStart(2, '0').toUpperCase();
                // update command string
                commandString += hex;
                // encoded chars
                const encoded = encoder.encode(hex);
                // echo
                let echo = '';
                // loop encoded bytes
                for (const byte of encoded) {
                    // write byte to serial port
                    await writer.write(new Uint8Array([byte]));
                    // read echo char
                    echo += decoder.decode(await this.read(reader, 1000));
                }
                // compare echo
                if (echo !== hex) {
                    // log command failure
                    console.log(`uTracer => ${commandString} (failed at byte ${hex})`);
                    // error
                    return Promise.reject(new Error(`uTracer echo validation failed. Expected: ${hex}, Received: ${echo}`));
                }
            }
            // log command
            console.log(`uTracer => ${commandString}`);
        }
        finally {
            // release locks
            reader.releaseLock();
            writer.releaseLock();
        }
    }

    /**
     * Send a command to the uTracer, validate echo, and read ADC response data
     * Sends command, validates echo, then reads 19 bytes of ADC measurement data
     *
     * @param command 9-byte command array to send to uTracer
     * @param timeout Timeout in milliseconds for reading response (default: 1000ms)
     * @returns Promise that resolves with parsed ADC measurement data
     * @throws Error if not connected, invalid command/response, or timeout occurs
     * @private
     */
    private async sendCommandWithResponse(command: Uint8Array, timeout = 1000): Promise<AdcData> {
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
            // command string
            let commandString = '';
            // command response (echo + data)
            let commandResponse = '';
            let commandResponsePointer = 0;
            // loop bytes
            for (const byte of command) {
                // hex value
                const hex = byte.toString(16).padStart(2, '0').toUpperCase();
                // update command string
                commandString += hex;
                // encoded chars (bytes)
                const encoded = encoder.encode(hex);
                // loop encoded bytes
                for (const byte of encoded) {
                    // write byte to serial port
                    await writer.write(new Uint8Array([byte]));
                    // read echo char
                    commandResponse += decoder.decode(await this.read(reader, timeout));
                }
                // compare echo
                if (commandResponse.substring(commandResponsePointer, commandResponsePointer + 2) !== hex) {
                    // log command failure
                    console.log(`uTracer => ${commandString} (failed at byte ${hex})`);
                    // error
                    return Promise.reject(new Error(`uTracer echo validation failed. Expected: ${hex}, Received: ${commandResponse.substring(commandResponsePointer, commandResponsePointer + 2)}`));
                }
                // advance pointer
                commandResponsePointer += 2;
            }
            // log command
            console.log(`uTracer => ${commandString}`);
            // remove echo from response
            commandResponse = commandResponse.substring(commandResponsePointer);
            // read data
            while (commandResponse.length < 38) {
                // read data, wait timeout milliseconds per read
                const data = await this.read(reader, timeout);
                // append data
                commandResponse += decoder.decode(data);
            }
            // log data
            console.log(`uTracer <= ${commandResponse}`);
            // response
            const response = commandResponse.match(/.{1,2}/g)?.map(byteStr => parseInt(byteStr, 16)) ?? [];
            // validate response length
            if (response.length !== 19)
                return Promise.reject(new Error(`uTracer response length invalid. Expected: 19 bytes, Received: ${response.length} bytes.`));
            // ADC data
            const adcData: AdcData = {
                status: response[0],
                plateCurrentBytes: [response[1], response[2]],
                plateCurrent: this.bytesTo10BitValue(response[1], response[2]),
                plateCurrentRawBytes: [response[3], response[4]],
                plateCurrentRaw: this.bytesTo10BitValue(response[3], response[4]),
                screenCurrentBytes: [response[5], response[6]],
                screenCurrent: this.bytesTo10BitValue(response[5], response[6]),
                screenCurrentRawBytes: [response[7], response[8]],
                screenCurrentRaw: this.bytesTo10BitValue(response[7], response[8]),
                plateVoltageBytes: [response[9], response[10]],
                plateVoltage: this.bytesTo10BitValue(response[9], response[10]),
                screenVoltageBytes: [response[11], response[12]],
                screenVoltage: this.bytesTo10BitValue(response[11], response[12]),
                powerSupplyVoltageBytes: [response[13], response[14]],
                powerSupplyVoltage: this.bytesTo10BitValue(response[13], response[14]),
                negativeVoltageBytes: [response[15], response[16]],
                negativeVoltage: this.bytesTo10BitValue(response[15], response[16]),
                plateCurrentGain: response[17],
                screenCurrentGain: response[18],
            };
            // log response
            console.log('uTracer <= ', adcData);
            // exit
            return adcData;
        }
        finally {
            // release locks
            reader.releaseLock();
            writer.releaseLock();
        }
    }

    /**
     * Calculate the averaging factor based on the ADC gain setting and averaging mode
     * Supports both automatic averaging (based on gain) and manual averaging modes.
     *
     * @param adcCurrentGain The ADC gain setting index [0-7]
     * @param averaging Averaging mode: 0x40 for auto, 0x00 for 1x, or manual count (2, 4, 8, 16, 32)
     * @returns The computed averaging factor to apply to measurements
     */
    readAverage(adcCurrentGain: number, averaging: Averaging): number {
        // average
        return averaging === 0x40 ? autoAverageLookup[adcCurrentGain] : averaging == 0x00 ? 1 : averaging;
    }

    /**
     * Look up the analog gain multiplier for a given ADC gain setting
     * Maps hardware gain codes to their corresponding multiplication factors.
     *
     * @param adcCurrentGain The ADC gain setting index [0-7]
     * @returns The gain multiplier (1, 2, 5, 10, 20, 50, 100, or 200)
     */
    readGain(adcCurrentGain: number): number {
        // gain
        return adcCurrentGain < adcGainLookup.length ? adcGainLookup[adcCurrentGain] : adcGainLookup[adcGainLookup.length - 1];
    }

    /**
     * Convert raw 10-bit ADC plate current reading to milliamps (before PGA gain correction)
     * Uses the measured ADC counts, full-scale conversion factor, and averaging.
     *
     * @param adcData The raw ADC measurement data from the uTracer
     * @param averaging The averaging mode to compute averaging factor
     * @returns Plate current in milliamps (mA)
     */
    readPlateCurrentRaw(adcData: AdcData, averaging: Averaging): number {
        // zero
        if (adcData.plateCurrentRaw === 0)
            return 0;
        // average
        const average = this.readAverage(adcData.plateCurrentGain, averaging);
        // current in mA
        return adcData.plateCurrentRaw * plateCurrentScale  / average;
    }

    /**
     * Convert 10-bit ADC plate current reading to milliamps (after PGA gain correction)
     * Combines raw ADC counts, full-scale conversion, hardware PGA gain, calibration gain, and averaging.
     *
     * @param adcData The raw ADC measurement data from the uTracer
     * @param averaging The averaging mode to compute averaging factor
     * @returns Plate current in milliamps (mA) after all gain and averaging corrections
     */
    readPlateCurrent(adcData: AdcData, averaging: Averaging): number {
        // zero
        if (adcData.plateCurrent === 0)
            return 0;
        // gain
        const gain = this.readGain(adcData.plateCurrentGain);
        // average
        const average = this.readAverage(adcData.plateCurrentGain, averaging);
        // current in mA
        return adcData.plateCurrent * plateCurrentScale / gain * this.plateCurrentGain / average;
    }

    /**
     * Convert raw 10-bit ADC screen current reading to milliamps (before PGA gain correction)
     * Uses the measured ADC counts, full-scale conversion factor, and averaging.
     *
     * @param adcData The raw ADC measurement data from the uTracer
     * @param averaging The averaging mode to compute averaging factor
     * @returns Screen current in milliamps (mA)
     */
    readScreenCurrentRaw(adcData: AdcData, averaging: Averaging): number {
        // zero
        if (adcData.screenCurrentRaw === 0)
            return 0;
        // average
        const average = this.readAverage(adcData.screenCurrentGain, averaging);
        // current in mA
        return adcData.screenCurrentRaw * screenCurrentScale  / average;
    }

    /**
     * Convert 10-bit ADC screen current reading to milliamps (after PGA gain correction)
     * Combines raw ADC counts, full-scale conversion, hardware PGA gain, calibration gain, and averaging.
     *
     * @param adcData The raw ADC measurement data from the uTracer
     * @param averaging The averaging mode to compute averaging factor
     * @returns Screen current in milliamps (mA) after all gain and averaging corrections
     */
    readScreenCurrent(adcData: AdcData, averaging: Averaging): number {
        // zero
        if (adcData.screenCurrent === 0)
            return 0;
        // gain
        const gain = this.readGain(adcData.screenCurrentGain);
        // average
        const average = this.readAverage(adcData.screenCurrentGain, averaging);
        // current in mA
        return adcData.screenCurrent * screenCurrentScale / gain * this.screenCurrentGain / average;
    }

    /**
     * Convert 10-bit ADC value to plate (anode) voltage using uTracer voltage divider formula
     * The plate voltage is measured via resistive divider and referenced to the cathode (power supply)
     * Combines calibration gain, divider correction, hardware voltage drops, and current-dependent resistive drops
     *
     * @param adcData The raw ADC measurement data from the uTracer
     * @param averaging The averaging mode for computing current corrections
     * @returns Plate voltage in volts relative to cathode
     */
    readPlateVoltage(adcData: AdcData, averaging: Averaging): number {
        // plate current
        const current = this.readPlateCurrentRaw(adcData, averaging);
        // voltage = (ADC voltage) - (power supply voltage) + (diode drop) - (darlington drop) - (current limiting drop) + (current sensing drop)
        return adcData.plateVoltage * this.plateVoltageGain * 5 / (1023 * this.plateVoltageDivider) - this.readPowerSupplyVoltage(adcData) + diodeDropVoltage - darlingtonDropVoltage - current * this.currentLimitingResistor / 1000 + current * this.currentSensingResistor / 1000;
    }

    /**
     * Convert 10-bit ADC value to screen (suppressor/control grid) voltage using uTracer voltage divider formula
     * The screen voltage is measured via resistive divider and referenced to the cathode (power supply)
     * Combines calibration gain, divider correction, hardware voltage drops, and current-dependent resistive drops
     *
     * @param adcData The raw ADC measurement data from the uTracer
     * @param averaging The averaging mode for computing current corrections
     * @returns Screen voltage in volts relative to cathode
     */
    readScreenVoltage(adcData: AdcData, averaging: Averaging): number {
        // screen current
        const current = this.readScreenCurrent(adcData, averaging);
        // voltage = (ADC voltage) - (power supply voltage) + (diode drop) - (darlington drop) - (current limiting drop) + (current sensing drop)
        return adcData.screenVoltage * this.screenVoltageGain * 5 / (1023 * this.screenVoltageDivider) - this.readPowerSupplyVoltage(adcData) + diodeDropVoltage - darlingtonDropVoltage - current * this.currentLimitingResistor / 1000 + current * this.currentSensingResistor / 1000;
    }

    /**
     * Convert 10-bit ADC value to power supply (rail) voltage using uTracer voltage divider formula
     * Power supply voltage [0, 23.9V] is mapped to ADC input range [0, 5V] via resistive divider
     * Applies calibration gain to correct for systematic errors in the divider and ADC path
     *
     * @param adcData The raw ADC measurement data from the uTracer
     * @returns Power supply voltage in volts
     */
    readPowerSupplyVoltage(adcData: AdcData): number {
        return adcData.powerSupplyVoltage * this.powerSupplyVoltageGain * 5 / (1023 * this.powerSupplyVoltageDivider);
    }

    /**
     * Convert 10-bit ADC value to negative (control grid) voltage
     * The negative boost converter supplies a fixed -40 V during firmware initialization
     * Applies calibration gain to correct for hardware variations
     *
     * @param adcData The raw ADC measurement data from the uTracer
     * @returns Negative voltage in volts (typically around -40 V)
     */
    readNegativeVoltage(adcData: AdcData): number {
        return (5 * (adcData.negativeVoltage / 1023 - 1) / this.negativeVoltageDivider + 5) * this.negativeVoltageGain;
    }
}
