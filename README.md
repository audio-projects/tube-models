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

The amplification factor is estimated using the Derk Reefman methodology, which uses measurements at 5% of maximum current rather than cutoff conditions. This approach provides superior noise immunity and robust parameter extraction.

**Key Method Features:**
- Uses 5% of maximum current as measurement threshold
- Linear interpolation to find plate voltages at target current
- Voltage difference calculation: $\mu = -\frac{V_{a2}-V_{a1}}{V_{g2}-V_{g1}}$ using lowest absolute grid voltages
- Works for triodes, pentodes, and tetrodes in various measurement configurations

📖 **[Complete μ estimation documentation](docs/estimate-mu.md)**

#### 2. Perveance Parameters ($E_x$ and $K_{g1}$)

The perveance parameter $E_x$ and the grid voltage scaling factor $K_{g1}$ are estimated using Derk Reefman's log-linear regression approach. By applying logarithmic transformation, the estimation becomes a simple linear regression problem.

**Key Method Features:**
- Uses logarithmic transformation: $\ln(I_a)$ vs $\ln(\frac{V_a}{\mu} + V_g)$
- Linear regression extracts both parameters simultaneously
- Slope gives $E_x$, intercept gives $K_{g1} = e^{-\text{intercept}}$
- Applies Derk Reefman condition: $\frac{V_a}{\mu} > -V_g$
- Uses high voltage measurements for better linearity

📖 **[Complete Ex/Kg1 estimation documentation](docs/estimate-ex-kg1.md)**

#### 3. Knee Parameter ($K_p$)

The knee parameter $K_p$ controls the transition from space charge limited to temperature limited current. It is estimated using Derk Reefman's log-linear regression approach based on high-voltage limiting behavior.

**Key Method Features:**
- Back-calculates $E_1$ from measured current: $E_{1,est} = \left(\frac{I_a \cdot K_{g1}}{2000}\right)^{1/E_x}$
- Linear regression: $\ln(E_{1,est})$ vs $\left(\frac{1}{\mu} + \frac{V_g}{V_a}\right)$
- Slope gives $K_p$ directly
- Applies condition: $\frac{V_a}{\mu} > -V_g$
- Averages across multiple grid voltage series

📖 **[Complete Kp estimation documentation](docs/estimate-kp.md)**

#### 4. Beam Current Parameter ($K_{vb}$)

The beam current parameter $K_{vb}$ represents the voltage dependence of the current limiting mechanism. It is estimated using an empirical discrete search approach that tests candidate values to find the best match with measured data.

**Key Method Features:**
- Tests discrete candidate sequence: [50, 100, 200, 400, 800, 3200]
- Uses complete Norman-Koren model for each candidate
- Selects candidate with minimum RMSE: $K_{vb,est} = \arg\min_{K_{vb,c}} \text{RMSE}(K_{vb,c})$
- Same error function as Powell optimizer for consistency
- Fast evaluation (6 candidates, milliseconds)
- No approximations - exact model equations

📖 **[Complete Kvb estimation documentation](docs/estimate-kvb.md)**

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

The screen grid scaling parameter is estimated using high plate voltage measurements where screen current behavior is most stable. This pentode-specific parameter requires previously estimated triode parameters.

**Key Method Features:**
- Uses highest plate voltage point per series for stability
- Calculates fundamental current: $I_{pk} = E_1^{E_x}$ using triode parameters
- Direct calculation: $K_{g2} = \frac{I_{pk} \times 1000}{I_{s,measured}}$
- Requires pentode measurements with screen current data
- Averages across multiple grid voltage series

**Two-Stage Workflow**:
1. Measure pentode in **triode mode** (screen connected to plate) → estimate ($\mu$, $E_x$, $K_{g1}$, $K_p$, $K_{vb}$)
2. Measure pentode in **pentode mode** (separate screen voltage) → estimate $K_{g2}$

📖 **[Complete Kg2 estimation documentation](docs/estimate-kg2.md)**

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

**Detailed Parameter Estimation Documentation:**

For comprehensive documentation on space charge parameter estimation:
- [Derk Model αs and β Estimation](docs/derk/estimate-alphas-beta.md) - Hyperbolic decay for general pentodes
- [DerkE Model αs and β Estimation](docs/derke/estimate-alphas-beta.md) - Exponential decay for beam tetrodes

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

## Development

### Prerequisites

- Node.js 18 or higher
- npm 9 or higher
- Angular CLI 20+

### Installation

```bash
# Install dependencies
npm install

# Install Playwright browsers for e2e tests
npm run e2e:install
```

### Development Server

```bash
npm start
```

Navigate to `http://localhost:4200/`. The application will automatically reload if you change any source files.

### Testing

#### Unit Tests

Run unit tests with Karma and Jasmine:

```bash
npm test
```

Unit tests cover:
- Mathematical algorithms (Powell, Levenberg-Marquardt)
- Tube models (Norman-Koren, Derk)
- Services (data management, file parsing, authentication)

#### End-to-End Tests

Run e2e tests with Playwright:

```bash
# Run all e2e tests (headless)
npm run e2e

# Run with interactive UI (recommended for development)
npm run e2e:ui

# Run in headed mode (see browser)
npm run e2e:headed

# Run specific browser
npm run e2e:chromium
npm run e2e:firefox
npm run e2e:webkit

# Debug tests
npm run e2e:debug

# View test report
npm run e2e:report
```

E2E tests cover:
- Application routing and navigation
- Tube list browsing and search
- Tube editor CRUD operations
- File upload for triode/pentode
- Plot visualization
- SPICE parameter calculation
- Local storage persistence

📖 **[Complete E2E testing documentation](e2e/README.md)**  
📖 **[E2E setup guide](e2e/SETUP.md)**

#### Linting

Run ESLint code analysis:

```bash
npm run lint
```

The project uses ESLint v9 with strict style rules (4-space indentation, Stroustrup brace style, required semicolons).

### Build

```bash
# Production build
npm run build

# Build in watch mode
npm run watch
```

Build artifacts are stored in the `dist/` directory.

### Project Structure

```
src/
├── app/
│   ├── components/        # Angular components (tube editor, list, plots)
│   ├── services/          # Services (data, auth, Firebase, analytics)
│   └── workers/           # Web workers for optimization
│       ├── algorithms/    # Mathematical algorithms
│       ├── models/        # Tube models
│       └── estimates/     # Parameter estimation
├── environments/          # Environment configurations
└── test-assets/          # Test measurement files (.utd)

e2e/
├── fixtures/             # Test data and fixtures
├── helpers/              # Test helper functions
├── page-objects/         # Page Object Model classes
└── tests/                # E2E test specifications
```

### Contributing

1. Follow the ESLint configuration strictly (`npm run lint`)
2. Write unit tests for all algorithms and business logic
3. Add e2e tests for new features
4. Document mathematical models in `docs/`
5. Update README for significant changes
