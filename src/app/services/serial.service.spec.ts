import { TestBed } from '@angular/core/testing';
import { SerialService } from './serial.service';
import type { SerialPort } from './serial.types';

describe('SerialService', () => {
    let service: SerialService;
    let mockPort: jasmine.SpyObj<SerialPort>;
    let mockReader: jasmine.SpyObj<ReadableStreamDefaultReader<Uint8Array>>;
    let mockWriter: jasmine.SpyObj<WritableStreamDefaultWriter<Uint8Array>>;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [SerialService]
        });
        service = TestBed.inject(SerialService);

        // Create mock objects
        mockReader = jasmine.createSpyObj('ReadableStreamDefaultReader', ['read', 'cancel']);
        mockWriter = jasmine.createSpyObj('WritableStreamDefaultWriter', ['write', 'close']);
        mockPort = jasmine.createSpyObj('SerialPort', ['open', 'close', 'getInfo'], {
            readable: {
                getReader: () => mockReader,
                cancel: jasmine.createSpy('cancel').and.returnValue(Promise.resolve())
            } as unknown as ReadableStream<Uint8Array>,
            writable: {
                getWriter: () => mockWriter,
                close: jasmine.createSpy('close').and.returnValue(Promise.resolve())
            } as unknown as WritableStream<Uint8Array>
        });
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    describe('isSupported', () => {
        it('should return true if Web Serial API is available', () => {
            // Web Serial API is available in test environment
            expect(service.isSupported()).toBe(true);
        });
    });

    describe('isConnected', () => {
        it('should return false when not connected', () => {
            expect(service.isConnected()).toBe(false);
        });
    });

    describe('connectToPort', () => {
        it('should connect to a provided port', async () => {
            mockPort.open.and.returnValue(Promise.resolve());

            await service.connectToPort(mockPort, { baudRate: 9600 });

            expect(service.isConnected()).toBe(true);
            expect(mockPort.open).toHaveBeenCalledWith({
                baudRate: 9600,
                dataBits: 8,
                stopBits: 1,
                parity: 'none',
                bufferSize: 255,
                flowControl: 'none'
            });
        });

        it('should throw error if already connected', async () => {
            mockPort.open.and.returnValue(Promise.resolve());
            await service.connectToPort(mockPort);

            await expectAsync(service.connectToPort(mockPort)).toBeRejectedWithError(
                'A serial port is already connected. Disconnect first.'
            );
        });
    });

    describe('write', () => {
        it('should throw error if not connected', async () => {
            await expectAsync(service.write('test')).toBeRejectedWithError(
                'Serial port is not connected'
            );
        });

        it('should write string data to the port', async () => {
            mockPort.open.and.returnValue(Promise.resolve());
            mockWriter.write.and.returnValue(Promise.resolve());

            await service.connectToPort(mockPort);
            await service.write('test');

            expect(mockWriter.write).toHaveBeenCalledWith(jasmine.any(Uint8Array));
        });

        it('should write Uint8Array data to the port', async () => {
            mockPort.open.and.returnValue(Promise.resolve());
            mockWriter.write.and.returnValue(Promise.resolve());

            await service.connectToPort(mockPort);
            const data = new Uint8Array([1, 2, 3]);
            await service.write(data);

            expect(mockWriter.write).toHaveBeenCalledWith(data);
        });
    });

    describe('writeCommand', () => {
        it('should throw error if not connected', async () => {
            await expectAsync(service.writeCommand('test')).toBeRejectedWithError(
                'Serial port is not connected'
            );
        });
    });

    describe('read', () => {
        it('should throw error if not connected', async () => {
            await expectAsync(service.read()).toBeRejectedWithError(
                'Serial port is not connected'
            );
        });

        it('should read data from the port', async () => {
            mockPort.open.and.returnValue(Promise.resolve());
            const testData = new Uint8Array([1, 2, 3]);
            mockReader.read.and.returnValue(Promise.resolve({ value: testData, done: false }));

            await service.connectToPort(mockPort);
            const data = await service.read();

            expect(data).toEqual(testData);
            expect(mockReader.read).toHaveBeenCalled();
        });
    });

    describe('readText', () => {
        it('should throw error if not connected', async () => {
            await expectAsync(service.readText()).toBeRejectedWithError(
                'Serial port is not connected'
            );
        });

        it('should read and decode text data', async () => {
            mockPort.open.and.returnValue(Promise.resolve());
            const testText = 'Hello';
            const testData = new TextEncoder().encode(testText);
            mockReader.read.and.returnValue(Promise.resolve({ value: testData, done: false }));

            await service.connectToPort(mockPort);
            const text = await service.readText();

            expect(text).toEqual(testText);
        });
    });

    describe('readUntil', () => {
        it('should throw error if not connected', async () => {
            await expectAsync(service.readUntil()).toBeRejectedWithError(
                'Serial port is not connected'
            );
        });
    });

    describe('startReading', () => {
        it('should throw error if not connected', async () => {
            await expectAsync(
                service.startReading(() => {
                    // Empty callback for testing
                })
            ).toBeRejectedWithError('Serial port is not connected');
        });
    });

    describe('disconnect', () => {
        it('should complete without error when not connected', async () => {
            await expectAsync(service.disconnect()).toBeResolved();
        });

        it('should properly disconnect from a connected port', async () => {
            mockPort.open.and.returnValue(Promise.resolve());
            mockPort.close.and.returnValue(Promise.resolve());
            mockReader.cancel.and.returnValue(Promise.resolve());
            mockWriter.close.and.returnValue(Promise.resolve());

            await service.connectToPort(mockPort);
            expect(service.isConnected()).toBe(true);

            await service.disconnect();

            expect(service.isConnected()).toBe(false);
            expect(mockReader.cancel).toHaveBeenCalled();
            expect(mockWriter.close).toHaveBeenCalled();
            expect(mockPort.close).toHaveBeenCalled();
        });
    });

    describe('getPortInfo', () => {
        it('should return null when not connected', () => {
            expect(service.getPortInfo()).toBeNull();
        });

        it('should return port info when connected', async () => {
            const mockInfo = { usbVendorId: 0x1234, usbProductId: 0x5678 };
            mockPort.open.and.returnValue(Promise.resolve());
            mockPort.getInfo.and.returnValue(mockInfo);

            await service.connectToPort(mockPort);
            const info = service.getPortInfo();

            expect(info).toEqual(mockInfo);
        });
    });

    describe('getPorts', () => {
        it('should return array of ports if supported', async () => {
            const mockPorts: SerialPort[] = [mockPort];
            spyOn(navigator.serial, 'getPorts').and.returnValue(Promise.resolve(mockPorts));

            const ports = await service.getPorts();
            expect(ports).toEqual(mockPorts);
        });
    });
});
