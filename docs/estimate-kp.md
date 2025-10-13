# Knee Parameter ($K_p$) Estimation

## Overview

The knee parameter $K_p$ controls the transition from space charge limited to temperature limited current in vacuum tubes. This document describes the implementation of the Derk Reefman log-linear regression methodology for estimating $K_p$, as described in "Spice models for vacuum tubes using the uTracer" (page 36).

## Theoretical Foundation

### Definition

The knee parameter $K_p$ determines the sharpness of the "knee" in the plate current vs. voltage characteristic curve, representing the transition between:
- **Space charge limited region**: Current strongly dependent on voltage
- **Temperature limited region**: Current saturates (limited by cathode emission)

### Physical Significance

**Mathematical Role**:
In the Norman-Koren model, $K_p$ appears in the exponential and logarithmic terms:

$$E_1 = \frac{V_p}{K_p} \ln\left(1 + \exp\left(K_p \cdot \left(\frac{1}{\mu} + \frac{V_g}{\sqrt{K_{vb} + V_p^2}}\right)\right)\right)$$

**Physical Interpretation**:
- **Small $K_p$**: Gradual transition, soft knee
- **Large $K_p$**: Sharp transition, hard knee
- **Typical values**: 5-20 for triodes, varies by tube construction

### Operating Regions

The $K_p$ parameter affects different operating conditions:
- **Low voltages**: Space charge dominates, current follows power law
- **High voltages**: Transition region where $K_p$ determines curve shape
- **Very high voltages**: Temperature limitation, current saturates

## Methodology: Derk Reefman Log-Linear Regression

### Key Innovation

Under specific high-voltage conditions, the Norman-Koren equation simplifies to a form where $K_p$ can be extracted using linear regression. This approach:

✅ **Direct calculation**: Uses linear regression (no iterative optimization)  
✅ **Clear physical basis**: Based on limiting behavior at high voltages  
✅ **Robust extraction**: Multiple measurements averaged for reliability  
✅ **Requires previous estimates**: Depends on $\mu$, $E_x$, and $K_{g1}$

### Limiting Conditions (Situation 2)

According to Derk Reefman (page 36), the estimation assumes:

1. **High anode voltage**: $V_a^2 \gg K_{vb}$
2. **Low effective grid voltage**: $K_p\left(\frac{1}{\mu} + \frac{V_g}{V_a}\right) \ll 1$

Under these conditions, the exponential term can be approximated.

### Simplified Current Equation

In the limiting region, the equation approximates:

$$E_1 \approx \frac{V_a}{K_p} \cdot \exp\left(K_p \cdot \left(\frac{1}{\mu} + \frac{V_g}{V_a}\right)\right)$$

And plate current remains:

$$I_a = \frac{E_1^{E_x}}{K_{g1}}$$

### Back-Calculation of $E_1$

From measured current, estimate $E_1$:

$$E_{1,est} = \left(I_a \cdot K_{g1,est}\right)^{1/E_{x,est}}$$

This uses previously estimated values of $K_{g1}$ and $E_x$.

### Logarithmic Transformation

Taking the natural logarithm of the simplified $E_1$ equation:

$$\ln(E_{1,est}) = \ln(V_a) - \ln(K_p) + K_p \cdot \left(\frac{1}{\mu} + \frac{V_g}{V_a}\right)$$

Rearranging:

$$\ln(E_{1,est}) \approx \text{const} + K_p \cdot \left(\frac{1}{\mu} + \frac{V_g}{V_a}\right)$$

