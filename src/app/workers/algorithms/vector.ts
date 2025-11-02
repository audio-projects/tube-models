import { equal, index, MathCollection, MathNumericType, size, subset } from "mathjs";

export type Vector = MathCollection<MathNumericType>;

export function length(vector: Vector): number {
    // vector size
    const s = size(vector);
    // must have one dimension
    if (equal(subset(size(s), index(0)), 1)) {
        // length
        return subset(s, index(0)) as unknown as number;
    };
    throw "argument is not a vector";
}

export function valueAt(vector: Vector, i: number): MathNumericType {
    return subset(vector, index(i)) as unknown as MathNumericType;
}

export function numberValueAt(vector: Vector, i: number): number {
    return subset(vector, index(i)) as unknown as number;
}
