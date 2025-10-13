import { Injectable } from '@angular/core';
import { TubeInformation } from '../components/tube-information';

@Injectable({
    providedIn: 'root'
})
export class ModelService {

    getTriodeModelDefinition(): string {
        return [
            '.SUBCKT TriodeK 1 2 3',
            '*               P G K',
            'E1 7 0 VALUE={V(1,3)/KP*LOG(1+EXP(KP*(1/MU+V(2,3)/SQRT(KVB+V(1,3)*V(1,3)))))}',
            'R1 7 0 1G',
            'G1 1 3 VALUE={0.5*PWR(V(7),EX)*(1+SGN(V(7)))/KG1}',
            'R2 1 3 1G',
            'C1 2 3 {CCG}',
            'C2 2 1 {CGP}',
            'C3 3 1 {CCP}',
            'R3 2 5 {RGI}',
            'D3 5 3 DX',
            '.MODEL DX D(IS=1N RS=1 CJO=10PF TT=1N)',
            '.ENDS'
        ].join('\n');
    }

    getPentodeModelDefinition(): string {
        return [
            '.SUBCKT PentodeK 1 2 3 4',
            '*                P G K S',
            'E1 7 0 VALUE={V(4,3)*LOG(1+EXP(KP*(1/MU+V(2,3)/SQRT(KVB+V(4,3)*V(4,3)))))/KP}',
            'R1 7 0 1G',
            'G1 1 3 VALUE={0.5*PWR(V(7),EX)*(1+SGN(V(7)))*ATAN(V(1,3)/KVB)/KG1}',
            'G2 4 3 VALUE={0.5*PWR(V(7),EX)*(1+SGN(V(7)))/KG2}',
            'R2 1 3 1G',
            'C1 3 2 {CCG}',
            'C2 3 4 {CCS}',
            'C3 2 4 {CGS}',
            'C4 2 1 {CGP}',
            'C5 3 1 {CCP}',
            'R3 2 5 {RGI}',
            'D3 5 3 DX',
            '.MODEL DX D(IS=1N RS=1 CJO=10PF TT=1N)',
            '.ENDS'
        ].join('\n');
    }

    getDerkModelDefinition(secondaryEmissions: boolean): string {
        // check secondary emissions
        if (secondaryEmissions) {
            // SE
            return [
                '.SUBCKT Derk_SE 1 2 3 4',
                '*               P G K S',
                'E1 7 0 VALUE={V(4,3)*LOG(1+EXP(KP*(1/MU+V(2,3)/SQRT(KVB+V(4,3)*V(4,3)))))/KP}',
                'R1 7 0 1G',
                'E2 8 0 VALUE={S*V(1,3)*(1+(EXP(-2*ALPHAP*(V(1,3)-(V(4,3)/LAMBDA-V*V(2,3)-W)))-1)/(EXP(-2*ALPHAP*(V(1,3)-(V(4,3)/LAMBDA-V*V(2,3)-W)))+1))}',
                'R2 8 0 1G',
                'G1 1 3 VALUE={(0.5*PWR(V(7),EX)*(1+SGN(V(7))))*(1/KG1-1/KG2+A*V(1,3)/KG1-V(8)/KG2-(ALPHA/KG1+ALPHAS/KG2)/(1+BETA*V(1,3)))}',
                'R3 1 3 1G',
                'G2 4 3 VALUE={(0.5*PWR(V(7),EX)*(1+SGN(V(7))))*(1+ALPHAS/(1+BETA*V(1,3))+V(8))/KG2}',
                'R4 4 3 1G',
                'C1 3 2 {CCG}',
                'C2 3 4 {CCS}',
                'C3 2 4 {CGS}',
                'C4 2 1 {CGP}',
                'C5 3 1 {CCP}',
                'R5 2 5 {RGI}',
                'D3 5 3 DX',
                '.MODEL DX D(IS=1N RS=1 CJO=10PF TT=1N)',
                '.ENDS'
            ].join('\n');
        }
        // no SE
        return [
            '.SUBCKT Derk 1 2 3 4',
            '*            P G K S',
            'E1 7 0 VALUE={V(4,3)*LOG(1+EXP(KP*(1/MU+V(2,3)/SQRT(KVB+V(4,3)*V(4,3)))))/KP}',
            'R1 7 0 1G',
            'G1 1 3 VALUE={(0.5*PWR(V(7),EX)*(1+SGN(V(7))))*(1/KG1-1/KG2+A*V(1,3)/KG1-(ALPHA/KG1+ALPHAS/KG2)/(1+BETA*V(1,3)))}',
            'R2 1 3 1G',
            'G2 4 3 VALUE={(0.5*PWR(V(7),EX)*(1+SGN(V(7))))*(1+ALPHAS/(1+BETA*V(1,3)))/KG2}',
            'R3 4 3 1G',
            'C1 3 2 {CCG}',
            'C2 3 4 {CCS}',
            'C3 2 4 {CGS}',
            'C4 2 1 {CGP}',
            'C5 3 1 {CCP}',
            'R4 2 5 {RGI}',
            'D3 5 3 DX',
            '.MODEL DX D(IS=1N RS=1 CJO=10PF TT=1N)',
            '.ENDS'
        ].join('\n');
    }

