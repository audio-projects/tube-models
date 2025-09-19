define(['estimates/estimateKg2'], function(estimateKg2) {
	'use strict';

	return function(initial, files, maxW, egOffset, trace) {
		// initialize trace
		if (trace) {
			// estimates
			trace.estimates = trace.estimates || {};
		}
		// estimate kg2
		estimateKg2(initial, files, maxW, egOffset, trace);
		// return estimates (for Koren pentode models we use a hardcoded KVB=100)
		return {
			mu: initial.mu,
			kg1: initial.kg1,
			kp: initial.kp,
			ex: initial.ex,
			kvb: 100,
			kg2: initial.kg2
		};
	};
});