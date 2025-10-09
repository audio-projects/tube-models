import { InflectionPoint } from './estimates/inflection-point';
import { MathCollection, MathNumericType } from 'mathjs';
import { Point } from '../files';
import { Vector } from './algorithms/vector';
import { ScreenCurrentFeaturePoint } from './estimates/screen-current-feature-point';

export interface KpAverage {
    file: string;
    kp: number;
    eg: number;
}

export interface ExAverage {
    file: string;
    ex: number;
    eg: number;
}

export interface Kg1Average {
    file: string;
    kg1: number;
    eg: number;
}

export interface KvbAverage {
    file: string;
    kvb: number;
    eg: number;
}

export interface Kg2Average {
    file: string;
    kg2: number;
}

export interface AAverage {
    file: string;
    a: number;
    eg: number;
};

export interface AlphaSAverage {
    file: string;
    a: number;
    b: number;
    eg: number;
};

export interface BetaAverage {
    file: string;
    a: number;
    b: number;
    eg: number;
};

export interface ResidualEntry {
    r: Vector;
    x: Vector;
    fx: MathNumericType;
}

export interface JacobianEntry {
    x: Vector;
    jacobian: MathCollection;
}

export interface GradientEntry {
    x: Vector;
    gradc: Vector;
    modulus: number;
}

export interface Trace {
    iterations: number;
    history: MathCollection[];
    functionValues: number[];
    estimates: {
        kp?: {
            average: KpAverage[];
        };
        mu?: {
            maxIp: number;
            ip: number;
            points: Point[];
        };
        kvb?: {
            average: KvbAverage[];
        };
        ex?: {
            average: ExAverage[];
        };
        kg1?: {
            average: Kg1Average[];
        };
        kg2?: {
            average: Kg2Average[];
        };
        a?: {
            average: AAverage[];
        };
        secondaryEmission?: {
            s?: {
                s?: number;
                average: number[];
            };
            screenCurrentFeaturePoints?: ScreenCurrentFeaturePoint[];
        };
        beta?: {
            average: BetaAverage[];
        };
        alphaS?: {
            average: AlphaSAverage[];
        };
    };
    residuals: ResidualEntry[];
    functionCalls: number;
    jacobians?: JacobianEntry[];
    gradients?: GradientEntry[];
    tolerance?: number;
}
