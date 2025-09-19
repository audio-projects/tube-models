import { MathCollection, MathNumericType } from 'mathjs';
import { Point } from '../files';
import { Vector } from './algorithms/vector';

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
        mu?: {
            maxip: number;
            ip: number;
            points: Point[];
        };
        kp?: {
            average: KpAverage[];
        };
        ex?: {
            average: ExAverage[];
        };
        kg1?: {
            average: Kg1Average[];
        };
        kvb?: {
            average: KvbAverage[];
        };
        kg2?: {
            average: Kg2Average[];
        };
        a?: {
            average: AAverage[];
        };
    };
    residuals: ResidualEntry[];
    functionCalls: number;
    jacobians?: JacobianEntry[];
    gradients?: GradientEntry[];
    tolerance?: number;
}
