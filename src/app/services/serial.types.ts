/**
 * TypeScript type definitions for Web Serial API
 * Based on the Web Serial API specification
 */

export interface SerialPortInfo {
    usbVendorId?: number;
    usbProductId?: number;
}

export interface SerialOptions {
    baudRate: number;
    dataBits?: 7 | 8;
    stopBits?: 1 | 2;
    parity?: 'none' | 'even' | 'odd';
    bufferSize?: number;
    flowControl?: 'none' | 'hardware';
}

export interface SerialPort {
    readonly readable: ReadableStream<Uint8Array> | null;
    readonly writable: WritableStream<Uint8Array> | null;
    open(options: SerialOptions): Promise<void>;
    close(): Promise<void>;
    getInfo(): SerialPortInfo;
}

export interface Serial extends EventTarget {
    requestPort(options?: SerialPortRequestOptions): Promise<SerialPort>;
}

export interface SerialPortRequestOptions {
    filters?: SerialPortFilter[];
}

export interface SerialPortFilter {
    usbVendorId?: number;
    usbProductId?: number;
}

declare global {
    interface Navigator {
        serial: Serial;
    }
}
