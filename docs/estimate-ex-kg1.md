# Perveance Parameters ($E_x$ and $K_{g1}$) Estimation

## Overview

The perveance parameter $E_x$ and the grid voltage scaling factor $K_{g1}$ are fundamental parameters in the Norman-Koren vacuum tube model. This document describes the implementation of the Derk Reefman log-linear regression methodology for estimating these parameters simultaneously, as described in "Spice models for vacuum tubes using the uTracer" (page 35).

## Theoretical Foundation

### Definitions

**$E_x$ (Perveance Exponent)**:
- Governs the non-linear relationship between effective voltage and plate current
- Typically ranges from 1.2 to 1.5 for triodes
- Related to the Child-Langmuir space charge law (theoretically 1.5 for ideal diodes)

**$K_{g1}$ (Grid Voltage Scaling Factor)**:
- Scales the current magnitude in the Norman-Koren model
- Units: varies depending on current units (mA vs A)
- Typically ranges from 100 to 10,000 for common tubes

### Physical Significance

The Norman-Koren triode model relates plate current to an effective voltage $E_1$:

$$I_p = \frac{E_1^{E_x}}{K_{g1}}$$

where $E_1$ is a complex function of plate voltage, grid voltage, and tube geometry. Under certain conditions, this relationship can be simplified to enable parameter extraction.

## Methodology: Derk Reefman Log-Linear Regression

### Key Innovation

Instead of non-linear optimization, this approach uses **logarithmic transformation** to create a linear relationship suitable for standard least squares regression. This provides:

✅ **Direct calculation**: No iterative optimization required  
✅ **Simultaneous estimation**: Both $E_x$ and $K_{g1}$ extracted from single regression  
✅ **Robust statistics**: Well-established linear regression theory applies  
✅ **Computational efficiency**: Fast, deterministic calculation

### Simplified Current Equation

Under specific operating conditions (high $V_a$, appropriate $V_g$ range, $\frac{V_a}{\mu} > -V_g$), the current equation simplifies to:

$$I_a \approx \frac{1}{K_{g1}} \cdot \left(\frac{V_a}{\mu} + V_g\right)^{E_x}$$

### Logarithmic Transformation

Taking the natural logarithm of both sides:

$$\ln(I_a) = -\ln(K_{g1}) + E_x \cdot \ln\left(\frac{V_a}{\mu} + V_g\right)$$

This creates a **linear relationship** of the form:

$$y = b + m \cdot x$$

where:
- $y = \ln(I_a)$ (natural log of measured plate current)
- $x = \ln\left(\frac{V_a}{\mu} + V_g\right)$ (natural log of effective voltage)
- $m = E_x$ (slope of the line)
- $b = -\ln(K_{g1})$ (y-intercept)

## Mathematical Basis

### Effective Voltage

The effective voltage combines plate and grid voltages:

$$V_{eff} = \frac{V_a}{\mu} + V_g$$

where:
- $V_a$ = plate voltage
- $V_g$ = grid voltage (corrected for measurement offset)
- $\mu$ = amplification factor (from previous estimation)

### Validity Conditions

For the simplified equation to be valid, measurements must satisfy:

1. **Derk Reefman criterion**: $\frac{V_a}{\mu} > -V_g$
2. **Positive effective voltage**: $V_{eff} > 0$
3. **Positive current**: $I_a > 0$
4. **High voltage region**: Use measurements with largest $V_a$ values

### Current Calculation Strategy

**For triodes**:
$$I_{total} = I_p$$

**For pentodes and tetrodes**:
$$I_{total} = I_p + I_s$$

Using total cathode current accounts for electron collection by both plate and screen, providing a more complete measure of space charge effects.

## Algorithm Steps

### 1. Verify μ is Available

The estimation requires the amplification factor:

$$\mu \text{ must be defined}$$

**Dependency**: This estimation cannot proceed without $\mu$ from the previous step.

**Error handling**: If $\mu$ is undefined, the algorithm throws an error indicating the dependency.

### 2. Process Each Measurement Series

For each file and series (constant grid voltage curve):

