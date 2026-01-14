import { inject, Injectable } from '@angular/core';
import { AdcData, Averaging, Compliance, CurrentGain, UTracerService } from './utracer.service';
import { Subject } from 'rxjs';

interface HeaterStatus {
    voltage: number;
    percentage: number;
}

@Injectable()
export class UTracerReaderService {

    private errorSubject = new Subject<Error>();
    error$ = this.errorSubject.asObservable();

    private heaterSubject = new Subject<HeaterStatus>();
    heater$ = this.heaterSubject.asObservable();

    private adcDataSubject = new Subject<AdcData>();
    adcData$ = this.adcDataSubject.asObservable();

    private _state: 'idle' | 'initializing' | 'reading' | 'heating' | 'ready' | 'error' = 'idle';
    private _heaterOn = false;

    private uTracerService = inject(UTracerService);

    private abortController: AbortController | null = null;

    get state() {
        return this._state;
    }

    async initialize(): Promise<void> {
        // create abort controller
        this.abortController = new AbortController();
        // signal
        const signal = this.abortController.signal;

        try {
            // check state
            if (this._state !== 'idle')
                return;
            // state
            this._state = 'initializing';
            // initial uTracer setup
            await this.uTracerService.start(0, 0x40, 0x08, 0x08);
            // check progress
            signal.throwIfAborted();
            // state
            this._state = 'reading';
            // ping uTracer, read data
            const adcData = await this.uTracerService.ping();
            // emit adc data
            this.emitAdcData(adcData);
            // check progress
            signal.throwIfAborted();
            // state
            this._state = 'idle';
        }
        catch(error) {
            // check user aborted
            if (signal.aborted) {
                // state
                this._state = 'idle';
                // emit error
                this.emitError(new Error('uTracer reader initialization aborted'));
                // exit
                return;
            }
            // state
            this._state = 'error';
            // emit error
            this.emitError(new Error('Failed to initialize uTracer reader', { cause: error instanceof Error ? error : undefined }));
        }
        finally {
            // reset abort controller
            this.abortController = null;
        }
    }

    async start(compliance: Compliance = 0, averaging: Averaging = 0x40, plateGain: CurrentGain = 0x08, screenGain: CurrentGain = 0x08, heaterVoltage = 0): Promise<void> {
        // create abort controller
        this.abortController = new AbortController();
        // signal
        const signal = this.abortController.signal;

        try {
            // check state
            if (this._state !== 'idle')
                return;
            // state
            this._state = 'reading';
            // ping uTracer, read data
            const adcData = await this.uTracerService.ping();
            // emit adc data
            this.emitAdcData(adcData);
            // check progress
            signal.throwIfAborted();
            // check we need to heat tube
            if (heaterVoltage > 0) {
                // check heater voltage
                if (heaterVoltage > adcData.positivePowerSupplyVoltage) {
                    // state (idle since we have not done anything yet)
                    this._state = 'idle';
                    // emit error
                    this.emitError(new Error(`Heater voltage (${heaterVoltage} V) exceeds power supply voltage (${adcData.positivePowerSupplyVoltage.toFixed(2)} V).`));
                    // exit
                    return;
                }
                // state
                this._state = 'heating';
                // heater value & percentage
                let eh = 0;
                let percentage = 0;
                // update flag
                this._heaterOn = true;
                // emit status
                this.emitHeaterStatus(eh, percentage);
                // use 15 steps in the heating process (10s ramp up + 5s hold)
                for (let it = 1; it <= 15; it++) {
                    // voltage at iteration
                    eh = Math.min((heaterVoltage * it) / 10, heaterVoltage);
                    // send utracer command
                    await this.uTracerService.setHeaterVoltage(adcData.positivePowerSupplyVoltage, eh);
                    // check progress
                    signal.throwIfAborted();
                    // update progress
                    percentage = (it / 15) * 100;
                    // emit status
                    this.emitHeaterStatus(eh, percentage);
                    // wait 1 second between steps
                    await new Promise(resolve => setTimeout(resolve, 1000));
                    // check progress
                    signal.throwIfAborted();
                }
            }
            // initialize uTracer for reading
            await this.uTracerService.start(compliance, averaging, plateGain, screenGain);
            // check progress
            signal.throwIfAborted();
            // update state
            this._state = 'ready';
        }
        catch (error) {
            try {
                // emit error
                this.emitError(signal.aborted ? new Error(signal.reason) : new Error('Failed to start uTracer reading', { cause: error instanceof Error ? error : undefined }));
                // shutdown heater if needed
                if (this._state === 'heating' && heaterVoltage > 0) {
                    // shutdown heater
                    await this.uTracerService.setHeaterVoltage(0, 0);
                }
            }
            catch (ex) {
                // ignore errors, only log in console
                console.error('Failed to shut down heater: ', ex);
            }
            finally {
                // emit status
                this.emitHeaterStatus(0, 0);
                // update flag
                this._heaterOn = false;
            }
            // reset state
            this._state = 'idle';
        }
        finally {
            // reset abort controller
            this.abortController = null;
        }
    }

    async measure(positivePowerSupplyVoltage: number, averaging: Averaging = 0x40, plateVoltage: number, screenVoltage: number, gridVoltage: number, heaterVoltage: number): Promise<AdcData | null> {
        try {
            // check state
            if (this._state !== 'ready')
                return null;
            // state
            this._state = 'reading';
            // perform measurement
            const adcData = await this.uTracerService.measure(positivePowerSupplyVoltage, averaging, plateVoltage, screenVoltage, gridVoltage, heaterVoltage);
            // emit adc data
            this.emitAdcData(adcData);
            // return adc data
            return adcData;
        }
        catch (error) {
            // emit error
            this.emitError(new Error('Failed to read measurement from uTracer', { cause: error instanceof Error ? error : undefined }));
            // no data
            return null;
        }
        finally {
            // update state
            this._state = 'ready';
        }
    }

    async read(): Promise<void> {
        // initial state
        const initialState = this._state;
        try {
            // check state
            if (this._state !== 'idle' && this._state !== 'ready')
                return;
            // state
            this._state = 'reading';
            // ping uTracer, read data
            const adcData = await this.uTracerService.ping();
            // emit adc data
            this.emitAdcData(adcData);
        }
        catch (error) {
            // emit error
            this.emitError(new Error('Failed to read from uTracer', { cause: error instanceof Error ? error : undefined }));
        }
        finally {
            // update state
            this._state = initialState;
        }
    }

    abort() {
        // check abort controller
        if (this.abortController) {
            // abort ongoing operation
            this.abortController.abort('Operation aborted by user');
        }
    }

    async stop(): Promise<void> {
        // check state
        if (this._state !== 'ready')
            return;

        try {
            // shutdown heater if required
            if (this._heaterOn) {
                // shutdown heater
                await this.uTracerService.setHeaterVoltage(0, 0);
                // update flag
                this._heaterOn = false;
            }
        }
        catch (error) {
            // emit error
            this.emitError(new Error('Failed to stop uTracer', { cause: error instanceof Error ? error : undefined }));
        }
        finally {
            // update state
            this._state = 'idle';
        }
    }

    private emitError(error: Error) {
        this.errorSubject.next(error);
    }

    private emitHeaterStatus(voltage: number, percentage: number) {
        this.heaterSubject.next({ voltage, percentage });
    }

    private emitAdcData(adcData: AdcData) {
        this.adcDataSubject.next(adcData);
    }
}
