import { Injectable } from '@angular/core';
import { TubeInformation } from '../components/tube-information';

@Injectable({
    providedIn: 'root'
})
export class ModelService {

    getTriodeModel(tube: TubeInformation): string {
        // parameters
        const params = tube.triodeModelParameters;
        if (!params || !params.calculatedOn)
            return '';
        // tube name sanitized for SPICE subckt name
        const cleanTubeName = (tube.name || 'Unknown').toUpperCase().replace(/[^A-Z0-9]/g, '_');
        // suffix
        const suffix = tube.type === 'Triode' ? '' : '_triode';
        // calculatedOn formatted
        const calculatedOn = new Date(params.calculatedOn).toLocaleString('en-US', { month: 'numeric', day: 'numeric', year: '2-digit', hour: 'numeric', minute: '2-digit', hour12: true });
        // return SPICE model
        return [
            `.SUBCKT ${cleanTubeName}${suffix} P G K`,
            `* ${tube.name} Triode Model (Norman Koren)`,
            `* Root Mean Square Error: ${params.rmse?.toExponential()}`,
            `* Parameters calculated on: ${calculatedOn}${tube.id ? ` (https://audio-projects.us/tube-models/#/tube/${tube.id})` : ''}`,
            `X1 P G K TriodeK MU=${params.mu} EX=${params.ex} KG1=${params.kg1} KP=${params.kp} KVB=${params.kvb} CCG=${tube.ccg1 || 0} CGP=${tube.cg1p || 0} CCP=${tube.ccp || 0} RGI=2000`,
            `.ENDS`
        ].join('\n');
    }
}