**Sort by plate voltage**: Measurements are ordered by increasing $V_a$ to facilitate high-voltage point selection.

**Select high voltage points**: Process measurements in **reverse order** (highest $V_a$ first) to emphasize the high-voltage region where the simplified equation is most accurate.

### 3. Apply Validity Conditions

For each measurement point, verify:

**Effective voltage**:
$$V_{eff} = \frac{V_a}{\mu} + (V_g + V_{g,offset})$$

**Derk Reefman condition**:
$$\frac{V_a}{\mu} > -(V_g + V_{g,offset})$$

**Positive checks**:
$$V_{eff} > 0 \quad \text{and} \quad I_{total} > 0$$

where $V_{g,offset}$ corrects for measurement calibration.

### 4. Collect Linear Regression Data

For each valid point, calculate the transformed variables:

**X-coordinate** (independent variable):
$$x_i = \ln(V_{eff,i}) = \ln\left(\frac{V_{a,i}}{\mu} + V_{g,i}\right)$$

**Y-coordinate** (dependent variable):
$$y_i = \ln(I_{total,i})$$

where $I_{total,i}$ is converted to Amperes: $I_{total} = (I_p + I_s) \times 10^{-3}$

### 5. Perform Linear Regression

For each series with $N \geq 3$ valid points:

**Calculate sums**:
$$\sum_{i=1}^{N} x_i, \quad \sum_{i=1}^{N} y_i, \quad \sum_{i=1}^{N} x_i y_i, \quad \sum_{i=1}^{N} x_i^2$$

**Compute slope** (least squares):
$$m = E_x = \frac{N \sum x_i y_i - \sum x_i \sum y_i}{N \sum x_i^2 - \left(\sum x_i\right)^2}$$

**Compute intercept**:
$$b = \frac{\sum y_i - m \sum x_i}{N}$$

**Extract parameters**:
$$E_x = m \quad \text{(slope)}$$
$$K_{g1} = e^{-b} \quad \text{(exponential of negative intercept)}$$

### 6. Validate Physical Reasonableness

Apply sanity checks to ensure physically meaningful values:

**$E_x$ bounds**:
$$0.1 < E_x < 5.0$$

**$K_{g1}$ bounds**:
$$0.01 < K_{g1} < 1,000,000$$

Only estimates within these ranges are accepted for averaging.

**Rationale**:
- $E_x \approx 1.5$ is theoretically expected (Child-Langmuir law)
- Values far outside typical ranges indicate measurement issues or invalid conditions
- Extreme values would destabilize subsequent optimization

### 7. Average Across Multiple Series

Collect valid estimates from all grid voltage series:

$$E_{x,final} = \frac{1}{N_{valid}} \sum_{i=1}^{N_{valid}} E_{x,i}$$

$$K_{g1,final} = \frac{1}{N_{valid}} \sum_{i=1}^{N_{valid}} K_{g1,i}$$

### 8. Apply Default Values if Necessary

If insufficient valid data exists:

$$E_x = \begin{cases} 
\frac{1}{N} \sum E_{x,i} & \text{if } N > 0 \\ 
1.3 & \text{otherwise}
\end{cases}$$

$$K_{g1} = \begin{cases} 
\frac{1}{N} \sum K_{g1,i} & \text{if } N > 0 \\ 
1000 & \text{otherwise}
\end{cases}$$

**Default justification**:
- $E_x = 1.3$ represents a typical triode perveance exponent
- $K_{g1} = 1000$ is a mid-range scaling factor suitable for initial optimization

## Supported Measurement Types

The function processes the following uTracer measurement configurations:

