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

export const measurementTypeDescription = (measurementType: string | undefined): string => {
    // check type
    if (measurementType == 'IP_EG_EP_VS_VH') return 'I(Vg, Va) with VS, Vh constant';
    if (measurementType == 'IP_VG_VA_VH') return 'I(Vg, Va) with Vh constant';
    if (measurementType == 'IP_EG_EPES_VH') return 'I(Vg, Va=Vs) with Vh constant';
    if (measurementType == 'IP_EP_EG_VS_VH') return 'I(Va, Vg) with VS, Vh constant';
    if (measurementType == 'IP_VA_VG_VH') return 'I(Va, Vg) with Vh constant';
    if (measurementType == 'IP_EP_ES_VG_VH') return 'I(Va, Vs) with Vg, Vh constant';
    if (measurementType == 'IP_EPES_EG_VH') return 'I(Va=Vs, Vg) with Vh constant';
    if (measurementType == 'IP_ES_EG_VA_VH') return 'I(Vs, Vg) with Va, Vh constant';
    if (measurementType == 'IP_EH_EG_VA_VS') return 'I(Vh, Vg) with Va, Vs constant';
    if (measurementType == 'IP_EH_EP_VG_VS') return 'I(Vh, Va) with Vg, Vs constant';
    return 'Unknown';
};
