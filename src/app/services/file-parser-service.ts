import { isUndefined } from 'mathjs';
import { File, Series, Point } from '../files';

const fileParserColumns = ['Point', 'Ia (mA)', 'Vg (V)', 'Va (V)', 'Vs (V)', 'Is (mA)', 'Vf (V)'];
const fileParserFields = ['index', 'ip', 'eg', 'ep', 'es', 'is', 'eh'];
const fileParserSeriesColumn = 'Curve';

export const fileAnalysis = function (file: File): File {
    // initialize file
    file.measurementType = 'UNKNOWN';
    file.measurementTypeLabel = 'Unknown';
    // helper functions
    const isConstantValue = function (mean: number, deviation: number) {
        // deviation is less than 1% of mean value
        return Math.abs(deviation) <= Math.abs(mean * 0.01);
    };
    const isEquivalent = function (mean1: number, mean2: number) {
        return Math.abs(mean1 - mean2) <= mean1 * 0.01;
    };
    // some constants
    const epFlag = 1;
    const egFlag = 2;
    const esFlag = 4;
    const ehFlag = 8;
    const ipFlag = 16;
    const isFlag = 32;
    // file statistics
    let flags = epFlag | egFlag | esFlag | ehFlag | ipFlag | isFlag;
    let epFileMean = 0;
    let epFileM2 = 0;
    let esFileMean = 0;
    let esFileM2 = 0;
    let egFileMean = 0;
    let egFileM2 = 0;
    let ehFileMean = 0;
    let ehFileM2 = 0;
    let ipFileMean = 0;
    let ipFileM2 = 0;
    let isFileMean = 0;
    let isFileM2 = 0;
    // total points count
    let fn = 0;
    // loop series
    for (const series of file.series) {
        // valid points count
        let n = 0;
        // series statistics
        let epMean = 0;
        let epM2 = 0;
        let esMean = 0;
        let esM2 = 0;
        let egMean = 0;
        let egM2 = 0;
        let ehMean = 0;
        let ehM2 = 0;
        let ipMean = 0;
        let ipM2 = 0;
        let isMean = 0;
        let isM2 = 0;
        // loop points
        for (const point of series.points) {
            // increment counts
            n++;
            fn++;
            // update ep estatistics
            if (point.ep) {
                // series ep statistics
                const d1 = point.ep - epMean;
                epMean = epMean + d1 / n;
                epM2 = epM2 + d1 * (point.ep - epMean);
                // file ep statistics
                const df1 = point.ep - epFileMean;
                epFileMean = epFileMean + df1 / fn;
                epFileM2 = epFileM2 + df1 * (point.ep - epFileMean);
            }
            // update es statistics
            if (point.es) {
                // series es statistics
                const d2 = point.es - esMean;
                esMean = esMean + d2 / n;
                esM2 = esM2 + d2 * (point.es - esMean);
                // file es statistics
                const df2 = point.es - esFileMean;
                esFileMean = esFileMean + df2 / fn;
                esFileM2 = esFileM2 + df2 * (point.es - esFileMean);
            }
            // update eg statistics
            if (point.eg) {
                // series eg statistics
                const d3 = point.eg - egMean;
                egMean = egMean + d3 / n;
                egM2 = egM2 + d3 * (point.eg - egMean);
                // file eg statistics
                const df3 = point.eg - egFileMean;
                egFileMean = egFileMean + df3 / fn;
                egFileM2 = egFileM2 + df3 * (point.eg - egFileMean);
            }
            // update eh statistics
            if (point.eh) {
                // series eh statistics
                const d4 = point.eh - ehMean;
                ehMean = ehMean + d4 / n;
                ehM2 = ehM2 + d4 * (point.eh - ehMean);
                // file eh statistics
                const df4 = point.eh - ehFileMean;
                ehFileMean = ehFileMean + df4 / fn;
                ehFileM2 = ehFileM2 + df4 * (point.eh - ehFileMean);
            }
            // update ip statistics
            if (point.ip) {
                // series ip statistics
                const d5 = point.ip - ipMean;
                ipMean = ipMean + d5 / n;
                ipM2 = ipM2 + d5 * (point.ip - ipMean);
                // file ip statistics
                const df5 = point.ip - ipFileMean;
                ipFileMean = ipFileMean + df5 / fn;
                ipFileM2 = ipFileM2 + df5 * (point.ip - ipFileMean);
            }
            // update is statistics
            if (point.is) {
                // series is statistics
                const d6 = point.is - isMean;
                isMean = isMean + d6 / n;
                isM2 = isM2 + d6 * (point.is - isMean);
                // file is statistics
                const df6 = point.is - isFileMean;
                isFileMean = isFileMean + df6 / fn;
                isFileM2 = isFileM2 + df6 * (point.is - isFileMean);
            }
        }
        // ep mean, variance and standard deviation
        const epVariance = epM2 / (n - 1);
        const epDeviation = Math.sqrt(epVariance);
        const epConstant = isConstantValue(epMean, epDeviation);
        if (epConstant)
            series.ep = epMean;
        else
            flags = flags & ~epFlag;
        // es mean, variance and standard deviation
        const esVariance = esM2 / (n - 1);
        const esDeviation = Math.sqrt(esVariance);
        const esConstant = isConstantValue(esMean, esDeviation);
        if (esConstant)
            series.es = esMean;
        else
            flags = flags & ~esFlag;
        // eg mean, variance and standard deviation
        const egVariance = egM2 / (n - 1);
        const egDeviation = Math.sqrt(egVariance);
        const egConstant = isConstantValue(egMean, egDeviation);
        if (egConstant)
            series.eg = egMean;
        else
            flags = flags & ~egFlag;
        // eh mean, variance and standard deviation
        const ehVariance = ehM2 / (n - 1);
        const ehDeviation = Math.sqrt(ehVariance);
        const ehConstant = isConstantValue(ehMean, ehDeviation);
        if (ehConstant)
            series.eh = ehMean;
        else
            flags = flags & ~ehFlag;
        // ip mean, variance and standard deviation
        const ipVariance = ipM2 / (n - 1);
        const ipDeviation = Math.sqrt(ipVariance);
        const ipConstant = isConstantValue(ipMean, ipDeviation);
        if (ipConstant)
            series.ip = ipMean;
        else
            flags = flags & ~ipFlag;
        // is mean, variance and standard deviation
        const isVariance = isM2 / (n - 1);
        const isDeviation = Math.sqrt(isVariance);
        const isConstant = isConstantValue(isMean, isDeviation);
        if (isConstant)
            series.is = isMean;
        else
            flags = flags & ~isFlag;
    }
    // ep mean, variance and standard deviation
    const epFileVariance = epFileM2 / (fn - 1);
    const epFileDeviation = Math.sqrt(epFileVariance);
    const epFileConstant = isConstantValue(epFileMean, epFileDeviation);
    // es mean, variance and standard deviation
    const esFileVariance = esFileM2 / (fn - 1);
    const esFileDeviation = Math.sqrt(esFileVariance);
    const esFileConstant = isConstantValue(esFileMean, esFileDeviation);
    // eg mean, variance and standard deviation
    const egFileVariance = egFileM2 / (fn - 1);
    const egFileDeviation = Math.sqrt(egFileVariance);
    const egFileConstant = isConstantValue(egFileMean, egFileDeviation);
    // eh mean, variance and standard deviation
    const ehFileVariance = ehFileM2 / (fn - 1);
    const ehFileDeviation = Math.sqrt(ehFileVariance);
    const ehFileConstant = isConstantValue(ehFileMean, ehFileDeviation);
    // check "eh" is constant in file
    if ((flags & ehFlag) !== 0 && ehFileConstant) {
        // check "es" is constant in file
        if ((flags & esFlag) !== 0 && esFileConstant) {
            // check "eg" is constant in series and "ep" is variable
            if ((flags & egFlag) !== 0 && !egFileConstant && !epFileConstant) {
                // check screen current is present
                if (isFileMean !== 0) {
                    // Ia(Va, Vg), Is(Va, Vg) with Vs, Vh constant
                    file.measurementType = 'IPIS_EP_EG_VS_VH';
                    file.measurementTypeLabel = `Ia(Va, Vg), Is(Va, Vg) with Vs≈${esFileMean.toFixed(1)}V, Vh≈${ehFileMean.toFixed(1)}V`;
                    file.es = esFileMean;
                    file.eh = ehFileMean;
                }
                else {
                    // Ia(Va, Vg) with Vh constant
                    file.measurementType = 'IP_EP_EG_VH';
                    file.measurementTypeLabel = `Ia(Va, Vg) with Vh≈${ehFileMean.toFixed(1)}V`;
                    file.eh = ehFileMean;
                }
            }
            // check "ep" is constant in series and "eg" is variable
            else if ((flags & epFlag) !== 0 && !epFileConstant && !egFileConstant) {
                // check screen current is present
                if (isFileMean !== 0) {
                    // Ia(Vg, Va), Is(Vg, Va) with Vs, Vh constant
                    file.measurementType = 'IPIS_EG_EP_VS_VH';
                    file.measurementTypeLabel = `Ia(Vg, Va), Is(Vg, Va) with Vs≈${esFileMean.toFixed(1)}V, Vh≈${ehFileMean.toFixed(1)}V`;
                    file.es = esFileMean;
                    file.eh = ehFileMean;
                }
                else {
                    // Ia(Vg, Va) with Vh constant
                    file.measurementType = 'IP_EG_EP_VH';
                    file.measurementTypeLabel = `Ia(Vg, Va) with Vh≈${ehFileMean.toFixed(1)}V`;
                    file.eh = ehFileMean;
                }
            }
        }
        // check "ep" is constant in file
        else if ((flags & epFlag) !== 0 && epFileConstant) {
            // check "eg" is constant in series and "es" is variable
            if ((flags & egFlag) !== 0 && !egFileConstant && !esFileConstant) {
                // Ia(Vs, Vg), Is(Vs, Vg) with Vs, Vh constant
                file.measurementType = 'IPIS_ES_EG_VS_VH';
                file.measurementTypeLabel = `Ia(Vs, Vg), Is(Vs, Vg) with Va≈${epFileMean.toFixed(1)}V, Vh≈${ehFileMean.toFixed(1)}V`;
                file.ep = epFileMean;
                file.eh = ehFileMean;
            }
            // check "es" is constant in series and "eg" is variable
            else if ((flags & esFlag) !== 0 && !esFileConstant && !egFileConstant) {
                // Ia(Vg, Va), Is(Vg, Va) with Vs, Vh constant
                file.measurementType = 'IPIS_EG_ES_VP_VH';
                file.measurementTypeLabel = `Ia(Vg, Vs), Is(Vg, Vs) with Va≈${epFileMean.toFixed(1)}V, Vh≈${ehFileMean.toFixed(1)}V`;
                file.ep = epFileMean;
                file.eh = ehFileMean;
            }
        }
        // check "eg" is constant in file
        else if ((flags & egFlag) !== 0 && egFileConstant) {
            // check es is constant in series
            if ((flags & esFlag) !== 0 && !esFileConstant && !epFileConstant) {
                // I(Va, Vs) with Vg, Vh constant
                file.measurementType = 'IPIS_EP_ES_VG_VH';
                file.measurementTypeLabel = `Ia(Va, Vs), Is(Va, Vs) with Vg≈${egFileMean.toFixed(1)}V, Vh≈${ehFileMean.toFixed(1)}V`;
                file.eg = egFileMean;
                file.eh = ehFileMean;
            }
        }
        // check "ep" = "es" in file
        else if (isEquivalent(epFileMean, esFileMean)) {
            // check ep is constant in series
            if ((flags & epFlag) !== 0 && !epFileConstant && !egFileConstant) {
                // I(Vg, Va=Vs) with Vh constant
                file.measurementType = 'IPIS_EG_EPES_VH';
                file.measurementTypeLabel = `Ia(Vg, Va=Vs), Is(Vg, Va=Vs) with Vh≈${ehFileMean.toFixed(1)}V`;
                file.eh = ehFileMean;
            }
            // check eg is constant in series
            else if ((flags & egFlag) !== 0 && !egFileConstant && !epFileConstant) {
                // Ip(Va=Vs, Vg) with Vh constant
                file.measurementType = 'IPIS_EPES_EG_VH';
                file.measurementTypeLabel = `Ia(Va=Vs, Vg), Is(Va=Vs, Vg) with Vh≈${ehFileMean.toFixed(1)}V`;
                file.eh = ehFileMean;
            }
        }
    }
    return file;
};