    getDerkEModelDefinition(secondaryEmissions: boolean): string {
        // check secondary emissions
        if (secondaryEmissions) {
            // SE
            return [
                '.SUBCKT DerkE_SE 1 2 3 4',
                '*                P G K S',
                'E1 7 0 VALUE={V(4,3)*LOG(1+EXP(KP*(1/MU+V(2,3)/SQRT(KVB+V(4,3)*V(4,3)))))/KP}',
                'R1 7 0 1G',
                'E2 8 0 VALUE={S*V(1,3)*(1+(EXP(-2*ALPHAP*(V(1,3)-(V(4,3)/LAMBDA-V*V(2,3)-W)))-1)/(EXP(-2*ALPHAP*(V(1,3)-(V(4,3)/LAMBDA-V*V(2,3)-W)))+1))}',
                'R2 8 0 1G',
                'G1 1 3 VALUE={(0.5*PWR(V(7),EX)*(1+SGN(V(7))))*(1/KG1-1/KG2+A*V(1,3)/KG1-V(8)/KG2-ALPHA*EXP(-PWR(BETA*V(1,3),1.5))/KG1*(1/KG1+ALPHAS/KG2))}',
                'R3 1 3 1G',
                'G2 4 3 VALUE={(0.5*PWR(V(7),EX)*(1+SGN(V(7))))*(1+ALPHAS*EXP(-PWR(BETA*V(1,3),1.5))+V(8))/KG2}',
                'R4 4 3 1G',
                'C1 3 2 {CCG}',
                'C2 3 4 {CCS}',
                'C3 2 4 {CGS}',
                'C4 2 1 {CGP}',
                'C5 3 1 {CCP}',
                'R5 2 5 {RGI}',
                'D3 5 3 DX',
                '.MODEL DX D(IS=1N RS=1 CJO=10PF TT=1N)',
                '.ENDS'
            ].join('\n');
        }
        // no SE
        return [
            '.SUBCKT DerkE 1 2 3 4',
            '*             P G K S',
            'E1 7 0 VALUE={V(4,3)*LOG(1+EXP(KP*(1/MU+V(2,3)/SQRT(KVB+V(4,3)*V(4,3)))))/KP}',
            'R1 7 0 1G',
            'G1 1 3 VALUE={(0.5*PWR(V(7),EX)*(1+SGN(V(7))))*(1/KG1-1/KG2+A*V(1,3)/KG1-ALPHA*EXP(-PWR(BETA*V(1,3),1.5))/KG1*(1/KG1+ALPHAS/KG2))}',
            'R2 1 3 1G',
            'G2 4 3 VALUE={(0.5*PWR(V(7),EX)*(1+SGN(V(7))))*(1+ALPHAS*EXP(-PWR(BETA*V(1,3),1.5)))/KG2}',
            'R3 4 3 1G',
            'C1 3 2 {CCG}',
            'C2 3 4 {CCS}',
            'C3 2 4 {CGS}',
            'C4 2 1 {CGP}',
            'C5 3 1 {CCP}',
            'R4 2 5 {RGI}',
            'D3 5 3 DX',
            '.MODEL DX D(IS=1N RS=1 CJO=10PF TT=1N)',
            '.ENDS'
        ].join('\n');
    }

