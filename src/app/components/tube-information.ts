
import { File } from '../files';

export interface TubeInformation {
    id: string;
    name: string;
    manufacturer: string;
    comments: string;
    lastUpdatedOn: string;
    type: 'Triode' | 'Pentode' | 'Tetrode';

    maximumPlateVoltage?: number;
    maximumPlateDissipation?: number;
    maximumPlateCurrent?: number;
    maximumCathodeCurrent?: number;
    maximumGrid1Voltage?: number;
    maximumGrid2Voltage?: number;
    maximumGrid2Dissipation?: number;
    minimumHeaterVoltage?: number;
    maximumHeaterVoltage?: number;
    maximumHeaterToCathodeVoltage?: number;
    minimumHeaterToCathodeVoltage?: number;
    heaterCurrent?: number;
    heaterWarmupTime?: number;
    ccg1?: number;
    ccg2?: number;
    ccg3?: number;
    cg1g2?: number;
    cg1g3?: number;
    cg2g3?: number;
    cg1p?: number;
    cg2p?: number;
    cg3p?: number;
    ccp?: number;
    files: File[];
    egOffset?: number;

    // Norman Koren Triode Model SPICE Parameters
    triodeModelParameters?: {
        mu?: number;
        ex?: number;
        kg1?: number;
        kp?: number;
        kvb?: number;
        calculated?: boolean;
        lastCalculated?: string;
    };

    // Norman Koren Pentode Model SPICE Parameters
    pentodeSpiceModelParameters?: {
        mu?: number;
        ex?: number;
        kg1?: number;
        kg2?: number;
        kp?: number;
        kvb?: number;
        calculated?: boolean;
        lastCalculated?: string;
    };

    // Tetrode SPICE Parameters (similar to pentode but without screen grid secondary emission)
    tetrodeSpiceModelParameters?: {
        mu?: number;
        ex?: number;
        kg1?: number;
        kg2?: number;
        kp?: number;
        kvb?: number;
        calculated?: boolean;
        lastCalculated?: string;
    };
}