export const fileParserService = function (name: string, text: string): File | undefined {
    // split data by end of lines
    const lines = text.split(/\r?\n|\r/g);
    // column positions
    const columnPositions: Record<string, number> = {};
    // series column position
    let seriesColumnIndex = -1;
    // verify we have valid data
    if (lines.length > 1) {
        // first line are the headers
        const headers = lines[0].split(/\s\s+/g);
        // loop header
        for (let j = 0; j < headers.length; j++) {
            // find the index of the current header in columns
            const index = fileParserColumns.indexOf(headers[j]);
            if (index !== -1) {
                // store column position
                columnPositions[fileParserFields[index]] = j;
            }
            else if (headers[j] == fileParserSeriesColumn) {
                // store series column position
                seriesColumnIndex = j;
            }
        }
        // series
        const series: Series[] = [];
        // series index
        const seriesIndex: Record<string, number> = {};
        // loop data
        for (let i = 1; i < lines.length; i++) {
            // split line
            const tokens = lines[i].split(/\s\s+/g);
            // check tokens
            if (tokens.length > fileParserFields.length) {
                // evaluate series column
                const s = tokens[seriesColumnIndex];
                let si = seriesIndex[s];
                // find series index
                if (isUndefined(si)) {
                    // set array index
                    si = seriesIndex[s] = series.length;
                    // initialize array
                    series.push({ eg: 0, points: [] });
                }
                // create new point
                const point: Record<string, number> = {};
                // current item is valid
                let valid = true;
                // loop fields
                for (let x = 0; valid && x < fileParserFields.length; x++) {
                    // find column position
                    const columnPositionsIndex = columnPositions[fileParserFields[x]];
                    if (isFinite(columnPositionsIndex)) {
                        // value
                        const value = parseFloat(tokens[columnPositionsIndex]);
                        if (isFinite(value)) {
                            // set item value
                            point[fileParserFields[x]] = value;
                        }
                        else {
                            // not a number
                            valid = false;
                        }
                    }
                }
                // check if point is valid
                if (valid) {
                    // add item to array
                    series[si].points.push(point as unknown as Point);
                }
            }
        }
        // create file
        const file: File = {
            name: name,
            series: series,
            measurementType: 'UNKNOWN',
            measurementTypeLabel: 'Unknown',
            egOffset: 0
        };
        // analyze file
        return fileAnalysis(file);
    }
    return undefined;
};
