function jacobian2(f, x, fx, cd) {
	// check fx was provided
	if (!fx)
		fx = f(x);
	// number of variables
	var n = x.dimensions();
	// number of functions
	var m = fx.dimensions();
	// initialize jacobian
	var jac = [];
	for (var i = 0; i < m; i++)
		jac[i] = [];
	// check central difference calculation is necessary (more expensive calculation, but produces better approximation)
	if (cd) {
		// initialize delta
		var delta = 0.5e-7;
		// 1/delta (optimization)
		var d = 1 / delta * 2;
		// loop variables
		for (var i = 0; i < n; i++) {
			// initialize xd
			var xd0 = [];
			var xd1 = [];
			for (var k = 0; k < n; k++) {
				xd0[k] = (k == i) ? x.e(k + 1) - delta : x.e(k + 1);
				xd1[k] = (k == i) ? x.e(k + 1) + delta : x.e(k + 1);
			}
			// evaluate f(xd1) - f(xd0)
			var h = f($V(xd1)).subtract(f($V(xd0)));
			// loop functions
			for (var k = 0; k < m; k++)
				jac[k][i] = h.e(k + 1) * d;
		}
	}
	else {
		// initialize delta
		var delta = 1.0e-7;
		// 1/delta (optimization)
		var d = 1 / delta;
		// loop variables
		for (var i = 0; i < n; i++) {
			// initialize xd
			var xd = [];
			for (var k = 0; k < n; k++)
				xd[k] = (k == i) ? x.e(k + 1) + delta : x.e(k + 1);
			// evaluate f(xd) - f(x)
			var h = f($V(xd)).subtract(fx);
			// loop functions
			for (var k = 0; k < m; k++)
				jac[k][i] = h.e(k + 1) * d;
		}
	}
	return $M(jac);
}

/*
 * Computes a forward difference Hessian F''(x).
 *
 * x: point, column vector f: function g: gradient at x, column vector d: difference increment, optional (default = 1.0e-6)
 */
function hessian(x, f, g, d) {
	if (!d)
		d = 1.0e-6;
	// number of variables
	var n = x.dimensions();
	// loop variables
	for (var j = 0; j < n; j++) {
		// direction
		var direction = [];
		for (var k = 0; k < n; k++)
			direction[k] = (k == j) ? d : 0;
		// delta
		var delta = x.add(direction);
		// evaluate function in delta
		var fd = f(delta);
		// compute gradient
	}
}