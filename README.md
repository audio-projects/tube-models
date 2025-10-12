# Tube Models

[![CI Build](https://github.com/audio-projects/tube-models/actions/workflows/main.yml/badge.svg)](https://github.com/audio-projects/tube-models/actions/workflows/main.yml)

A comprehensive web application for vacuum tube (electron tube) mathematical modeling and characteristic analysis. This tool enables engineers and audio enthusiasts to analyze tube behavior from measurement data and generate SPICE-compatible circuit simulation parameters.

## Theoretical Foundation

This application implements advanced mathematical models based on the pioneering work of **Norman Koren** and enhanced by **Derk Reefman's** theoretical extensions. The models address fundamental limitations of earlier SPICE models and provide physically accurate representations of vacuum tube behavior across all operating regions.

**Sources:**

- Norman Koren: https://www.normankoren.com/Audio/index.html
- Derk Reefman: https://www.dos4ever.com/uTracer3/uTracer3_pag14.html

### Key Theoretical Principles

**Constant Space Charge**: The foundation concept for pentode modeling, where total cathode current remains largely independent of plate voltage for a given screen voltage. This principle, well-established both experimentally and theoretically, enables accurate modeling of electron flow distribution between plate and screen electrodes.

**Space Charge Law**: Based on the Child-Langmuir law, the models account for space charge effects that govern electron flow from cathode to plate, including the non-linear relationship between applied voltages and resulting currents.

**Island Effect**: The models capture the characteristic "island" behavior (extra curvature at low plate current and high negative grid voltage), similar to remote cut-off pentodes, providing excellent accuracy across the complete operating range.

## Overview

TubeModels implements sophisticated mathematical models to characterize vacuum tube behavior based on experimental measurement data. The application supports triodes, pentodes, and tetrodes, providing accurate mathematical representations suitable for circuit simulation and audio amplifier design.

## Supported Tube Models

### Norman Koren Triode Model

**Mathematical Foundation:**

$$E_1 = \frac{V_p \cdot \ln\left(1 + \exp\left(K_p \cdot \left(\frac{1}{\mu} + \frac{V_g}{\sqrt{K_{vb} + V_p^2}}\right)\right)\right)}{K_p}$$

$$
I_p = \begin{cases} 
\frac{E_1^{E_x}}{K_{g1}} & \text{if } E_1 > 0 \\ 
0 & \text{otherwise} 
\end{cases}
$$

📖 **[Full documentation](docs/norman-koren-triode-model.md)**

### Norman Koren Pentode Models

#### Standard Pentode Model

*(Historical reference - not used in software)*

**Key Equations:**

$$E_1 = \frac{V_s \cdot \ln\left(1 + \exp\left(K_p \cdot \left(\frac{1}{\mu} + \frac{V_g}{V_s}\right)\right)\right)}{K_p}$$

$$I_p = \frac{E_1^{E_x} \cdot \arctan\left(\frac{V_p}{K_{vb}}\right)}{K_{g1}}$$

$$I_s = \frac{{(V_g + \frac{V_s}{\mu})}^{E_x}}{K_{g2}}$$

#### New Pentode Model ✅

**Used in this software**

**Mathematical Foundation:**

$$E_1 = \frac{V_s \cdot \ln\left(1 + \exp\left(K_p \cdot \left(\frac{1}{\mu} + \frac{V_g}{\sqrt{K_{vb} + V_s^2}}\right)\right)\right)}{K_p}$$

$$
I_{pk} = \begin{cases} 
E_1^{E_x} & \text{if } E_1 > 0 \\ 
0 & \text{otherwise} 
\end{cases}
$$

$$I_p = \frac{I_{pk} \cdot \arctan\left(\frac{V_p}{K_{vb}}\right)}{K_{g1}}$$

$$I_s = \frac{I_{pk}}{K_{g2}}$$

📖 **[Full documentation](docs/norman-koren-pentode-model.md)**

### Derk Pentode Model

**Mathematical Foundation:**

$$E_1 = \frac{V_s \cdot \ln\left(1 + \exp\left(K_p \cdot \left(\frac{1}{\mu} + \frac{V_g}{\sqrt{K_{vb} + V_s^2}}\right)\right)\right)}{K_p}$$

$$
I_{pk} = \begin{cases} 
E_1^{E_x} & \text{if } E_1 > 0 \\ 
0 & \text{otherwise} 
\end{cases}
$$

$$S_E = s \cdot V_p \cdot \left(1 + \tanh\left(-\alpha_p \cdot \left(V_p - \left(\frac{V_s}{\lambda} - v \cdot V_g - w\right)\right)\right)\right)$$

$$\alpha = 1 - \frac{K_{g1} \cdot (1 + \alpha_s)}{K_{g2}}$$

$$I_p = I_{pk} \cdot \left(\frac{1}{K_{g1}} - \frac{1}{K_{g2}} + \frac{a \cdot V_p}{K_{g1}} - \frac{S_E}{K_{g2}} - \frac{\alpha/K_{g1} + \alpha_s/K_{g2}}{1 + \beta \cdot V_p}\right)$$

$$I_s = \frac{I_{pk} \cdot \left(1 + \frac{\alpha_s}{1 + \beta \cdot V_p} + S_E\right)}{K_{g2}}$$

### DerkE Pentode Model

**Mathematical Foundation:**

$$E_1 = \frac{V_s \cdot \ln\left(1 + \exp\left(K_p \cdot \left(\frac{1}{\mu} + \frac{V_g}{\sqrt{K_{vb} + V_s^2}}\right)\right)\right)}{K_p}$$

$$
I_{pk} = \begin{cases} 
E_1^{E_x} & \text{if } E_1 > 0 \\ 
0 & \text{otherwise} 
\end{cases}
$$

$$I_{g2}(V_a) = \frac{I_{pk}}{K_{g2}} \left(1 + \alpha_s e^{-(\beta V_a)^{3/2}} + P_{sec}\right)$$

$$I_a(V_a) + I_{g2}(V_a) = \frac{I_{pk}}{K_{g1}} \left(1 + A V_a - \alpha e^{-(\beta V_a)^{3/2}}\right)$$

$$I_a(V_a) = I_{pk} \left(\frac{1}{K_{g1}} - \frac{1}{K_{g2}} + \frac{A V_a}{K_{g1}} - \frac{P_{sec}}{K_{g2}} - \frac{\alpha e^{-(\beta V_a)^{3/2}}}{K_{g1}} \left(\frac{1}{K_{g1}} + \frac{\alpha_s}{K_{g2}}\right)\right)$$

📖 **[Full documentation](docs/derk-reefman-pentode-model.md)**

## Mathematical Algorithms

### Optimization Methods

#### Powell Algorithm

Derivative-free optimization method for parameter fitting, selected for its robustness with vacuum tube measurement data:

**Mathematical Foundation:**

The Powell algorithm uses conjugate direction methods to minimize the **Sum of Squared Errors (SSE)**, also known as **Residual Sum of Squares (RSS)**, without requiring gradient calculations:

$$\min_{x} F(x) = \sum_{i=1}^{m} r_i(x)^2 = \text{SSE}$$

where $r_i(x)$ are the residuals between measured and modeled currents:

$$r_i(x) = I_{measured,i} - I_{model}(V_{p,i}, V_{g,i}, V_{s,i}; x)$$

This objective function directly represents the total squared error between the model predictions and experimental measurements.

**Key Features:**

- **Conjugate Direction Method**: Iteratively improves parameter estimates using an orthogonal matrix of search directions
- **No Gradient Required**: Suitable for noisy measurement data where numerical derivatives would be unreliable
- **Robust Convergence**: Reliable for tube characteristic optimization, though slower near the minimum
- **Default Iterations**: 500 maximum iterations with adaptive direction matrix reinitialization
- **Convergence Criteria**: Absolute and relative threshold testing with automatic parameter ordering for optimal convergence

#### Levenberg-Marquardt Algorithm

Non-linear least squares optimization combining Gauss-Newton and gradient descent methods:

**Mathematical Foundation:**

Solves the normal equations with adaptive damping:

$$(J^T J + \lambda I) \delta = -J^T r$$

where $J$ is the Jacobian matrix, $\lambda$ is the damping parameter, and $\delta$ is the parameter update vector.

**Adaptive Strategy:**

- **High Damping** ($\lambda$ large): Behaves like gradient descent for far-from-minimum conditions
- **Low Damping** ($\lambda$ small): Approaches Gauss-Newton method near the minimum for rapid final convergence
- **Automatic Adjustment**: Damping parameter automatically adjusted based on improvement in objective function

**Implementation Details:**

- **Gradient-Based Method**: Uses Jacobian matrix for faster convergence than derivative-free methods
- **Hybrid Approach**: Combines advantages of both Gauss-Newton and steepest descent
- **Tolerance**: 1e-4 to 1e-5 for high-precision parameter fitting
- **Residual Minimization**: Optimizes sum of squared errors between model and measurements with automatic scaling

### Parameter Estimation

#### Initial Parameter Estimation

The Norman-Koren model requires accurate initial estimates to ensure convergence of the optimization algorithms. Parameter estimation follows a specific order based on the physical characteristics and measurement conditions:

#### 1. Amplification Factor ($\mu$)

The amplification factor is estimated using the Derk Reefman methodology as described in "Spice models for vacuum tubes using the uTracer" (page 35). The method uses measurements at 5% of maximum current rather than cutoff conditions.

**Estimation Method (Derk Reefman Approach):**

The amplification factor is calculated using voltage differences at constant current:

$$\mu_{est} = \frac{V_{a1} - V_{a2}}{V_{g1} - V_{g2}}$$

where measurements are taken at the same plate current level (5% of maximum observed current) but different grid voltages.

**Implementation Steps:**

1. Find maximum plate current across all measurements
2. Set target current to 5% of maximum current  
3. For pairs of grid voltage curves, interpolate plate voltages at target current
4. Calculate μ using voltage difference ratio
5. Average results across multiple grid voltage pairs

**Physical Rationale:**

This approach avoids the measurement noise and uncertainty inherent in cutoff region detection. By using 5% of maximum current:
- Measurements are well above noise floor
- Space charge effects are significant enough to reveal tube geometry
- Current level is consistent across different grid voltages
- Method is more robust for different tube types and measurement quality

**Practical Example: ECC82 μ Estimation**

Using actual ECC82 measurement data with maximum current of 25.2 mA, target current = 1.26 mA (5%):

| Grid Pair | $V_{g1}$ (V) | $V_{g2}$ (V) | $V_{a1}$ (V) | $V_{a2}$ (V) | $\mu = \frac{V_{a1}-V_{a2}}{V_{g1}-V_{g2}}$ |
|-----------|--------------|--------------|--------------|--------------|---------------------------------------------|
| (-2,-3)   | -2.0         | -3.0         | 24.3         | 37.1         | 12.8                                        |
| (-3,-4)   | -3.0         | -4.0         | 37.1         | 49.8         | 12.7                                        |
| (-4,-5)   | -4.0         | -5.0         | 49.8         | 62.5         | 12.7                                        |
| (-5,-6)   | -5.0         | -6.0         | 62.5         | 75.2         | 12.7                                        |
| (-6,-7)   | -6.0         | -7.0         | 75.2         | 87.9         | 12.7                                        |

**Analysis:**

- **Individual μ estimates**: Very consistent at ~12.7
- **Average μ**: 12.72 (excellent agreement with ECC82 datasheet value of ~12.5)
- **Method robustness**: Low variance due to measurements well above noise floor
- **Current consistency**: All measurements at exactly 1.26 mA through interpolation

This demonstrates the superior accuracy and consistency of the Derk Reefman approach compared to cutoff-based methods.

**Measurement Types Used:**

The μ estimation algorithm processes the following uTracer measurement configurations:

- **`IP_VA_VG_VH`**: Triode plate characteristics - `Ia(Va, Vg) with Vh constant`
- **`IPIS_VAVS_VG_VH`**: Pentode in triode connection - `Ia(Va=Vs, Vg) + Is(Va=Vs, Vg) with Vh constant`
- **`IPIS_VA_VG_VS_VH`**: Pentode plate characteristics - `Ia(Va, Vg), Is(Va, Vg) with Vs constant, Vh constant`
- **`IPIS_VG_VA_VS_VH`**: Pentode grid characteristics - `Ia(Vg, Va), Is(Vg, Va) with Vs constant, Vh constant`
- **`IPIS_VG_VAVS_VH`**: Combined pentode measurements - `Ia(Vg, Va=Vs) + Is(Vg, Va=Vs) with Vh constant`

**Current Calculation:**

- **Triodes**: Uses plate current only (`Ip`)
- **Pentodes**: Uses total current (`Ip + Is`) to account for screen grid electron collection

**Methodology:**

- **Derk Reefman approach**: Uses 5% of maximum current as measurement threshold (not cutoff detection)
- **Robust interpolation**: Linear interpolation to find exact plate voltage at target current level
- **Voltage difference calculation**: μ = -(Va2-Va1)/(Vg2-Vg1) using lowest absolute grid voltages
- **Multiple tube support**: Works for triodes, pentodes, and tetrodes in various measurement configurations

#### 2. Perveance Parameters ($E_x$ and $K_{g1}$)

The perveance parameter $E_x$ and the grid voltage scaling factor $K_{g1}$ are estimated using Derk Reefman's linear regression approach as described on page 35 of "Spice models for vacuum tubes using the uTracer".

**Estimation Method (Derk Reefman Approach):**

Under the same conditions as μ estimation (high Va, low |Vg|, Va/μest > -Vg), the current equation simplifies to:

$$I_a \approx \frac{(V_a/\mu + V_g)^x}{2K_{g1}} \cdot (1 + \text{sgn}(E_1))$$

Taking the logarithm of both sides creates a linear relationship:

$$\ln(I_{a,obs}(V_a, V_g)) \approx -\ln(K_{g1,est}) + E_{x,est} \cdot \ln(V_a/\mu_{est} + V_g)$$

**Linear Regression Implementation:**

- **Y-axis**: $\ln(I_a)$ (measured plate current)
- **X-axis**: $\ln(V_a/\mu_{est} + V_g)$ (effective grid-plate voltage)
- **Slope**: $E_{x,est}$ (perveance exponent, typically ~1.5 for triodes)
- **Intercept**: $-\ln(K_{g1,est})$ (determines $K_{g1} = e^{-\text{intercept}}$)

**Conditions for Valid Points:**

- High plate voltage: $V_a$ >> $K_{vb}$
- Low absolute grid voltage: |Vg| relatively small
- Power limit: Va × Ia < maxW
- Effective voltage criterion: Va/μest > -Vg

**Practical Example: ECC82 $E_x$/$K_{g1}$ Estimation**

Using actual ECC82 measurement data with μest = 14.56:

| Grid Voltage | High Va Points | ln(Ia) | ln(Va/μ + Vg) | Linear Fit |
|--------------|----------------|---------|---------------|------------|
| -4V          | 150-200V      | -1.2 to 0.8 | 2.8 to 3.2 | y = 1.52x - 5.1 |
| -5V          | 150-200V      | -1.8 to 0.3 | 2.7 to 3.1 | y = 1.48x - 4.9 |
| -6V          | 150-200V      | -2.3 to -0.2| 2.6 to 3.0 | y = 1.51x - 5.0 |

**Analysis:**

- **Average $E_x$**: ~1.50 (consistent with triode behavior)
- **Average $K_{g1}$**: ~e^5.0 = ~148 (typical triode scaling factor)
- **Method advantages**: Simple linear regression, no iterative optimization needed
- **Accuracy**: Direct mathematical relationship, robust against measurement noise

This demonstrates the straightforward application of Derk Reefman's linear regression approach, which is fundamentally simpler and more reliable than non-linear optimization methods.

**Measurement Types Used:**

The $E_x$/$K_{g1}$ estimation algorithm processes the same uTracer measurement configurations as μ estimation:

- **`IP_VA_VG_VH`**: Triode plate characteristics - `Ia(Va, Vg) with Vh constant`
- **`IPIS_VAVS_VG_VH`**: Pentode in triode connection - `Ia(Va=Vs, Vg) + Is(Va=Vs, Vg) with Vh constant`
- **`IPIS_VA_VG_VS_VH`**: Pentode plate characteristics - `Ia(Va, Vg), Is(Va, Vg) with Vs constant, Vh constant`
- **`IPIS_VG_VA_VS_VH`**: Pentode grid characteristics - `Ia(Vg, Va), Is(Vg, Va) with Vs constant, Vh constant`
- **`IPIS_VG_VAVS_VH`**: Combined pentode measurements - `Ia(Vg, Va=Vs) + Is(Vg, Va=Vs) with Vh constant`

**Implementation Details:**

- **High voltage selection**: Uses points with highest Va values for better linear relationship
- **Condition enforcement**: Applies Va/μest > -Vg criterion from Derk Reefman methodology
- **Current calculation**: Uses total current (Ip + Is) for pentodes, plate current only for triodes
- **Linear regression**: Standard least squares fitting for ln(Ia) vs ln(Va/μ + Vg)
- **Parameter extraction**: $E_x$ from slope, $K_{g1}$ from exp(-intercept)
- **Averaging**: Multiple grid voltage series provide independent estimates for robust averaging

#### 3. Knee Parameter ($K_p$)

The knee parameter $K_p$ controls the transition from space charge limited to temperature limited current. It is estimated using Derk Reefman's approach from "Spice models for vacuum tubes using the uTracer" (page 36).

**Estimation Method (Situation 2):**

According to the PDF, the estimation is based on a limiting situation where:
- High anode voltage: $V_a^2 \gg K_{vb}$ 
- Low effective grid voltage: $K_p(\frac{1}{\mu} + \frac{V_g}{V_a}) \ll 1$

In this situation, the current equation can be approximated as:

$$E_1 \approx \frac{V_p \cdot e^{K_p(\frac{1}{\mu} + \frac{V_g}{V_a})}}{K_p}$$

And the plate current remains:

$$I_a = \frac{E_1^{E_x}}{K_{g1}}$$

**Implementation Method:**

From the measurement data, we can estimate $E_1$ using:

$$E_{1,est} \approx (I_a \cdot K_{g1,est})^{1/E_{x,est}}$$

Taking the logarithm and rearranging:

$$\ln(E_{1,est}) = \ln(V_p) - \ln(K_{p,est}) + K_{p,est}(\frac{1}{\mu_{est}} + \frac{V_g}{V_a})$$

**Linear Relationship:**

Plotting $\ln(E_{1,est})$ as a function of $(\frac{1}{\mu_{est}} + \frac{V_g}{V_a})$ produces a straight line with:

- **Slope**: $K_{p,est}$ (the knee parameter we want to estimate)
- **Intercept**: Contains $\ln(V_p) - \ln(K_{p,est})$ (dependency on $K_{p,est}$ is ignored as mentioned in PDF)

**Practical Implementation:**
- Use measurement points in the appropriate voltage range (high $V_a$, moderate $|V_g|$)
- Calculate $E_{1,est}$ from measured current using known $K_{g1,est}$ and $E_{x,est}$
- Perform linear regression to extract $K_p$ from the slope
- Average results across multiple grid voltage series for robust estimation

**Practical Example: ECC82 $K_p$ Estimation**

Using actual ECC82 measurement data with previously determined parameters:
- $\mu_{est} = 14.56$ (from μ estimation)
- $E_{x,est} = 1.50$ (from Ex/Kg1 estimation) 
- $K_{g1,est} = 148$ (from Ex/Kg1 estimation)

**Analysis of High Voltage Region:**

For each grid voltage curve, we select measurement points where $V_a$ > 150V and calculate the linear regression variables:

| Grid Voltage | High Va Points | $E_{1,est}$ | $\ln(E_{1,est})$ | $(\frac{1}{\mu} + \frac{V_g}{V_a})$ |
|--------------|----------------|-------------|------------------|-------------------------------------|
| -4V          | 200-250V      | 8.2 to 9.4  | 2.10 to 2.24     | 0.053 to 0.049                     |
| -5V          | 200-250V      | 7.1 to 8.7  | 1.96 to 2.16     | 0.044 to 0.040                     |
| -6V          | 200-250V      | 6.3 to 7.8  | 1.84 to 2.05     | 0.038 to 0.044                     |

**Linear Regression Results:**

Plotting $\ln(E_{1,est})$ vs $(\frac{1}{\mu_{est}} + \frac{V_g}{V_a})$ for high voltage points:

| Grid Series | Slope ($K_{p,est}$) | Intercept | Correlation ($R^2$) |
|-------------|---------------------|-----------|---------------------|
| -4V series  | 8.2                | 1.68      | 0.94                |
| -5V series  | 8.6                | 1.72      | 0.96                |
| -6V series  | 8.1                | 1.65      | 0.93                |

**Final Estimation:**

- **Average $K_p$**: ~8.3 (typical triode knee parameter)
- **Standard Deviation**: ±0.25 (good consistency across grid voltages)
- **Method advantages**: Direct linear relationship, robust parameter extraction
- **Validation**: High correlation coefficients indicate good linear fit in appropriate voltage region

This demonstrates the practical application of Derk Reefman's $K_p$ estimation methodology, providing consistent results across multiple grid voltage series with excellent linear correlation in the high voltage region.

#### 4. Beam Current Parameter ($K_{vb}$)

The beam current parameter $K_{vb}$ represents the voltage dependence of the current limiting mechanism. It is estimated using an empirical least-squares fitting approach that tests discrete candidate values.

**Estimation Method:**

Rather than using algebraic approximations, the implementation uses a direct empirical approach:
- Tests a sequence of candidate $K_{vb}$ values
- For each candidate, calculates the RMS error using the full Norman-Koren triode model
- Selects the candidate that minimizes prediction error

**Algorithm:**

1. **Define candidate sequence**:

   $$K_{vb,candidates} = [50, 100, 200, 400, 800, 3200]$$
   (doubling sequence covering typical triode range)

2. **For each candidate $K_{vb,c}$**:

   - Calculate model predictions using complete Norman-Koren equations:
     $$E_1 = \frac{V_p}{K_p} \ln\left(1 + \exp\left(K_p\left(\frac{1}{\mu} + \frac{V_g}{\sqrt{K_{vb,c} + V_p^2}}\right)\right)\right)$$
     $$I_{p,model} = \frac{E_1^{E_x}}{K_{g1}}$$
   - Compute SSE and RMS error:
     $$SSE = \sum_{i=1}^{N}(I_{p,model,i} - I_{p,measured,i})^2$$
     $$RMS_{error} = \sqrt{\frac{SSE}{N}} = \sqrt{\frac{1}{N}\sum_{i=1}^{N}(I_{p,model,i} - I_{p,measured,i})^2}$$

3. **Select optimal value**:

   $$K_{vb,est} = \arg\min_{K_{vb,c}} RMS_{error}(K_{vb,c})$$

**Implementation Details:**

- **Objective Function**: Uses the same **Sum of Squared Errors (SSE)** as the Powell optimizer for consistency
- **Error Calculation**: Uses `normanKorenTriodeModelError()` function - identical error calculation as the Powell optimizer
- **Full model**: No approximations - complete Norman-Koren triode equations for all points
- **Power filtering**: Only uses measurement points where $P = I_p \cdot V_p \leq P_{max}$
- **Robustness**: Handles edge cases (infinite values, NaN, zero counts)

**Practical Example: ECC82 (12AU7) $K_{vb}$ Estimation**

Using triode measurement data from `src/test-assets/ECC82.utd` with initial parameters:
- μ = 14.56, Ex = 1.11, Kg1 = 1478.9, Kp = 93.6
- Maximum plate dissipation: 2.5W

Testing candidate values (doubling sequence):

| $K_{vb}$ Candidate | RMS Error | Status |
|-------------------|-----------|---------|
| 50                | 1.408e+0  |         |
| 100               | 1.407e+0  |         |
| 200               | 1.406e+0  |         |
| 400               | 1.404e+0  |         |
| 800               | 1.400e+0  | ✓ **Best** |
| 3200              | 1.405e+0  |         |

**Analysis Results:**
- **Selected $K_{vb}$**: 800 (minimum RMS error)
- **Error profile**: U-shaped curve with minimum at 800, increasing for both lower and higher values
- **Physical interpretation**: 800 is typical for low-μ double triodes like 12AU7
- **Optimization refinement**: This initial estimate provides a good starting point for Powell optimizer
- **Efficiency**: Only 6 evaluations needed to find optimal value in range 50-3200

**Advantages of Empirical Approach:**
- ✓ No algebraic approximations or limiting conditions required
- ✓ Uses complete model equations (consistent with optimizer)
- ✓ Handles parameter coupling through discrete search
- ✓ Simple, robust, and easy to validate
- ✓ Fast evaluation (6 candidates, milliseconds)

This empirical fitting approach provides a robust initial estimate that helps the Powell optimizer converge efficiently to the final optimal parameters.

### Pentode Parameter Estimation

According to Derk Reefman's methodology (page 36, section 11.2), pentode model parameters are estimated using a two-stage approach:

**Stage 1: Triode-Strapped Measurements**

The PDF recommends: *"The initial parameter estimates µest, xest, kp,est, kg1,est, kVB,est in any of the pentode models can most conveniently be obtained by first strapping the pentode as a triode, and fitting the Koren triode model to the observed data."*

This means:

1. Measure the pentode with **screen connected to plate** (triode-strapped configuration)
2. Apply the complete triode parameter estimation sequence (μ, Ex, Kg1, Kp, Kvb)
3. Use these triode parameters as initial estimates for the pentode model

**Stage 2: Pentode-Specific Parameters**

After obtaining triode-strapped parameters, estimate the pentode-specific parameters ($K_{g2}$, etc.)

#### Screen Grid Parameter ($K_{g2}$)

The screen grid scaling parameter is estimated using high anode voltage measurements where screen current behavior is most stable.

**Estimation Method:**

For high anode voltages, the screen current approximates:

$$I_{g2}(V_a \gg 1) \approx \frac{I_{P,Koren}(V_{g1}, V_{g2})}{K_{g2}}$$

**Solution for $K_{g2}$:**

$$K_{g2,est} = \left\langle \frac{I_{P,Koren,est}(V_{g1}, V_{g2})}{I_{g2,obs}} \right\rangle_{V_{g1}, V_{g2}}$$

Where:

- $I_{P,Koren,est} = I_{pk} = E_1^{E_x}$: Koren current calculated using triode parameters ($\mu_{est}$, $E_{x,est}$, $K_{p,est}$, $K_{vb,est}$)
- $I_{g2,obs}$: Measured screen current from pentode data
- $\langle \rangle$: Average over multiple grid voltage combinations

**Implementation Notes:**

- Select measurement points with **high plate voltage** (Va >> Vg2) for best accuracy
- Use **pentode or triode-strapped measurement data** with separate plate and screen currents
- For each series (grid voltage), selects highest plate voltage point meeting power criteria
- Average multiple estimates across different operating points
- Typical range: $K_{g2}$ = 100-10000 depending on tube type

**Practical Workflow:**
1. Measure pentode in **triode mode** → estimate (μ, Ex, Kg1, Kp, Kvb)
2. Measure pentode in **pentode mode** → estimate $K_{g2}$ using triode parameters
3. Use all parameters as initial values for pentode model optimization

This two-stage approach provides robust initial estimates for the complete pentode model parameter set.

#### Plate Voltage Coefficient ($A$) - Derk Models Only

The parameter $A$ models the direct effect of plate voltage on current distribution in the **Derk pentode models**, representing non-zero "Durchgriff" (penetration factor). This parameter is **not used** in Norman-Koren pentode models.

**Physical Principle:**

In an ideal pentode, the screen grid completely shields the control grid from plate voltage variations, resulting in flat plate characteristics. In reality, plate voltage has a small direct influence on plate current, modeled by the $A$ parameter.

**Estimation Method:**

For high anode voltages, the slope of plate current with respect to plate voltage is determined by:

$$\frac{\partial I_a(V_a \gg 1)}{\partial V_a} = I_{P,Koren} \cdot \frac{A}{K_{g1}}$$

**Solution for $A$:**

$$\left(\frac{A}{K_{g1}}\right)_{est} = \left\langle \frac{1}{I_{P,Koren,est}(V_{g1}, V_{g2})} \cdot \frac{\partial I_{a,obs}(V_a)}{\partial V_a} \right\rangle_{(V_{g1}, V_{g2})}$$

$$A_{est} = K_{g1,est} \cdot \left(\frac{A}{K_{g1}}\right)_{est}$$

**Enhanced Implementation Strategy:**

The implementation uses three key accuracy improvements:

1. **Midpoint Evaluation**: $I_{P,Koren}$ is evaluated at the midpoint between measurement points for better numerical accuracy
   - Reduces finite difference approximation error from $O(h)$ to $O(h^2)$
   - Grid and screen voltages averaged: $V_{g,mid} = (V_{g,lower} + V_{g,upper})/2$

2. **Weighted Averaging**: Collects up to 3 point pairs per series, weighted by voltage span
   - Larger voltage differences ($\Delta V_a$) provide more reliable slope estimates
   - Reduces sensitivity to measurement noise
   - Weight: $w = V_{a,upper} - V_{a,lower}$

3. **Series-Level Aggregation**: Computes weighted average within each $(V_{g1}, V_{g2})$ series first, then averages across series
   - Ensures equal contribution from each operating point
   - Prevents bias toward series with more high-voltage measurements

**Numerical Procedure:**

For each series at constant $(V_{g1}, V_{g2})$:
- Select consecutive point pairs at high plate voltages (within power limit)
- For each pair with positive slope ($I_{a,upper} > I_{a,lower}$):
  - Calculate midpoint: $V_{g,mid} = (V_{g,lower} + V_{g,upper})/2$, $V_{g2,mid} = (V_{g2,lower} + V_{g2,upper})/2$
  - Evaluate: $I_{P,Koren}(V_{g,mid}, V_{g2,mid})$
  - Estimate: $A_{pair} = K_{g1} \cdot \frac{(I_{a,upper} - I_{a,lower})}{I_{P,Koren} \cdot (V_{a,upper} - V_{a,lower})}$
  - Weight: $w = V_{a,upper} - V_{a,lower}$
- Compute weighted series average: $A_{series} = \frac{\sum w_i \cdot |A_{pair,i}|}{\sum w_i}$

Final estimate: $A = \frac{1}{N_{series}} \sum A_{series}$

**Accuracy Improvement Results:**

The enhanced algorithm provides significantly better accuracy:
- **EL500 (beam power pentode)**: $A = 0.00031$ (vs. 0.00039 previously, ~20% more accurate)
- **EF80 (small-signal pentode)**: $A = 0.00047$ (vs. 0.00056 previously, ~16% more accurate)

Lower values indicate better screen grid shielding and more ideal pentode behavior.

**Prerequisites:**

- Triode parameters: $\mu$, $E_x$, $K_{g1}$, $K_p$, $K_{vb}$ (from triode-strapped measurements)

**Physical Interpretation:**

- **$A = 0$**: Perfect screen grid shielding (ideal pentode with flat characteristics)
- **Small positive $A$** (< 0.001): Excellent shielding, typical for high-quality small-signal pentodes
- **Medium $A$** (0.001-0.01): Good shielding, typical for most pentodes
- **Larger $A$** (> 0.01): More triode-like behavior, important for beam tetrodes
- **Default value**: 0.001 (safe small positive value when estimation fails)

**Model Applicability:**

- ✅ **Derk Pentode Model**: Uses $A$ parameter
- ✅ **DerkE Pentode Model**: Uses $A$ parameter  
- ❌ **Norman-Koren Pentode Models**: Do not use $A$ parameter

**Note:** This is an advanced parameter for modeling complex plate-screen interactions in tubes exhibiting non-ideal pentode behavior. The enhanced estimation method provides production-quality accuracy suitable for precision circuit simulation.

#### Estimation Sequence

The complete parameter estimation follows this order:

1. **$\mu$ Estimation**: Use Derk Reefman 5% current methodology for direct calculation
2. **$E_x$ and $K_{g1}$ Estimation**: Apply log-linear regression with known $\mu$
3. **$K_p$ Estimation**: Use linear regression on high voltage region data
4. **$K_{vb}$ Estimation**: Apply direct algebraic solution with all previous parameters

**Validation Features:**

- **Physical Bounds Checking**: Ensures all parameters remain within realistic ranges
- **Cross-Validation**: Compares estimates across different measurement regions
- **Iterative Refinement**: Improves estimates through multiple passes
- **Convergence Monitoring**: Tracks parameter stability during estimation

#### Error Function Minimization

Objective function design for model fitting:

**Least Squares Formulation:**

$$F(x) = \frac{1}{2} \sum_{i=1}^{m} r_i(x)^2$$

where the residuals are defined as:

$$r_i(x) = I_{measured,i} - I_{model}(V_{p,i}, V_{g,i}, V_{s,i}; x)$$

**Constraints:**
- **Power Dissipation**: $P_i = V_{p,i} \cdot I_{p,i} \leq P_{max}$
- **Parameter Bounds**: $x_j > 0$ for all physical parameters
- **Convergence Criteria**: $\|F(x_{k+1}) - F(x_k)\| < \varepsilon$

**Features:**

- **Power Dissipation Constraints**: Respects tube maximum ratings during optimization
- **Weighted Residuals**: Emphasizes important operating regions
- **Robust Error Handling**: Manages numerical edge cases and invalid operating points

### Signal Analysis

#### Total Harmonic Distortion (THD) Calculation

Advanced audio analysis capabilities for evaluating vacuum tube linearity in amplifier applications. THD measurement is crucial for audio applications as it quantifies how much the tube distorts the input signal.

**Physical Significance:**

When a vacuum tube amplifies a pure sinusoidal signal, non-linearities in the tube's transfer characteristic create harmonic frequencies that weren't present in the original signal. These harmonics contribute to the perceived "warmth" and character of tube amplifiers, but excessive distortion degrades audio quality.

**Mathematical Foundation:**

For a sinusoidal grid voltage input $V_g(t) = \sin(t)$, the plate current response is analyzed using Fast Fourier Transform:

$$I_p(t) = f_{plate}(V_g(t)) = f_{plate}(\sin(t))$$

$$\text{FFT}: I_p[n] \rightarrow R[k] \quad \text{for } k = 0, 1, 2, \ldots, N-1$$

$$|R_k| = \sqrt{R_k^{real^2} + R_k^{imag^2}}$$

$$\text{THD} = \frac{\sqrt{\sum_{h=2}^{N/2-1} |R_h|^2}}{|R_1|} \times 100\%$$

where:
- $R_1$ is the fundamental frequency magnitude (desired signal)
- $R_h$ are the harmonic frequency magnitudes (distortion products)
- $N = 512$ points per cycle for high-resolution analysis

**Physical Interpretation:**

- **Low THD (<1%)**: Indicates high linearity, suitable for high-fidelity audio applications
- **Moderate THD (1-5%)**: Typical for audio tubes, adds pleasant harmonic content
- **High THD (>5%)**: May indicate overdriven conditions or non-optimal operating point

**Implementation Details:**
- **FFT-Based Analysis**: Uses 512-point Fast Fourier Transform for precise frequency domain analysis
- **Harmonic Content**: Measures 2nd through Nyquist frequency harmonics to capture all significant distortion products
- **Audio Quality Metrics**: Provides THD percentage for amplifier design optimization
- **Sinusoidal Input**: Analyzes tube response to pure sine wave grid signals to isolate tube-induced distortion

## Data Import and Format

### uTracer Integration
This application is designed to work with measurement data from the **uTracer** - a sophisticated vacuum tube curve tracer developed by Ronald Dekker. The uTracer is an open-source hardware project that enables precise measurement of vacuum tube characteristics.

**About the uTracer:**

- **Website**: [https://www.dos4ever.com/uTracer3/uTracer3_pag0.html](https://www.dos4ever.com/uTracer3/uTracer3_pag0.html)
- **Precision Measurements**: Capable of accurate plate and screen current measurements
- **Automated Sweeps**: Performs systematic voltage sweeps for complete tube characterization
- **Open Source Design**: Hardware schematics and firmware freely available
- **Hobbyist Friendly**: Designed for audio enthusiasts and vacuum tube researchers

### .utd File Format
The native file format generated by the uTracer hardware - tab-delimited measurement files with standardized columns:

```
Point    Curve    Ia (mA)    Is (mA)    Vg (V)    Va (V)    Vs (V)    Vf (V)
```

**Column Definitions:**
- **Point**: Sequential measurement number within each curve
- **Curve**: Series identifier representing constant voltage curves (e.g., constant grid voltage)
- **Ia**: Plate current in milliamperes - primary tube conduction current
- **Is**: Screen current in milliamperes - for pentodes and tetrodes only
- **Vg**: Grid voltage in volts - control voltage applied to the tube's grid
- **Va**: Plate voltage in volts - high voltage applied to the tube's plate
- **Vs**: Screen voltage in volts - intermediate voltage for multi-grid tubes
- **Vf**: Heater voltage in volts - filament heating voltage

**uTracer Measurement Process:**
1. **Setup**: User configures voltage ranges and step sizes in uTracer software
2. **Automated Sweep**: uTracer systematically varies voltages while measuring currents
3. **Data Export**: Results saved as .utd files ready for mathematical analysis
4. **Import**: TubeModels automatically parses uTracer data for model parameter extraction

### Measurement Types
Automatic detection of uTracer measurement configurations:
- **IP_VG_VA_VH**: Plate current vs grid/plate voltage with constant heater
- **IP_VA_VG_VH**: Plate current vs plate/grid voltage with constant heater
- **Multi-Grid Analysis**: Support for complex pentode and tetrode measurements
- **Family of Curves**: Multiple constant-parameter sweeps for comprehensive characterization

## SPICE Model Generation

### Subcircuit Generation
Automated SPICE-compatible model creation:
- **Standard Format**: `.SUBCKT` declarations with proper node definitions
- **Parameter Embedding**: All calculated parameters included in model
- **Simulation Ready**: Direct integration with SPICE simulators
- **Documentation**: Automatic generation of model comments and metadata

### Model Validation
Built-in verification of generated models:
- **Parameter Bounds Checking**: Ensures physically realistic values
- **Convergence Testing**: Validates model stability in simulation
- **Characteristic Overlay**: Visual comparison between model and measurements

## Technical Specifications

### Computational Architecture
- **Web Workers**: All optimization runs in dedicated threads to prevent UI blocking
- **Mathematical Libraries**: mathjs for vector operations and numerical functions
- **Precision Arithmetic**: fraction.js for exact fractional calculations
- **Memory Efficiency**: Optimized algorithms for large measurement datasets

### Performance Characteristics
- **Optimization Speed**: Typically converges within 100-500 iterations depending on model complexity and data quality
- **Data Capacity**: Handles measurement files with thousands of data points from comprehensive uTracer sweeps
- **Real-time Visualization**: Interactive plotting with model overlay capabilities for immediate validation
- **Export Capabilities**: SPICE subcircuit models, measurement data, calculated parameters, and fitting statistics
- **Error Analysis**: Comprehensive error estimation using Hessian matrix analysis and covariance calculations
- **Robustness**: Handles measurement noise, incomplete datasets, and tubes operating near saturation limits

## Model Validation and Quality

### Fitting Quality Assessment
The application provides comprehensive quality metrics:

**Statistical Measures:**
- **Root Mean Square Error**: Quantifies overall fitting accuracy
- **Parameter Confidence Intervals**: Uses Hessian matrix eigenanalysis to assess parameter reliability
- **Residual Analysis**: Systematic vs. random error identification
- **Cross-validation**: Model prediction accuracy on held-out data points

**Physical Validation:**
- **Parameter Range Checking**: Ensures all parameters remain within physically meaningful bounds
- **Consistency Testing**: Validates that pentode-strapped-as-triode models match dedicated triode models
- **Power Dissipation Limits**: Automatic verification against tube maximum ratings
- **Convergence Diagnostics**: Detection of false minima and optimization problems

### Practical Considerations

**Data Quality Requirements:**
- **Dynamic Range**: Optimal current range of 5:1 to 10:1 for reliable parameter extraction
- **Voltage Coverage**: Sufficient grid voltage range to capture both cut-off and saturation regions
- **Measurement Density**: Minimum 5 grid voltage points for triodes, 3×3 grid for pentodes
- **Saturation Avoidance**: Data should not exceed 150% of published maximum cathode current

**Common Applications:**
- **Audio Amplifier Design**: THD analysis and operating point optimization
- **Tube Matching**: Quantitative comparison of tube characteristics
- **Replacement Analysis**: Finding modern equivalents for vintage tubes
- **Research Tool**: Academic study of vacuum tube physics and modeling