    getTriodeModel(tube?: TubeInformation): string {
        // parameters
        const params = tube?.triodeModelParameters;
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
            `* Root Mean Square Error: ${params.rmse?.toFixed(4)} mA`,
            `* Parameters calculated on: ${calculatedOn}${tube.id ? ` (https://audio-projects.us/tube-models/#/tube/${tube.id})` : ''}`,
            `X1 P G K TriodeK MU=${(params.mu ?? 0).toFixed(6)} EX=${(params.ex ?? 0).toFixed(6)} KG1=${(params.kg1 ?? 0).toFixed(6)} KP=${(params.kp ?? 0).toFixed(6)} KVB=${(params.kvb ?? 0).toFixed(6)} CCG=${tube.ccg1 || 0} CGP=${tube.cg1p || 0} CCP=${tube.ccp || 0} RGI=2000`,
            `.ENDS`
        ].join('\n');
    }

    getPentodeModel(tube?: TubeInformation): string {
        // parameters
        const params = tube?.pentodeModelParameters;
        if (!params || !params.calculatedOn)
            return '';
        // tube name sanitized for SPICE subckt name
        const cleanTubeName = (tube.name || 'Unknown').toUpperCase().replace(/[^A-Z0-9]/g, '_');
        // calculatedOn formatted
        const calculatedOn = new Date(params.calculatedOn).toLocaleString('en-US', { month: 'numeric', day: 'numeric', year: '2-digit', hour: 'numeric', minute: '2-digit', hour12: true });
        // return SPICE model
        return [
            `.SUBCKT ${cleanTubeName} P G K S`,
            `* ${tube.name} Pentode Model (Norman Koren)`,
            `* Root Mean Square Error: ${params.rmse?.toFixed(4)} mA`,
            `* Parameters calculated on: ${calculatedOn}${tube.id ? ` (https://audio-projects.us/tube-models/#/tube/${tube.id})` : ''}`,
            `X1 P G K S PentodeK MU=${(params.mu ?? 0).toFixed(6)} EX=${(params.ex ?? 0).toFixed(6)} KG1=${(params.kg1 ?? 0).toFixed(6)} KP=${(params.kp ?? 0).toFixed(6)} KVB=${(params.kvb ?? 0).toFixed(6)} KG2=${(params.kg2 ?? 0).toFixed(6)} CCG=${tube.ccg1 || 0} CCS=${tube.ccg2 || 0} CGS=${tube.cg1g2 || 0} CGP=${tube.cg1p || 0} CCP=${tube.ccp || 0} RGI=2000`,
            `.ENDS`
        ].join('\n');
    }

    getDerkModel(tube?: TubeInformation): string {
        // parameters
        const params = tube?.derkModelParameters;
        if (!params || !params.calculatedOn)
            return '';
        // tube name sanitized for SPICE subckt name
        const cleanTubeName = (tube.name || 'Unknown').toUpperCase().replace(/[^A-Z0-9]/g, '_');
        // calculatedOn formatted
        const calculatedOn = new Date(params.calculatedOn).toLocaleString('en-US', { month: 'numeric', day: 'numeric', year: '2-digit', hour: 'numeric', minute: '2-digit', hour12: true });
        // calculated parameters
        const alpha = 1 - (params.kg1 ?? 0) * (1 + (params.alphaS ?? 0)) / (params.kg2 ?? 1);
        // return SPICE model
        return [
            `.SUBCKT ${cleanTubeName} P G K S`,
            `* ${tube.name} Derk Model (Derk Reefman)`,
            `* Root Mean Square Error: ${params.rmse?.toFixed(4)} mA`,
            `* Parameters calculated on: ${calculatedOn}${tube.id ? ` (https://audio-projects.us/tube-models/#/tube/${tube.id})` : ''}`,
            `X1 P G K S Derk${params.secondaryEmission ? '_SE' : ''} MU=${(params.mu ?? 0).toFixed(6)} EX=${(params.ex ?? 0).toFixed(6)} KG1=${(params.kg1 ?? 0).toFixed(6)} KP=${(params.kp ?? 0).toFixed(6)} KVB=${(params.kvb ?? 0).toFixed(6)} KG2=${(params.kg2 ?? 0).toFixed(6)} A=${(params.a ?? 0).toFixed(6)} ALPHAS=${(params.alphaS ?? 0).toFixed(6)} BETA=${(params.beta ?? 0).toFixed(6)} ALPHA=${alpha.toFixed(6)}${params.secondaryEmission ? ` S=${(params.s ?? 0).toFixed(6)} ALPHAP=${(params.alphaP ?? 0).toFixed(6)} LAMBDA=${(params.lambda ?? 0).toFixed(6)} V=${(params.v ?? 0).toFixed(6)} W=${(params.w ?? 0).toFixed(6)}` : ''} CCG=${tube.ccg1 || 0} CCS=${tube.ccg2 || 0} CGS=${tube.cg1g2 || 0} CGP=${tube.cg1p || 0} CCP=${tube.ccp || 0} RGI=2000`,
            `.ENDS`
        ].join('\n');
    }

    getDerkEModel(tube?: TubeInformation): string {
        // parameters
        const params = tube?.derkEModelParameters;
        if (!params || !params.calculatedOn)
            return '';
        // tube name sanitized for SPICE subckt name
        const cleanTubeName = (tube.name || 'Unknown').toUpperCase().replace(/[^A-Z0-9]/g, '_');
        // calculatedOn formatted
        const calculatedOn = new Date(params.calculatedOn).toLocaleString('en-US', { month: 'numeric', day: 'numeric', year: '2-digit', hour: 'numeric', minute: '2-digit', hour12: true });
        // calculated parameters
        const alpha = 1 - (params.kg1 ?? 0) * (1 + (params.alphaS ?? 0)) / (params.kg2 ?? 1);
        // return SPICE model
        return [
            `.SUBCKT ${cleanTubeName} P G K S`,
            `* ${tube.name} DerkE Model (Derk Reefman)`,
            `* Root Mean Square Error: ${params.rmse?.toFixed(4)} mA`,
            `* Parameters calculated on: ${calculatedOn}${tube.id ? ` (https://audio-projects.us/tube-models/#/tube/${tube.id})` : ''}`,
            `X1 P G K S DerkE${params.secondaryEmission ? '_SE' : ''} MU=${(params.mu ?? 0).toFixed(6)} EX=${(params.ex ?? 0).toFixed(6)} KG1=${(params.kg1 ?? 0).toFixed(6)} KP=${(params.kp ?? 0).toFixed(6)} KVB=${(params.kvb ?? 0).toFixed(6)} KG2=${(params.kg2 ?? 0).toFixed(6)} A=${(params.a ?? 0).toFixed(6)} ALPHAS=${(params.alphaS ?? 0).toFixed(6)} BETA=${(params.beta ?? 0).toFixed(6)} ALPHA=${alpha.toFixed(6)}${params.secondaryEmission ? ` S=${(params.s ?? 0).toFixed(6)} ALPHAP=${(params.alphaP ?? 0).toFixed(6)} LAMBDA=${(params.lambda ?? 0).toFixed(6)} V=${(params.v ?? 0).toFixed(6)} W=${(params.w ?? 0).toFixed(6)}` : ''} CCG=${tube.ccg1 || 0} CCS=${tube.ccg2 || 0} CGS=${tube.cg1g2 || 0} CGP=${tube.cg1p || 0} CCP=${tube.ccp || 0} RGI=2000`,
            `.ENDS`
        ].join('\n');
    }
}