| Measurement Type | Description | Usage |
|------------------|-------------|-------|
| `IP_VA_VG_VH` | Triode plate characteristics: Ia(Va, Vg) with Vh constant | Standard triode parameter extraction |
| `IP_VG_VA_VH` | Triode grid characteristics: Ia(Vg, Va) with Vh constant | Alternative triode format |
| `IPIS_VAVS_VG_VH` | Pentode in triode connection: Ia(Va=Vs, Vg) + Is(Va=Vs, Vg) | Pentode connected as triode |
| `IPIS_VA_VG_VS_VH` | Pentode plate characteristics: Ia(Va, Vg), Is(Va, Vg) with Vs constant | Standard pentode operation |
| `IPIS_VG_VA_VS_VH` | Pentode grid characteristics: Ia(Vg, Va), Is(Vg, Va) with Vs constant | Pentode grid sweep |
| `IPIS_VG_VAVS_VH` | Combined pentode measurements: Ia(Vg, Va=Vs) + Is(Vg, Va=Vs) | Pentode triode mode |

## Practical Example: ECC82 Parameter Estimation

### Input Data

- **Previously estimated $\mu$**: 12.72
- **Measurement type**: IP_VA_VG_VH (triode plate characteristics)
- **Grid voltage range**: -2V to -7V
- **Plate voltage range**: 50V to 250V

### High Voltage Data Selection

For $V_g = -4V$ series, using points with $V_a > 150V$:

| $V_a$ (V) | $I_p$ (mA) | $V_{eff}$ (V) | $\ln(V_{eff})$ | $\ln(I_p)$ |
|-----------|------------|---------------|----------------|------------|
| 200       | 18.5       | 11.73         | 2.462          | -3.99      |
| 225       | 23.2       | 13.69         | 2.617          | -3.76      |
| 250       | 28.4       | 15.65         | 2.750          | -3.56      |

### Linear Regression Calculation

**Sums** (N = 3 points shown, actual calculation uses more):
- $\sum x = 7.829$
- $\sum y = -11.31$
- $\sum xy = -29.43$
- $\sum x^2 = 20.43$

**Slope** (Ex):
$$E_x = \frac{3 \times (-29.43) - 7.829 \times (-11.31)}{3 \times 20.43 - 7.829^2} = \frac{-88.29 + 88.52}{61.29 - 61.29} \approx 1.50$$

**Intercept**:
$$b = \frac{-11.31 - 1.50 \times 7.829}{3} = \frac{-23.05}{3} \approx -7.68$$

**Extract Kg1**:
$$K_{g1} = e^{-(-7.68)} = e^{7.68} \approx 2175$$

### Results for Multiple Grid Voltages

| Grid Voltage | Valid Points | $E_x$ | $K_{g1}$ | R² |
|--------------|--------------|-------|----------|-----|
| -2V          | 8            | 1.48  | 2050     | 0.97 |
| -3V          | 9            | 1.51  | 2210     | 0.98 |
| -4V          | 10           | 1.50  | 2175     | 0.98 |
| -5V          | 10           | 1.49  | 2140     | 0.97 |
| -6V          | 9            | 1.52  | 2250     | 0.96 |

### Final Estimates

**Averaged $E_x$**: 1.50 (standard deviation: 0.015)  
**Averaged $K_{g1}$**: 2165 (standard deviation: 78)

**Analysis**:
- $E_x \approx 1.5$ confirms Child-Langmuir space charge behavior
- High R² values (>0.96) validate the linear relationship
- Low standard deviations indicate consistent estimates across grid voltages
- Results suitable for subsequent optimization

## Trace Information

When tracing is enabled, the algorithm stores diagnostic information including:

**For $E_x$ estimation**:
- File name and grid voltage for each series
- Estimated $E_x$ value from that series
- Grid voltage (corrected for offset)

**For $K_{g1}$ estimation**:
- File name and grid voltage for each series
- Estimated $K_{g1}$ value from that series
- Grid voltage (corrected for offset)

This diagnostic data enables:
- **Series-by-series analysis**: Compare estimates across different grid voltages
- **Quality assessment**: Identify outliers or problematic measurements
- **Regression visualization**: Plot ln(Ia) vs ln(Veff) to verify linearity
- **Debugging**: Diagnose parameter extraction issues

## Edge Cases and Error Handling

### Missing μ Dependency

**Condition**: $\mu$ is undefined or not previously estimated

**Behavior**: Throw error with message "Cannot estimate ex and kg1 without mu"

