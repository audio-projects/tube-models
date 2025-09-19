define(['models/ipk'], function(ipk) {
	'use strict';

	return function(initial, inflectionPoints, egOffset, trace) {
		// initialize trace if needed
		if (trace) {
			// estimates
			trace.estimates.secondaryEmission.s = {
				average: []
			};
		}
		// check we need to estimate S
		if (!initial.s) {
			// average
			var sum = 0;
			var count = 0;
			// loop inflectionPoints
			for (var i = 0; i < inflectionPoints.length; i++) {
				// current point
				var p = inflectionPoints[i];
				// ipk
				var ip = ipk(p.eg + egOffset, p.es, initial.kp, initial.mu, initial.kvb, initial.ex);
				// calculate Psec estimate @ Vamax
				var Psec = p.is * 1e-3 * initial.kg2 / ip - (1 + initial.alphaS * Math.exp(-initial.beta * p.epmax * Math.sqrt(Math.abs(initial.beta * p.epmax))));
				// calculate s
				var s = initial.kg2 * Psec / (2 * p.epmax * ip);
				if (s >= 0) {
					// update amounts for average
					sum += s;
					count++;
					// update trace
					if (trace)
						trace.estimates.secondaryEmission.s.average.push(s);
				}
			}
			// calculate initial
			initial.s = count > 0 ? sum / count : 0.05;
			// update trace
			if (trace)
				trace.estimates.secondaryEmission.s.s = initial.s;
		}
	};
});