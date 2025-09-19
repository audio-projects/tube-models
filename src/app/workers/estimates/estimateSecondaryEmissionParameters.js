define(['algorithms/powell'], function(powell) {
	'use strict';

	return function(initial, files, egOffset, currents, estimateS, trace) {
		// initialize trace if needed
		if (trace) {
			// estimates
			trace.estimates = trace.estimates || {};
			trace.estimates.secondaryEmission = {
				inflectionPoints: []
			};
		}
		// lambda (lambda = mu)
		initial.lambda = initial.lambda || initial.mu;
		// alphaP
		initial.alphaP = initial.alphaP || 0.05;
		// estimate v, w & s if needed
		if (!initial.v || !initial.w || !initial.s) {
			// inflection & local maximum points
			var points = [];
			// loop all files
			for (var i = 0; i < files.length; i++) {
				// current file
				var file = files[i];
				// check measurement type (ep is in the X-axis and es is constant), do not use triode files
				if (file.measurementType === 'IP_EP_EG_VS_VH') {
					// loop series
					for (var j = 0; j < file.series.length; j++) {
						// current series
						var series = file.series[j];
						// series points must be sorted by the X axis (EP)
						series.points.sort(function(p1, p2) {
							return p1.ep - p2.ep;
						});
						// check we have valid points
						if (series.points.length > 0) {
							// inflection point detection
							var lastSlope;
							// initialize points
							var lp = series.points[0];
							// loop points (skip first, use points with low ep)
							for (var k = 1; k < series.points.length ; k++) {
								// current point
								var p = series.points[k];
								// calculate slope
								var slope = (p.is - lp.is) / (p.ep - lp.ep);
								// detect inflection point (change in slope sign)
								if (slope * lastSlope <= 0) {
									// store point (last point since this is the place slope changed)
									points.push(lp);
									// exit loop
									break;
								}
								// detect local maximum (slope is increasing when ep is increasing, detect a decreasing slope)
								if (slope < lastSlope) {
									// store point (last point since this is the place slope changed)
									points.push(lp);
									// exit loop
									break;
								}
								// store slope
								lastSlope = slope;
								// update previous point
								lp = p;
							}
						}
					}
				}
			}
			// inflection points to use
			var inflectionPoints = [];
			// least squares
			var ls = function(x) {
				// Vamax
				var epmax = Math.abs(x[0]);
				// calculate screen current
				var is = currents(epmax, p.eg + egOffset, p.es, initial.kp, initial.mu, initial.kvb, initial.ex, initial.kg1, initial.kg2, initial.a, initial.alpha, initial.alphaS, initial.beta).is;
				// residual
				return (p.is - is) * (p.is - is);
			};
			// loop points
			for (var w = 0; w < points.length; w++) {
				// current point
				var point = points[w];
				// optimize leastSquares
				var r = powell([point.ep], ls, {
					iterations: 500,
					traceEnabled: false,
					relativeThreshold: 1e-4
				});
				// check result
				if (r.converged) {
					// epmax
					var epmax = Math.abs(r.x[0]);
					// check it is a valid value
					if (point.ep >= epmax) {
						// add to inflection points
						inflectionPoints.push({
							epmax: epmax,
							eg: point.eg,
							is: point.is,
							ip: point.ip,
							ep: point.ep,
							es: point.es
						});
					}
				}
			}
			// update trace
			if (trace)
				trace.estimates.secondaryEmission.inflectionPoints = inflectionPoints;
			// check we need to estimate v or w
			if (!initial.v || !initial.w) {
				// least squares function
				var leastSquares = function(x) {
					// get parameters
					var v = x[0];
					var w = x[1];
					// result
					var r = 0;
					// loop inflectionPoints
					for (var i = 0; i < inflectionPoints.length; i++) {
						// current point
						var p = inflectionPoints[i];
						// difference
						var d = -p.epmax + p.ip / initial.lambda - v * (p.eg + egOffset) - w;
						// update r
						r += d * d;
					}
					return r;
				};
				// optimize leastSquares
				var result = powell([0, 0], leastSquares, {
					iterations: 500,
					traceEnabled: false,
					relativeThreshold: 1e-4
				});
				// check result
				if (result.converged) {
					// set initial values
					initial.v = result.x[0];
					initial.w = result.x[1];
				}
				else {
					// set initial values
					initial.v = 0;
					initial.w = 0;
				}
				// update trace
				if (trace) {
					trace.estimates.secondaryEmission.v = Math.abs(initial.v);
					trace.estimates.secondaryEmission.w = Math.abs(initial.w);
				}
			}
			// estimate S
			estimateS(initial, inflectionPoints, egOffset, trace);
		}
	};
});