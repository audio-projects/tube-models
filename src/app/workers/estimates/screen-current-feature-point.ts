export interface ScreenCurrentFeaturePoint {
    type: 'Inflection Point' | 'Local Maximum' | 'Local Minimum';
    epmax: number;
    eg: number;
    is: number;
    ip: number;
    ep: number;
    es: number;
};
