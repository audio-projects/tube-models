define(['models/derkEModel', 'models/ipk', 'algorithms/powell', 'estimates/estimateKg2', 'estimates/estimateA', 'estimates/estimateSecondaryEmissionParameters', 'estimates/estimateDerkES'], function(derkEModel, ipk, powell, estimateKg2, estimateA, estimateSecondaryEmissionParameters, estimateDerkES) {
	'use strict';

	return function(initial, files, maxW, secondaryEmission, egOffset, trace) {
		// initialize trace
		if (trace) {
			// estimates
			trace.estimates = trace.estimates || {};
			trace.estimates.beta = {
				average: []
			};
			trace.estimates.alphaS = {
				average: []
			};
		}
		// estimate pentode parameters
		estimateKg2(initial, files, maxW, egOffset, trace);
		// estimate a
		estimateA(initial, files, maxW, egOffset, trace);
		// check we need to estimate parameters
		if (!initial.alphaS || !initial.beta) {
			// sums
			var aSum = 0;
			var bSum = 0;
			// count
			var count = 0;
			// least squares function
			var leastSquares = function(x) {
				// slope and interception
				var a = x[0];
				var b = x[1];
				// result
				var r = 0;
				// number of points to use
				var c = 0;
				// loop points
				for (var k = 0; k < series.points.length && c < 10 ; k++) {
					// current point
					var p = series.points[k];
					// check point meets power criteria
					if ((p.ip + p.is) * p.ep * 1e-3 < maxW) {
						// ipk
						var ip = ipk(p.eg + egOffset, p.es, initial.kp, initial.mu, initial.kvb, initial.ex);
						// difference
						var d = -Math.log(p.is * 1e-3 * initial.kg2 / ip - 1) + a * Math.pow(p.ep, 1.5) + b;
						// least squares
						r += d * d;
						// update points used
						c++;
					}
				}
				return r;
			};
			// loop all files
			for (var i = 0; i < files.length; i++) {
				// current file
				var file = files[i];
				// check measurement type (ep is in the X-axis), do not use triode files
				if (file.measurementType === 'IP_EP_EG_VS_VH' || file.measurementType === 'IP_EP_ES_VG_VH') {
					// loop series
					for (var j = 0; j < file.series.length; j++) {
						// current series
						var series = file.series[j];
						// series points must be sorted by the X axis (EP)
						series.points.sort(function(p1, p2) {
							return p1.ep - p2.ep;
						});
						// powell optimization options
						var options = {
							iterations: 500,
							traceEnabled: false,
							relativeThreshold: 1e-4
						};
						// optimize leastSquares
						var result = powell([5, 0.05], leastSquares, options);
						// check result
						if (result.converged) {
							// slope and interception
							var a = result.x[0];
							var b = result.x[1];
							// update trace
							if (trace) {
								trace.estimates.beta.average.push({
									file: file.name,
									a: a,
									b: b,
									eg: series.eg + egOffset
								});
								trace.estimates.alphaS.average.push({
									file: file.name,
									a: a,
									b: b,
									eg: series.eg + egOffset
								});
							}
							// append to sums
							aSum += a;
							bSum += b;
							// increment count
							count++;
						}
					}
				}
			}
			// calculate estimates
			initial.alphaS = count > 0 ? Math.exp(bSum / count) : 5;
			initial.beta = count > 0 ? -Math.pow(aSum * aSum / (count * count), 1 / 3) : 0.001;
		}
		// check we need to process secondary emission
		if (secondaryEmission)
			estimateSecondaryEmissionParameters(initial, files, egOffset, derkEModel, estimateDerkES, trace);
	};
});