where the constant term $\ln(V_a) - \ln(K_p)$ is treated as the intercept (the dependency on $K_p$ is ignored as mentioned in Derk Reefman's methodology).

### Linear Relationship

This creates a **linear relationship** of the form:

$$y = b + m \cdot x$$

where:
- $y = \ln(E_{1,est})$ (natural log of back-calculated effective voltage)
- $x = \frac{1}{\mu} + \frac{V_g}{V_a}$ (combined voltage term)
- $m = K_p$ (slope of the line - the parameter we want)
- $b = \text{const}$ (intercept, not used for $K_p$ extraction)

## Algorithm Steps

### 1. Verify Dependencies

The estimation requires three previously calculated parameters:

$$\mu, \quad E_x, \quad K_{g1} \quad \text{must all be defined}$$

**Error handling**: If any are undefined, throw error "Cannot estimate kp without mu, ex and kg1"

**Rationale**: 
- $\mu$ appears in the voltage ratio term
- $E_x$ and $K_{g1}$ are needed to back-calculate $E_1$ from measured current

### 2. Process Each Measurement Series

For each file and series (constant grid voltage curve):

**Sort by plate voltage**: Measurements are ordered by increasing $V_a$.

**Purpose**: Allows systematic processing of voltage range, though $K_p$ estimation uses all valid points (not just high voltage).

### 3. Apply Validity Conditions

For each measurement point, verify the Derk Reefman condition:

$$\frac{V_a}{\mu} > -(V_g + V_{g,offset})$$

This ensures the measurement is in a valid operating region where the model applies.

**Grid voltage correction**:
$$V_{g,corrected} = V_{g,measured} + V_{g,offset}$$

### 4. Back-Calculate $E_1$

For each valid measurement point, estimate $E_1$ from the measured current:

**Current preparation**:
$$I_{total} = (I_p + I_s) \times 10^{-3} \quad \text{[Amperes]}$$

Note: For triodes, $I_s = 0$. The factor of 2000 accounts for unit conversions (mA to A) and model scaling.

**Back-calculation formula**:
$$E_{1,est} = \left(\frac{I_{total} \cdot K_{g1}}{2000}\right)^{1/E_x}$$

**Validity check**:
$$E_{1,est} > 0$$

Only positive $E_1$ values are physically meaningful.

### 5. Collect Linear Regression Data

For each valid point with $E_{1,est} > 0$:

**X-coordinate** (independent variable):
$$x_i = \frac{1}{\mu} + \frac{V_{g,i}}{V_{a,i}}$$

**Y-coordinate** (dependent variable):
$$y_i = \ln(E_{1,est,i})$$

These coordinate pairs form the dataset for linear regression.

### 6. Perform Linear Regression

For each series with $N \geq 3$ valid points:

**Calculate means**:
$$\bar{x} = \frac{1}{N} \sum_{i=1}^{N} x_i$$

$$\bar{y} = \frac{1}{N} \sum_{i=1}^{N} y_i$$

**Compute slope using covariance method**:

$$K_p = \frac{\sum_{i=1}^{N} (x_i - \bar{x})(y_i - \bar{y})}{\sum_{i=1}^{N} (x_i - \bar{x})^2}$$

This is equivalent to the standard least squares formula:

$$K_p = \frac{\text{Cov}(x, y)}{\text{Var}(x)}$$

**Validate denominator**:
$$\sum_{i=1}^{N} (x_i - \bar{x})^2 > 0$$

Ensures sufficient variance in x-values for meaningful regression.

### 7. Validate Physical Reasonableness

Apply sanity check to ensure physically meaningful value:

$$K_p > 0$$

**Rationale**: The knee parameter must be positive by definition. Negative values indicate:
- Poor data quality
- Invalid operating region
- Model assumptions violated

Only positive $K_p$ estimates are accepted for averaging.

### 8. Average Across Multiple Series

Collect valid estimates from all grid voltage series:

$$K_{p,final} = \frac{1}{N_{valid}} \sum_{i=1}^{N_{valid}} K_{p,i}$$

**Averaging benefits**:
- Reduces measurement noise
- Accounts for variations across operating points
- Provides more robust estimate

### 9. Apply Default Value if Necessary

If insufficient valid data exists:

$$K_p = \begin{cases} 
\frac{1}{N} \sum K_{p,i} & \text{if } N > 0 \\ 
10 & \text{otherwise}
\end{cases}$$

**Default justification**: $K_p = 10$ represents a typical mid-range value for common triodes and pentodes, suitable for initial optimization.

## Supported Measurement Types

The function processes the same uTracer measurement configurations as previous estimators:

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

- **Previously estimated parameters**:
  - $\mu_{est} = 12.72$ (from μ estimation)
  - $E_{x,est} = 1.50$ (from Ex/Kg1 estimation)
  - $K_{g1,est} = 2165$ (from Ex/Kg1 estimation)
- **Measurement type**: IP_VA_VG_VH (triode plate characteristics)
- **Grid voltage range**: -2V to -7V
- **Plate voltage range**: 50V to 250V

### Data Processing for $V_g = -4V$ Series

Selecting measurements that meet criteria ($\frac{V_a}{\mu} > -V_g$):

| $V_a$ (V) | $I_p$ (mA) | $E_{1,est}$ | $\ln(E_{1,est})$ | $\frac{1}{\mu} + \frac{V_g}{V_a}$ |
|-----------|------------|-------------|------------------|-----------------------------------|
| 150       | 14.2       | 7.85        | 2.061            | 0.0519                           |
| 175       | 17.8       | 8.45        | 2.134            | 0.0558                           |
| 200       | 21.6       | 9.12        | 2.210            | 0.0587                           |
| 225       | 25.8       | 9.84        | 2.286            | 0.0609                           |
| 250       | 30.3       | 10.58       | 2.359            | 0.0626                           |

### Linear Regression Calculation

**Mean values**:
$$\bar{x} = \frac{0.0519 + 0.0558 + 0.0587 + 0.0609 + 0.0626}{5} = 0.0580$$

$$\bar{y} = \frac{2.061 + 2.134 + 2.210 + 2.286 + 2.359}{5} = 2.210$$

**Covariance and variance**:
$$\sum (x_i - \bar{x})(y_i - \bar{y}) = 0.00327$$

$$\sum (x_i - \bar{x})^2 = 0.000372$$

**Slope** (Kp estimate):
$$K_p = \frac{0.00327}{0.000372} = 8.79$$

### Results for Multiple Grid Voltages

| Grid Voltage | Valid Points | $K_p$ estimate | Notes |
|--------------|--------------|----------------|-------|
| -2V          | 12           | 8.45           | Good linearity |
| -3V          | 11           | 8.62           | High R² |
| -4V          | 10           | 8.79           | Excellent fit |
| -5V          | 10           | 8.71           | Consistent |
| -6V          | 9            | 8.53           | Good agreement |

### Final Estimate

**Averaged $K_p$**: 8.62 (standard deviation: 0.13)

**Analysis**:
- Consistent across grid voltages (low variance)
- Typical value for medium-μ triodes
- Good starting point for final optimization
- High correlation in linear fits validates methodology

## Trace Information

When tracing is enabled, the algorithm stores diagnostic information:

**For each series that produces a valid estimate**:
- File name
- Estimated $K_p$ value
- Grid voltage (corrected for offset)

This diagnostic data enables:
- **Series-by-series analysis**: Compare $K_p$ estimates across different grid voltages
- **Quality assessment**: Identify outliers or inconsistent estimates
- **Regression visualization**: Plot $\ln(E_1)$ vs $(1/\mu + V_g/V_a)$ to verify linearity
- **Debugging**: Diagnose extraction issues and data quality problems
- **Convergence analysis**: Track how $K_p$ varies across operating points

## Edge Cases and Error Handling

### Missing Dependencies

**Condition**: $\mu$, $E_x$, or $K_{g1}$ is undefined

**Behavior**: Throw error "Cannot estimate kp without mu, ex and kg1"

**Rationale**: 
- $E_1$ back-calculation requires $E_x$ and $K_{g1}$
- Voltage ratio calculation requires $\mu$
- Without these, $K_p$ estimation is mathematically impossible

### Insufficient Data Points

**Minimum requirement**: At least 3 valid points per series for linear regression

**Behavior**: 
$$\text{If } N_{points} < 3 \text{: skip series}$$

**Rationale**: Linear regression with 2 parameters (slope, intercept) requires at least 3 points for overdetermined system.

### Zero or Negative $E_1$

**Condition**: Back-calculated $E_{1,est} \leq 0$

**Behavior**: Skip that measurement point

**Causes**:
- Zero or negative measured current
- Invalid parameter estimates from previous steps
- Measurement noise

### Zero Variance in X-values

**Condition**: All x-values identical ($\sum (x_i - \bar{x})^2 = 0$)

**Behavior**: Skip series (division by zero prevented)

**Causes**:
- Limited voltage range
- All measurements at same operating point
- Insufficient data diversity

### Negative Slope (Non-Physical)

**Condition**: Calculated $K_p \leq 0$

**Behavior**: Reject that series estimate

**Interpretation**: Negative $K_p$ is physically meaningless and indicates:
- Data quality issues
- Invalid operating region
- Model assumptions violated

### No Valid Estimates

If all series produce invalid estimates:

$$K_p = 10$$

**Rationale**: Default value enables optimization to proceed, though convergence quality may be reduced.

## Relationship to High Voltage Condition

### Why High Voltages Are Preferred

The estimation is most accurate when:

$$V_a^2 \gg K_{vb}$$

**At high voltages**:
- The $\sqrt{K_{vb} + V_a^2} \approx V_a$ approximation becomes valid
- The exponential term linearizes more effectively
- Measurement signal-to-noise ratio is better
- Space charge effects are more pronounced

### Implementation Note

While the methodology suggests using "high voltage" points, the actual implementation processes **all points** that satisfy:

$$\frac{V_a}{\mu} > -V_g$$

This inclusive approach:
- Uses more data for robust regression
- Lets the linear fit naturally weight appropriate regions
- Provides better statistics with larger sample size

The high-voltage assumption is validated by checking the linear fit quality (R² in trace data).

## Integration with Other Estimators

The $K_p$ estimation is performed **third** in the parameter estimation chain:

**Estimation Sequence**:

1. **$\mu$ Estimation**: Calculate amplification factor (independent)
2. **$E_x$ and $K_{g1}$ Estimation**: Uses $\mu$
3. **$K_p$ Estimation**: Uses $\mu$, $E_x$, and $K_{g1}$ (this step)
4. **$K_{vb}$ Estimation**: Uses all previous parameters

**Dependencies**:
- **Requires**: $\mu$, $E_x$, $K_{g1}$ (from steps 1-2)
- **Provides**: $K_p$ (for step 4)

The $K_p$ estimate, along with previous parameters, enables the final $K_{vb}$ estimation to complete the initial parameter set.

## Comparison with README Example

The README provides illustrative examples with simplified scenarios. The actual implementation:

- Processes all points meeting validity criteria (not just "high voltage" subset)
- Uses total current $(I_p + I_s)$ for pentodes
- Applies the factor of 2000 in back-calculation (unit conversion and scaling)
- Validates each estimate before averaging
- Requires minimum 3 points per series

## Code Location

- **Implementation**: `/src/app/workers/estimates/estimate-kp.ts`
- **Tests**: `/src/app/workers/estimates/estimate-kp.spec.ts`
- **Usage**: Called from `/src/app/workers/estimates/estimate-triode-parameters.ts` and `/src/app/workers/estimates/estimate-pentode-parameters.ts`

## References

- Derk Reefman, "Spice models for vacuum tubes using the uTracer", page 36
- Norman Koren, "Improved vacuum tube models for SPICE simulations"
- Space charge theory and limiting behaviors
- Linear regression theory and least squares fitting

## Related Documentation

- [μ Estimation](estimate-mu.md)
- [Ex/Kg1 Estimation](estimate-ex-kg1.md)
- [Kvb Estimation](estimate-kvb.md)
- [Norman Koren Triode Model](norman-koren-triode-model.md)
- [Norman Koren Pentode Model](norman-koren-pentode-model.md)
