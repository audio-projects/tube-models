export interface Point {
    index?: number;

    ip: number;
    is?: number;
    ep: number;
    eg: number;
    es?: number;
    eh?: number;
}

export interface Series {
    eg?: number;
    ep?: number;
    es?: number;
    eh?: number;
    ip?: number;
    is?: number;

    points: Point[];
}

export interface File {
    name: string;
    series: Series[];
    measurementType: string;
    measurementTypeLabel: string;
    egOffset: number; // Grid voltage offset for this specific file, defaults to 0

    es?: number;
    eh?: number;
    ep?: number;
    eg?: number;
}
