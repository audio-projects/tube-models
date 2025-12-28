import { TestBed } from '@angular/core/testing';
import { UTracerService } from './utracer.service';
import type { SerialPort } from './serial.types';

describe('UTracerService', () => {

    let service: UTracerService;
    let mockPort: jasmine.SpyObj<SerialPort>;
    let mockReader: jasmine.SpyObj<ReadableStreamDefaultReader<Uint8Array>>;
    let mockWriter: jasmine.SpyObj<WritableStreamDefaultWriter<Uint8Array>>;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [UTracerService]
        });
        service = TestBed.inject(UTracerService);
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
    afterEach(async () => {
        if (service.isConnected()) {
            mockReader.cancel.and.returnValue(Promise.resolve());
            mockWriter.close.and.returnValue(Promise.resolve());
            mockPort.close.and.returnValue(Promise.resolve());
            await service.disconnect();
        }
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    describe('isSupported', () => {
        it('should return true if Web Serial API is available', () => {
            expect(service.isSupported()).toBe(true);
        });
    });

    describe('isConnected', () => {
        it('should return false when not connected', () => {
            expect(service.isConnected()).toBe(false);
        });

        it('should return true when connected', async () => {
            mockPort.open.and.returnValue(Promise.resolve());
            spyOn(navigator.serial, 'requestPort').and.returnValue(Promise.resolve(mockPort));
            await service.connect();
            expect(service.isConnected()).toBe(true);
        });

        it('should return false after disconnecting', async () => {
            mockPort.open.and.returnValue(Promise.resolve());
            mockPort.close.and.returnValue(Promise.resolve());
            mockReader.cancel.and.returnValue(Promise.resolve());
            mockWriter.close.and.returnValue(Promise.resolve());
            spyOn(navigator.serial, 'requestPort').and.returnValue(Promise.resolve(mockPort));
            await service.connect();
            expect(service.isConnected()).toBe(true);
            await service.disconnect();
        });
    });

    describe('connect', () => {
        it('should reject if Web Serial API is not supported', async () => {
            // arrange
            spyOn(service, 'isSupported').and.returnValue(false);
            // act + assert
            await expectAsync(service.connect()).toBeRejectedWithError('Web Serial API is not supported in this browser');
        });

        it('should reject if already connected', async () => {
            // arrange
            mockPort.open.and.returnValue(Promise.resolve());
            spyOn(navigator.serial, 'requestPort').and.returnValue(Promise.resolve(mockPort));
            await service.connect();
            // act + assert
            await expectAsync(service.connect()).toBeRejectedWithError('A serial port is already connected. Disconnect first.');
        });

        it('should request port from user', async () => {
            // arrange
            mockPort.open.and.returnValue(Promise.resolve());
            const requestSpy = spyOn(navigator.serial, 'requestPort').and.returnValue(Promise.resolve(mockPort));
            // act
            await service.connect();
            // assert
            expect(requestSpy).toHaveBeenCalled();
        });

        it('should open port with 9600 baud rate', async () => {
            // arrange
            mockPort.open.and.returnValue(Promise.resolve());
            spyOn(navigator.serial, 'requestPort').and.returnValue(Promise.resolve(mockPort));
            // act
            await service.connect();
            // assert
            expect(mockPort.open).toHaveBeenCalledWith(jasmine.objectContaining({ baudRate: 9600 }));
        });

        it('should open port with 8 data bits', async () => {
            // arrange
            mockPort.open.and.returnValue(Promise.resolve());
            spyOn(navigator.serial, 'requestPort').and.returnValue(Promise.resolve(mockPort));
            // act
            await service.connect();
            // assert
            expect(mockPort.open).toHaveBeenCalledWith(jasmine.objectContaining({ dataBits: 8 }));
        });

        it('should open port with 1 stop bit', async () => {
            // arrange
            mockPort.open.and.returnValue(Promise.resolve());
            spyOn(navigator.serial, 'requestPort').and.returnValue(Promise.resolve(mockPort));
            // act
            await service.connect();
            // assert
            expect(mockPort.open).toHaveBeenCalledWith(jasmine.objectContaining({ stopBits: 1 }));
        });

        it('should open port with no parity', async () => {
            // arrange
            mockPort.open.and.returnValue(Promise.resolve());
            spyOn(navigator.serial, 'requestPort').and.returnValue(Promise.resolve(mockPort));
            // act
            await service.connect();
            // assert
            expect(mockPort.open).toHaveBeenCalledWith(jasmine.objectContaining({ parity: 'none' }));
        });

        it('should open port with complete uTracer configuration (9600-8-N-1)', async () => {
            // arrange
            mockPort.open.and.returnValue(Promise.resolve());
            spyOn(navigator.serial, 'requestPort').and.returnValue(Promise.resolve(mockPort));
            // act
            await service.connect();
            // assert
            expect(mockPort.open).toHaveBeenCalledWith({baudRate: 9600, dataBits: 8, stopBits: 1, parity: 'none', bufferSize: 255, flowControl: 'none'});
        });

        it('should initialize reader from readable stream', async () => {
            // arrange
            mockPort.open.and.returnValue(Promise.resolve());
            spyOn(navigator.serial, 'requestPort').and.returnValue(Promise.resolve(mockPort));
            // act
            await service.connect();
            // assert
            expect(service.isConnected()).toBe(true);
        });

        it('should initialize writer from writable stream', async () => {
            // arrange
            mockPort.open.and.returnValue(Promise.resolve());
            spyOn(navigator.serial, 'requestPort').and.returnValue(Promise.resolve(mockPort));
            // act
            await service.connect();
            // assert
            expect(service.isConnected()).toBe(true);
        });

        it('should reject if port.open fails', async () => {
            // arrange
            const error = new Error('Open failed');
            mockPort.open.and.returnValue(Promise.reject(error));
            spyOn(navigator.serial, 'requestPort').and.returnValue(Promise.resolve(mockPort));
            // act + assert
            await expectAsync(service.connect()).toBeRejectedWithError(/Failed to connect to serial port/);
        });

        it('should cleanup port on connection failure', async () => {
            // arrange
            const error = new Error('Open failed');
            mockPort.open.and.returnValue(Promise.reject(error));
            spyOn(navigator.serial, 'requestPort').and.returnValue(Promise.resolve(mockPort));
            // act
            try {
                await service.connect();
            }
            catch {
                // Expected to fail
            }
            // assert
            expect(service.isConnected()).toBe(false);
        });
    });

    describe('disconnect', () => {
        it('should resolve without error when not connected', async () => {
            // act + assert
            await expectAsync(service.disconnect()).toBeResolved();
        });

        it('should cancel reader when connected', async () => {
            // arrange
            mockPort.open.and.returnValue(Promise.resolve());
            mockReader.cancel.and.returnValue(Promise.resolve());
            mockWriter.close.and.returnValue(Promise.resolve());
            mockPort.close.and.returnValue(Promise.resolve());
            spyOn(navigator.serial, 'requestPort').and.returnValue(Promise.resolve(mockPort));
            await service.connect();
            // act
            await service.disconnect();
            // assert
            expect(mockReader.cancel).toHaveBeenCalled();
        });

        it('should close writer when connected', async () => {
            // arrange
            mockPort.open.and.returnValue(Promise.resolve());
            mockReader.cancel.and.returnValue(Promise.resolve());
            mockWriter.close.and.returnValue(Promise.resolve());
            mockPort.close.and.returnValue(Promise.resolve());
            spyOn(navigator.serial, 'requestPort').and.returnValue(Promise.resolve(mockPort));
            await service.connect();
            // act
            await service.disconnect();
            // assert
            expect(mockWriter.close).toHaveBeenCalled();
        });

        it('should close port when connected', async () => {
            // arrange
            mockPort.open.and.returnValue(Promise.resolve());
            mockReader.cancel.and.returnValue(Promise.resolve());
            mockWriter.close.and.returnValue(Promise.resolve());
            mockPort.close.and.returnValue(Promise.resolve());
            spyOn(navigator.serial, 'requestPort').and.returnValue(Promise.resolve(mockPort));
            await service.connect();
            // act
            await service.disconnect();
            // assert
            expect(mockPort.close).toHaveBeenCalled();
        });

        it('should set isConnected to false after disconnect', async () => {
            // arrange
            mockPort.open.and.returnValue(Promise.resolve());
            mockReader.cancel.and.returnValue(Promise.resolve());
            mockWriter.close.and.returnValue(Promise.resolve());
            mockPort.close.and.returnValue(Promise.resolve());
            spyOn(navigator.serial, 'requestPort').and.returnValue(Promise.resolve(mockPort));
            await service.connect();
            expect(service.isConnected()).toBe(true);
            // act
            await service.disconnect();
            // assert
            expect(service.isConnected()).toBe(false);
        });

        it('should reject if disconnect fails', async () => {
            // arrange
            mockPort.open.and.returnValue(Promise.resolve());
            mockReader.cancel.and.returnValue(Promise.reject(new Error('Cancel failed')));
            spyOn(navigator.serial, 'requestPort').and.returnValue(Promise.resolve(mockPort));
            await service.connect();
            // act + assert
            await expectAsync(service.disconnect()).toBeRejectedWithError(/Failed to disconnect/);
        });
    });

    describe('abort', () => {
        beforeEach(async () => {
            mockPort.open.and.returnValue(Promise.resolve());
            spyOn(navigator.serial, 'requestPort').and.returnValue(Promise.resolve(mockPort));
            await service.connect();
        });

        it('should send exact abort command bytes [0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]', async () => {
            // arrange
            const expectedCommand = new Uint8Array([0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]);
            mockWriter.write.and.returnValue(Promise.resolve());
            mockReader.read.and.returnValue(Promise.resolve({value: expectedCommand, done: false}));
            // act
            await service.abort();
            // assert
            const call = mockWriter.write.calls.mostRecent();
            const sentCommand = call.args[0] as Uint8Array;
            expect(sentCommand.length).toBe(9);
            expect(sentCommand[0]).toBe(0x00);
            expect(sentCommand[1]).toBe(0x00);
            expect(sentCommand[2]).toBe(0x00);
            expect(sentCommand[3]).toBe(0x00);
            expect(sentCommand[4]).toBe(0x00);
            expect(sentCommand[5]).toBe(0x00);
            expect(sentCommand[6]).toBe(0x00);
            expect(sentCommand[7]).toBe(0x00);
            expect(sentCommand[8]).toBe(0x00);
        });

        it('should validate echo matches sent command exactly', async () => {
            // arrange
            const expectedCommand = new Uint8Array([0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]);
            mockWriter.write.and.returnValue(Promise.resolve());
            mockReader.read.and.returnValue(Promise.resolve({value: expectedCommand, done: false}));
            // act + assert
            await expectAsync(service.abort()).toBeResolved();
        });

        it('should reject if echo byte 0 does not match', async () => {
            // arrange
            const wrongEcho = new Uint8Array([0xFF, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]);
            mockWriter.write.and.returnValue(Promise.resolve());
            mockReader.read.and.returnValue(Promise.resolve({value: wrongEcho, done: false}));
            // act + assert
            await expectAsync(service.abort()).toBeRejectedWithError(/echo validation failed at byte 0/);
        });

        it('should reject if not connected', async () => {
            // arrange
            mockReader.cancel.and.returnValue(Promise.resolve());
            mockWriter.close.and.returnValue(Promise.resolve());
            mockPort.close.and.returnValue(Promise.resolve());
            await service.disconnect();
            // act + assert
            await expectAsync(service.abort()).toBeRejectedWithError('Serial port is not connected');
        });
    });

    describe('end', () => {
        beforeEach(async () => {
            mockPort.open.and.returnValue(Promise.resolve());
            spyOn(navigator.serial, 'requestPort').and.returnValue(Promise.resolve(mockPort));
            await service.connect();
        });

        it('should send exact end command bytes [0x30, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]', async () => {
            // arrange
            const expectedCommand = new Uint8Array([0x30, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]);
            mockWriter.write.and.returnValue(Promise.resolve());
            mockReader.read.and.returnValue(Promise.resolve({value: expectedCommand, done: false}));
            // act
            await service.end();
            // assert
            const call = mockWriter.write.calls.mostRecent();
            const sentCommand = call.args[0] as Uint8Array;
            expect(sentCommand.length).toBe(9);
            expect(sentCommand[0]).toBe(0x30);
            expect(sentCommand[1]).toBe(0x00);
            expect(sentCommand[2]).toBe(0x00);
            expect(sentCommand[3]).toBe(0x00);
            expect(sentCommand[4]).toBe(0x00);
            expect(sentCommand[5]).toBe(0x00);
            expect(sentCommand[6]).toBe(0x00);
            expect(sentCommand[7]).toBe(0x00);
            expect(sentCommand[8]).toBe(0x00);
        });

        it('should validate echo matches sent command exactly', async () => {
            // arrange
            const expectedCommand = new Uint8Array([0x30, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]);
            mockWriter.write.and.returnValue(Promise.resolve());
            mockReader.read.and.returnValue(Promise.resolve({value: expectedCommand, done: false}));
            // act + assert
            await expectAsync(service.end()).toBeResolved();
        });

        it('should reject if echo byte 0 does not match', async () => {
            // arrange
            const wrongEcho = new Uint8Array([0x31, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]);
            mockWriter.write.and.returnValue(Promise.resolve());
            mockReader.read.and.returnValue(Promise.resolve({value: wrongEcho, done: false}));
            // act + assert
            await expectAsync(service.end()).toBeRejectedWithError(/echo validation failed at byte 0/);
        });

        it('should reject if not connected', async () => {
            // arrange
            mockReader.cancel.and.returnValue(Promise.resolve());
            mockWriter.close.and.returnValue(Promise.resolve());
            mockPort.close.and.returnValue(Promise.resolve());
            await service.disconnect();
            // act + assert
            await expectAsync(service.end()).toBeRejectedWithError('Serial port is not connected');
        });
    });

    describe('ping', () => {
        beforeEach(async () => {
            mockPort.open.and.returnValue(Promise.resolve());
            spyOn(navigator.serial, 'requestPort').and.returnValue(Promise.resolve(mockPort));
            await service.connect();
        });

        it('should send exact ping command bytes [0x50, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]', async () => {
            // arrange
            const expectedCommand = new Uint8Array([0x50, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]);
            mockWriter.write.and.returnValue(Promise.resolve());
            mockReader.read.and.returnValue(Promise.resolve({value: expectedCommand, done: false}));
            // act
            await service.ping();
            // assert
            const call = mockWriter.write.calls.mostRecent();
            const sentCommand = call.args[0] as Uint8Array;
            expect(sentCommand.length).toBe(9);
            expect(sentCommand[0]).toBe(0x50);
            expect(sentCommand[1]).toBe(0x00);
            expect(sentCommand[2]).toBe(0x00);
            expect(sentCommand[3]).toBe(0x00);
            expect(sentCommand[4]).toBe(0x00);
            expect(sentCommand[5]).toBe(0x00);
            expect(sentCommand[6]).toBe(0x00);
            expect(sentCommand[7]).toBe(0x00);
            expect(sentCommand[8]).toBe(0x00);
        });

        it('should validate echo matches sent command exactly', async () => {
            // arrange
            const expectedCommand = new Uint8Array([0x50, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]);
            mockWriter.write.and.returnValue(Promise.resolve());
            mockReader.read.and.returnValue(Promise.resolve({value: expectedCommand, done: false}));
            // act + assert
            await expectAsync(service.ping()).toBeResolved();
        });

        it('should reject if echo byte 0 does not match', async () => {
            // arrange
            const wrongEcho = new Uint8Array([0x51, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]);
            mockWriter.write.and.returnValue(Promise.resolve());
            mockReader.read.and.returnValue(Promise.resolve({value: wrongEcho, done: false}));
            // act + assert
            await expectAsync(service.ping()).toBeRejectedWithError(/echo validation failed at byte 0/);
        });

        it('should reject if not connected', async () => {
            // arrange
            mockReader.cancel.and.returnValue(Promise.resolve());
            mockWriter.close.and.returnValue(Promise.resolve());
            mockPort.close.and.returnValue(Promise.resolve());
            await service.disconnect();
            // act + assert
            await expectAsync(service.ping()).toBeRejectedWithError('Serial port is not connected');
        });
    });

    describe('setHeaterVoltage', () => {
        beforeEach(async () => {
            mockPort.open.and.returnValue(Promise.resolve());
            spyOn(navigator.serial, 'requestPort').and.returnValue(Promise.resolve(mockPort));
            await service.connect();
        });

        it('should send exact command format [0x40, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, high_byte, low_byte]', async () => {
            // arrange
            mockWriter.write.and.callFake((cmd: Uint8Array) => {
                mockReader.read.and.returnValue(Promise.resolve({value: cmd, done: false}));
                return Promise.resolve();
            });
            // act
            await service.setHeaterVoltage(6.3);
            // assert
            const call = mockWriter.write.calls.mostRecent();
            const command = call.args[0] as Uint8Array;
            expect(command.length).toBe(9);
            expect(command[0]).toBe(0x40);
            expect(command[1]).toBe(0x00);
            expect(command[2]).toBe(0x00);
            expect(command[3]).toBe(0x00);
            expect(command[4]).toBe(0x00);
            expect(command[5]).toBe(0x00);
            expect(command[6]).toBe(0x00);
        });

        it('should calculate PWM value using quadratic formula for 6.3V', async () => {
            // arrange
            mockWriter.write.and.callFake((cmd: Uint8Array) => {
                mockReader.read.and.returnValue(Promise.resolve({value: cmd, done: false}));
                return Promise.resolve();
            });
            // act
            await service.setHeaterVoltage(6.3, 19);
            // assert
            const call = mockWriter.write.calls.mostRecent();
            const command = call.args[0] as Uint8Array;
            const pwmValue = (command[7] << 8) | command[8];
            expect(pwmValue).toBeCloseTo(112, 0);
        });

        it('should calculate PWM value for 12.6V', async () => {
            // arrange
            mockWriter.write.and.callFake((cmd: Uint8Array) => {
                mockReader.read.and.returnValue(Promise.resolve({value: cmd, done: false}));
                return Promise.resolve();
            });
            // act
            await service.setHeaterVoltage(12.6, 19);
            // assert
            const call = mockWriter.write.calls.mostRecent();
            const command = call.args[0] as Uint8Array;
            const pwmValue = (command[7] << 8) | command[8];
            expect(pwmValue).toBeCloseTo(450, 0);
        });

        it('should use default power supply of 19V', async () => {
            // arrange
            mockWriter.write.and.callFake((cmd: Uint8Array) => {
                mockReader.read.and.returnValue(Promise.resolve({value: cmd, done: false}));
                return Promise.resolve();
            });
            // act
            await service.setHeaterVoltage(6.3);
            // assert
            const call = mockWriter.write.calls.mostRecent();
            const command = call.args[0] as Uint8Array;
            const pwmValue = (command[7] << 8) | command[8];
            expect(pwmValue).toBeCloseTo(112, 0);
        });

        it('should place PWM value in last 2 bytes of command', async () => {
            // arrange
            mockWriter.write.and.callFake((cmd: Uint8Array) => {
                mockReader.read.and.returnValue(Promise.resolve({value: cmd, done: false}));
                return Promise.resolve();
            });
            // act
            await service.setHeaterVoltage(6.3);
            // assert
            const call = mockWriter.write.calls.mostRecent();
            const command = call.args[0] as Uint8Array;
            expect(command.length).toBe(9);
            expect(command[0]).toBe(0x40);
            expect(command[1]).toBe(0x00);
            expect(command[2]).toBe(0x00);
            expect(command[3]).toBe(0x00);
            expect(command[4]).toBe(0x00);
            expect(command[5]).toBe(0x00);
            expect(command[6]).toBe(0x00);
            expect(command[7]).toBeLessThanOrEqual(0x03);
        });

        it('should encode 10-bit value correctly (upper 6 bits zero)', async () => {
            // arrange
            mockWriter.write.and.callFake((cmd: Uint8Array) => {
                mockReader.read.and.returnValue(Promise.resolve({value: cmd, done: false}));
                return Promise.resolve();
            });
            // act
            await service.setHeaterVoltage(6.3);
            // assert
            const call = mockWriter.write.calls.mostRecent();
            const command = call.args[0] as Uint8Array;
            const highByte = command[7];
            expect(highByte & 0xFC).toBe(0);
        });

        it('should validate echo response', async () => {
            // arrange
            mockWriter.write.and.callFake((cmd: Uint8Array) => {
                mockReader.read.and.returnValue(Promise.resolve({value: cmd, done: false}));
                return Promise.resolve();
            });
            // act + assert
            await expectAsync(service.setHeaterVoltage(6.3)).toBeResolved();
        });

        it('should reject if not connected', async () => {
            // arrange
            mockReader.cancel.and.returnValue(Promise.resolve());
            mockWriter.close.and.returnValue(Promise.resolve());
            mockPort.close.and.returnValue(Promise.resolve());
            await service.disconnect();
            // act + assert
            await expectAsync(service.setHeaterVoltage(6.3)).toBeRejectedWithError('Serial port is not connected');
        });

        it('should handle 0V heater voltage', async () => {
            // arrange
            mockWriter.write.and.callFake((cmd: Uint8Array) => {
                mockReader.read.and.returnValue(Promise.resolve({value: cmd, done: false}));
                return Promise.resolve();
            });
            // act
            await service.setHeaterVoltage(0);
            // assert
            const call = mockWriter.write.calls.mostRecent();
            const command = call.args[0] as Uint8Array;
            const pwmValue = (command[7] << 8) | command[8];
            expect(pwmValue).toBe(0);
        });

        it('should handle maximum voltage (equal to power supply)', async () => {
            // arrange
            mockWriter.write.and.callFake((cmd: Uint8Array) => {
                mockReader.read.and.returnValue(Promise.resolve({value: cmd, done: false}));
                return Promise.resolve();
            });
            // act
            await service.setHeaterVoltage(19, 19);
            // assert
            const call = mockWriter.write.calls.mostRecent();
            const command = call.args[0] as Uint8Array;
            const pwmValue = (command[7] << 8) | command[8];
            expect(pwmValue).toBe(1023);
        });

        it('should reject if echo byte 0 does not match 0x40', async () => {
            // arrange
            mockWriter.write.and.callFake((cmd: Uint8Array) => {
                const wrongEcho = new Uint8Array(cmd);
                wrongEcho[0] = 0x41;
                mockReader.read.and.returnValue(Promise.resolve({value: wrongEcho, done: false}));
                return Promise.resolve();
            });
            // act + assert
            await expectAsync(service.setHeaterVoltage(6.3)).toBeRejectedWithError(/echo validation failed at byte 0/);
        });

        it('should reject if echo byte 1 does not match', async () => {
            // arrange
            mockWriter.write.and.callFake((cmd: Uint8Array) => {
                const wrongEcho = new Uint8Array(cmd);
                wrongEcho[1] = 0xFF;
                mockReader.read.and.returnValue(Promise.resolve({value: wrongEcho, done: false}));
                return Promise.resolve();
            });
            // act + assert
            await expectAsync(service.setHeaterVoltage(6.3)).toBeRejectedWithError(/echo validation failed at byte 1/);
        });

        it('should reject if echo PWM bytes do not match', async () => {
            // arrange
            mockWriter.write.and.callFake((cmd: Uint8Array) => {
                const wrongEcho = new Uint8Array(cmd);
                wrongEcho[8] = wrongEcho[8] ^ 0xFF;
                mockReader.read.and.returnValue(Promise.resolve({value: wrongEcho, done: false}));
                return Promise.resolve();
            });
            // act + assert
            await expectAsync(service.setHeaterVoltage(6.3)).toBeRejectedWithError(/echo validation failed at byte 8/);
        });
    });
});
