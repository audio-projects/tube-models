/*
 * Iterative Methods for Optimization, Algorithm 3.3.6.
 */
function ntrust(x, f, tau, options) {
	// defaults
	var defaults = {
		kmax: 100,
		tolerance: 0.001,
		traceEnabled: true
	};
	// trace
	var trace = {
		residuals: [],
		iterations: 0
	};
	// function evaluation
	var fx = function(xi) {
		// evaluate function
		var fi = f(xi);
		// update trace if needed
		if (options.traceEnabled) {
			// update trace
			trace.residuals.push({
				x: xi,
				r: fi
			});
		}
		return fi;
	};
	// initialize xc
	var xc = x;
	// evaluate f(xc)
	var fc = fx(xc);
}
