import { File } from '../files';
import { TriodeModelParameters } from '../workers/models/triode-model-parameters';
import { PentodeModelParameters } from '../workers/models/pentode-model-parameters';

export interface DerkModelParameters {
    mu?: number;
    ex?: number;
    kg1?: number;
    kg2?: number;
    kp?: number;
    kvb?: number;
    a?: number;
    alphaS?: number;
    beta?: number;
    secondaryEmission?: boolean;
    s?: number;
    alphaP?: number;
    lambda?: number;
    v?: number;
    w?: number;
    calculatedOn?: string; // ISO-8601 datetime string with timezone
    // root mean square error
    rmse?: number;
}

export interface TubeInformation {
    id: string;
    name: string;
    manufacturer: string;
    comments: string;
    lastUpdatedOn: string;
    type: 'Triode' | 'Pentode' | 'Tetrode';
    owner?: string; // Firebase user UID who owns this tube

    datasheetUrl?: string;
    maximumPlateDissipation?: number;
    maximumPlateVoltage?: number;
    maximumGrid1Voltage?: number;
    maximumPlateCurrent?: number;
    maximumCathodeCurrent?: number;
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

    triodeModelParameters?: TriodeModelParameters;
    pentodeModelParameters?: PentodeModelParameters;
    derkModelParameters?: DerkModelParameters;
    derkEModelParameters?: DerkModelParameters;
}
