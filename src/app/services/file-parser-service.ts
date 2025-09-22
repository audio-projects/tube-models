import { isUndefined } from 'mathjs';
import { File, Series, Point } from '../files';

const fileParserColumns = ['Point', 'Ia (mA)', 'Vg (V)', 'Va (V)', 'Vs (V)', 'Is (mA)', 'Vf (V)'];
const fileParserFields = ['index', 'ip', 'eg', 'ep', 'es', 'is', 'eh'];
const fileParserSeriesColumn = 'Curve';

const fileAnalysis = function (file: File): File {
    // initialize file
    file.measurementType = 'UNKNOWN';
    // helper functions
    const isConstant = function (mean: number, deviation: number) {
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
    // file statistics
    let flags = epFlag | egFlag | esFlag | ehFlag;
    let epFileMean = 0;
    let epFileM2 = 0;
    let esFileMean = 0;
    let esFileM2 = 0;
    let egFileMean = 0;
    let egFileM2 = 0;
    let ehFileMean = 0;
    let ehFileM2 = 0;
    let fn = 0;
    // screen current
    let isSum = 0;
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
            // update isSum
            isSum += point.is ?? 0;
        }
        // ep mean, variance and standard deviation
        const epVariance = epM2 / (n - 1);
        const epDeviation = Math.sqrt(epVariance);
        const epConstant = isConstant(epMean, epDeviation);
        if (epConstant)
            series.ep = epMean;
        else
            flags = flags & ~epFlag;
        // es mean, variance and standard deviation
        const esVariance = esM2 / (n - 1);
        const esDeviation = Math.sqrt(esVariance);
        const esConstant = isConstant(esMean, esDeviation);
        if (esConstant)
            series.es = esMean;
        else
            flags = flags & ~esFlag;
        // eg mean, variance and standard deviation
        const egVariance = egM2 / (n - 1);
        const egDeviation = Math.sqrt(egVariance);
        const egConstant = isConstant(egMean, egDeviation);
        if (egConstant)
            series.eg = egMean;
        else
            flags = flags & ~egFlag;
        // eh mean, variance and standard deviation
        const ehVariance = ehM2 / (n - 1);
        const ehDeviation = Math.sqrt(ehVariance);
        const ehConstant = isConstant(ehMean, ehDeviation);
        if (ehConstant)
            series.eh = ehMean;
        else
            flags = flags & ~ehFlag;
    }
    // ep mean, variance and standard deviation
    const epFileVariance = epFileM2 / (fn - 1);
    const epFileDeviation = Math.sqrt(epFileVariance);
    const epFileConstant = isConstant(epFileMean, epFileDeviation);
    // es mean, variance and standard deviation
    const esFileVariance = esFileM2 / (fn - 1);
    const esFileDeviation = Math.sqrt(esFileVariance);
    const esFileConstant = isConstant(esFileMean, esFileDeviation);
    // eg mean, variance and standard deviation
    const egFileVariance = egFileM2 / (fn - 1);
    const egFileDeviation = Math.sqrt(egFileVariance);
    const egFileConstant = isConstant(egFileMean, egFileDeviation);
    // eh mean, variance and standard deviation
    const ehFileVariance = ehFileM2 / (fn - 1);
    const ehFileDeviation = Math.sqrt(ehFileVariance);
    const ehFileConstant = isConstant(ehFileMean, ehFileDeviation);
    // check eh is constant
    if ((flags & ehFlag) !== 0 && ehFileConstant) {
        // check es is constant
        if ((flags & esFlag) !== 0 && esFileConstant) {
            // check eg is constant in series and ep is variable
            if ((flags & egFlag) !== 0 && !egFileConstant && !epFileConstant) {
                // check screen current
                if (isSum !== 0) {
                    // I(Va, Vg) with Vs, Vh constant
                    file.measurementType = 'IP_EP_EG_VS_VH';
                    file.es = esFileMean;
                    file.eh = ehFileMean;
                }
                else {
                    // I(Va, Vg) with Vh constant
                    file.measurementType = 'IP_EP_EG_VH';
                    file.eh = ehFileMean;
                }
            }
            else if ((flags & epFlag) !== 0 && !epFileConstant && !egFileConstant) {
                // check screen current
                if (isSum !== 0) {
                    // I(Vg, Va) with Vs, Vh constant
                    file.measurementType = 'IP_EG_EP_VS_VH';
                    file.es = esFileMean;
                    file.eh = ehFileMean;
                }
                else {
                    // I(Vg, Va) with Vh constant
                    file.measurementType = 'IP_EG_EP_VH';
                    file.eh = ehFileMean;
                }
            }
        }
        else if ((flags & epFlag) !== 0 && epFileConstant) {
            // check eg is constant in series
            if ((flags & egFlag) !== 0 && !egFileConstant && !esFileConstant) {
                // I(Vs, Vg) with Va, Vh constant
                file.measurementType = 'IP_ES_EG_VA_VH';
                file.ep = epFileMean;
                file.eh = ehFileMean;
            }
        }
        else if ((flags & egFlag) !== 0 && egFileConstant) {
            // check es is constant in series
            if ((flags & esFlag) !== 0 && !esFileConstant && !epFileConstant) {
                // I(Va, Vs) with Vg, Vh constant
                file.measurementType = 'IP_EP_ES_VG_VH';
                file.eg = egFileMean;
                file.eh = ehFileMean;
            }
        }
        else {
            // check es=ep
            if (isEquivalent(epFileMean, esFileMean)) {
                // check ep is constant in series
                if ((flags & epFlag) !== 0 && !epFileConstant && !egFileConstant) {
                    // I(Vg, Va=Vs) with Vh constant
                    file.measurementType = 'IP_EG_EPES_VH';
                    file.eh = ehFileMean;
                }
                else if ((flags & egFlag) !== 0 && !egFileConstant && !epFileConstant) {
                    // I(Va=Vs, Vg) with Vh constant
                    file.measurementType = 'IP_EPES_EG_VH';
                    file.eh = ehFileMean;
                }
            }
        }
    }
    else {
        // check es is constant
        if ((flags & esFlag) !== 0 && esFileConstant) {
            // check ep is constant
            if ((flags & epFlag) !== 0 && epFileConstant) {
                // I(Vh, Vg) with Va, Vs constant
                file.measurementType = 'IP_EH_EG_VA_VS';
                file.ep = epFileMean;
                file.es = esFileMean;
            }
            else if ((flags & egFlag) !== 0 && egFileConstant) {
                // I(Vh, Va) with Vg, Vs constant
                file.measurementType = 'IP_EH_EP_VG_VS';
                file.eg = egFileMean;
                file.es = esFileMean;
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
            egOffset: 0 // Initialize egOffset to 0 for new files
        };
        // analyze file
        return fileAnalysis(file);
    }
    return undefined;
};
