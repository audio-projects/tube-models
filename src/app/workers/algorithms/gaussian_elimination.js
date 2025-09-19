function gaussian_elimination(matrix) {
	// make sure matrix is an array
	if (isArray(matrix)) {
		// rows
		var rows = matrix.length;
		var columns = rows > 0 ? matrix[0].length : 0;
		if (rows > 0 && columns > 0) {
			// loop columns
			for (var k = 0; k < Math.min(columns, rows) - 1; k++) {
				// row with maximum value in column k
				var row = find_max(k, rows, matrix);
				if (matrix[row][k] == 0)
					throw 'Matrix is Singular';
				// swap rows if needed
				if (k != row) {
					var tmp = matrix[k];
					matrix[k] = matrix[row];
					matrix[row] = tmp;
				}
				// process rows below pivot
				for (var i = k + 1; i < rows; i++) {
					// multiplier to apply to all columns in current row
					var multiplier = matrix[i][k] / matrix[k][k];
					// process columns in current row
					for (var j = k + 1; j < columns; j++) {
						// update matrix
						matrix[i][j] = matrix[i][j] - matrix[k][j] * multiplier;
					}
					// fill lower triangular matrix with zeros
					matrix[i][k] = 0.0;
				}
			}
			var ok = matrix;
		}
		else
			throw 'Invalid Matrix, it should be an MxN matrix';
	}
	else
		throw 'Argument must be a MxN matrix';
}

function find_max(k, rows, matrix) {
	// some variables
	var index = k;
	var max = 0;
	// find pivot for column k
	for (var i = k; i < rows; i++) {
		if (Math.abs(matrix[i][k]) > max) {
			index = i;
			max = Math.abs(matrix[i][k]);
		}
	}
	return index;
}

function isArray(obj) {
	return toString.call(obj) === '[object Array]';
}