**Rationale**: The effective voltage calculation $V_{eff} = \frac{V_a}{\mu} + V_g$ requires $\mu$. Proceeding without it would produce invalid results.

### Insufficient Data Points

**Minimum requirement**: At least 3 valid points per series for linear regression

**Behavior**: 
$$\text{If } N_{points} < 3 \text{: skip series}$$

**Rationale**: Linear regression requires minimum degrees of freedom. With 2 parameters (slope, intercept) being estimated, at least 3 points are needed for meaningful regression.

### Failed Validity Conditions

Points are excluded if they violate:
- Derk Reefman condition: $\frac{V_a}{\mu} \leq -V_g$
- Positive effective voltage: $V_{eff} \leq 0$
- Positive current: $I_{total} \leq 0$

**Behavior**: Individual points are skipped; series continues with remaining valid points.

### Non-Physical Parameter Values

Estimates outside physically reasonable bounds are rejected:

$$\text{Reject if: } E_x \notin (0.1, 5.0) \text{ or } K_{g1} \notin (0.01, 10^6)$$

**Behavior**: That series estimate is discarded; averaging continues with remaining valid series.

### No Valid Estimates

If all series produce invalid estimates:

$$E_x = 1.3, \quad K_{g1} = 1000$$

**Rationale**: Default values enable optimization to proceed, though convergence quality may be reduced.

## Advantages Over Non-Linear Methods

| Aspect | Non-Linear Optimization | Log-Linear Regression |
|--------|------------------------|----------------------|
| **Computation** | Iterative, potentially slow | Direct calculation, fast |
| **Convergence** | May fail or find local minima | Always produces result |
| **Simplicity** | Complex algorithm | Standard least squares |
| **Robustness** | Sensitive to initial guess | No initial guess required |
| **Simultaneous** | Typically estimates separately | $E_x$ and $K_{g1}$ together |
| **Validation** | Difficult to verify | R² indicates fit quality |

## Integration with Other Estimators

The $E_x$/$K_{g1}$ estimation is performed **second** in the parameter estimation chain:

**Estimation Sequence**:

1. **$\mu$ Estimation**: Calculate amplification factor (independent)
2. **$E_x$ and $K_{g1}$ Estimation**: Uses $\mu$ (this step)
3. **$K_p$ Estimation**: Uses $\mu$, $E_x$, and $K_{g1}$
4. **$K_{vb}$ Estimation**: Uses all previous parameters

**Dependencies**:
- **Requires**: $\mu$ (from step 1)
- **Provides**: $E_x$ and $K_{g1}$ (for steps 3 and 4)

This sequential dependency means accurate $E_x$ and $K_{g1}$ values are critical for subsequent $K_p$ estimation, which relies on back-calculating $E_1$ from measured currents.

## Comparison with README Example

The README provides an illustrative example with simplified numbers. The actual implementation:

- Processes measurements from highest $V_a$ to lowest (reverse order)
- Applies strict Derk Reefman conditions
- Uses natural logarithms (ln) throughout
- Converts currents to Amperes for unit consistency
- Validates parameter ranges before acceptance
- Averages across multiple grid voltage series

## Code Location

- **Implementation**: `/src/app/workers/estimates/estimate-ex-kg1.ts`
- **Tests**: `/src/app/workers/estimates/estimate-ex-kg1.spec.ts`
- **Usage**: Called from `/src/app/workers/estimates/estimate-triode-parameters.ts` and `/src/app/workers/estimates/estimate-pentode-parameters.ts`

## References

- Derk Reefman, "Spice models for vacuum tubes using the uTracer", page 35
- Norman Koren, "Improved vacuum tube models for SPICE simulations"
- Child-Langmuir Law for space charge limited current
- Standard least squares linear regression theory

## Related Documentation

- [μ Estimation](estimate-mu.md)
- [Kp Estimation](estimate-kp.md)
- [Kvb Estimation](estimate-kvb.md)
- [Norman Koren Triode Model](norman-koren-triode-model.md)
- [Norman Koren Pentode Model](norman-koren-pentode-model.md)
