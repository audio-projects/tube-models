# Tube Models

[![CI Build](https://github.com/audio-projects/tube-models/actions/workflows/main.yml/badge.svg)](https://github.com/audio-projects/tube-models/actions/workflows/main.yml)

A comprehensive web application for vacuum tube (electron tube) mathematical modeling and characteristic analysis. This tool enables engineers and audio enthusiasts to analyze tube behavior from measurement data and generate SPICE-compatible circuit simulation parameters.

## Theoretical Foundation

This application implements advanced mathematical models based on the pioneering work of **Norman Koren** and enhanced by **Derk Reefman's** theoretical extensions. The models address fundamental limitations of earlier SPICE models and provide physically accurate representations of vacuum tube behavior across all operating regions.

### Key Theoretical Principles

**Constant Space Charge**: The foundation concept for pentode modeling, where total cathode current remains largely independent of plate voltage for a given screen voltage. This principle, well-established both experimentally and theoretically, enables accurate modeling of electron flow distribution between plate and screen electrodes.

**Space Charge Law**: Based on the Child-Langmuir law, the models account for space charge effects that govern electron flow from cathode to plate, including the non-linear relationship between applied voltages and resulting currents.

**Island Effect**: The models capture the characteristic "island" behavior (extra curvature at low plate current and high negative grid voltage), similar to remote cut-off pentodes, providing excellent accuracy across the complete operating range.

## Overview

TubeModels implements sophisticated mathematical models to characterize vacuum tube behavior based on experimental measurement data. The application supports triodes, pentodes, and tetrodes, providing accurate mathematical representations suitable for circuit simulation and audio amplifier design.

## Supported Tube Models

### Norman Koren Triode Model

The foundation triode model based on Norman Koren's research. This model represents the physical behavior of a triode vacuum tube by modeling the space charge effects and the relationship between grid voltage, plate voltage, and plate current.

**Physical Principle:**

The triode model is based on the Child-Langmuir space charge law and accounts for the electrostatic effects of the grid on the electron flow from cathode to plate. The model captures the non-linear relationship between applied voltages and the resulting plate current.

**Mathematical Foundation:**

$$E_1 = \frac{V_p \cdot \ln\left(1 + \exp\left(K_p \cdot \left(\frac{1}{\mu} + \frac{V_g}{\sqrt{K_{vb} + V_p^2}}\right)\right)\right)}{K_p}$$

$$I_p = \frac{E_1^{E_x}}{K_{g1}} \quad \text{when } E_1 > 0$$

**Model Parameters (Physical Interpretation):**

- **$\mu$**: **Amplification factor** - The intrinsic voltage gain of the tube, representing the ratio of plate voltage change to grid voltage change required to maintain constant plate current. This is a fundamental tube characteristic determined by electrode geometry.
- **$E_x$**: **Space charge exponent** - Controls the curvature of the plate characteristic curves. This parameter accounts for the space charge effects in the tube, typically ranging from 1.2 to 1.6 for most triodes.
- **$K_{g1}$**: **Transconductance scaling factor** - Determines the current magnitude and relates to the tube's transconductance (gm). This parameter scales the theoretical current to match measured values.
- **$K_p$**: **Knee sharpness parameter** - Controls the transition region behavior between cutoff and saturation. Higher values create sharper transitions in the characteristic curves.
- **$K_{vb}$**: **Voltage normalization parameter** - A voltage scaling factor that influences the model's response to plate voltage variations. This parameter helps match the model to the tube's actual voltage sensitivity.

### Norman Koren Pentode Models

#### Standard Pentode Model

Extends the triode model for pentode operation with screen grid effects. The pentode adds a positively charged screen grid (G2) between the control grid (G1) and plate, which reduces the plate-to-grid capacitance and provides better high-frequency performance.

**Physical Principle:**
The screen grid accelerates electrons toward the plate while shielding the control grid from plate voltage variations. This creates two distinct current paths: electrons that reach the plate (plate current) and electrons captured by the screen grid (screen current). The model accounts for the complex electrostatic interactions between all electrodes.

**Key Equations:**

$$E_1 = \frac{V_s \cdot \ln\left(1 + \exp\left(K_p \cdot \left(\frac{1}{\mu} + \frac{V_g}{V_s}\right)\right)\right)}{K_p}$$

$$I_p = \frac{E_1^{E_x} \cdot \arctan\left(\frac{V_p}{K_{vb}}\right)}{K_{g1}}$$

$$I_s = \frac{{(V_g + \frac{V_s}{\mu})}^{E_x}}{K_{g2}}$$

**Physical Meaning:**

- The **first equation** represents the effective driving voltage considering both control grid and screen grid effects
- The **arctangent term** in the plate current equation models the saturation behavior as plate voltage increases
- The **screen current equation** accounts for electrons captured by the screen grid, influenced by both grid and screen voltages

#### New Pentode Model

Enhanced pentode model using the $I_{pk}$ current function, which provides improved accuracy for modern pentode designs by better modeling the interaction between screen voltage and cathode current.

**Mathematical Foundation:**

$$E_1 = \frac{V_s \cdot \ln\left(1 + \exp\left(K_p \cdot \left(\frac{1}{\mu} + \frac{V_g}{\sqrt{K_{vb} + V_s^2}}\right)\right)\right)}{K_p}$$

$$I_{pk} = E_1^{E_x}$$

$$I_p = \frac{I_{pk} \cdot \arctan\left(\frac{V_p}{K_{vb}}\right)}{K_{g1}}$$

$$I_s = \frac{I_{pk}}{K_{g2}}$$

**Enhanced Features:**

- **Improved Screen Voltage Modeling**: The $\sqrt{K_{vb} + V_s^2}$ term better represents the electrostatic field distribution in modern pentode designs
- **Unified Current Source**: The $I_{pk}$ function represents the total cathode emission current, which is then distributed between plate and screen
- **Better High-Voltage Accuracy**: More accurate modeling of pentode behavior at high plate voltages

**Additional Parameters:**

- **$K_{g2}$**: Screen current scaling factor - determines the fraction of total cathode current captured by the screen grid

### Derk Pentode Model

An alternative pentode modeling approach incorporating secondary emission effects and advanced electrode interactions. This model extends the basic pentode equations to account for complex physical phenomena that occur in real tubes, particularly at high voltages and currents.

**Physical Principles:**

Secondary emission occurs when high-energy electrons striking the plate cause additional electrons to be emitted. These secondary electrons can be captured by the screen grid if it's at a higher potential than the plate, effectively reducing the net plate current. The Derk model mathematically represents these complex interactions.

**Mathematical Foundation:**

$$E_1 = \frac{V_s \cdot \ln\left(1 + \exp\left(K_p \cdot \left(\frac{1}{\mu} + \frac{V_g}{\sqrt{K_{vb} + V_s^2}}\right)\right)\right)}{K_p}$$

$$I_{pk} = E_1^{E_x}$$

$$S_E = s \cdot V_p \cdot \left(1 + \tanh\left(-\alpha_p \cdot \left(V_p - \left(\frac{V_s}{\lambda} - v \cdot V_g - w\right)\right)\right)\right)$$

$$\alpha = 1 - \frac{K_{g1} \cdot (1 + \alpha_s)}{K_{g2}}$$

$$I_p = I_{pk} \cdot \left(\frac{1}{K_{g1}} - \frac{1}{K_{g2}} + \frac{a \cdot V_p}{K_{g1}} - \frac{S_E}{K_{g2}} - \frac{\alpha/K_{g1} + \alpha_s/K_{g2}}{1 + \beta \cdot V_p}\right)$$

$$I_s = \frac{I_{pk} \cdot \left(1 + \frac{\alpha_s}{1 + \beta \cdot V_p} + S_E\right)}{K_{g2}}$$

**Enhanced Features:**
- **Secondary Emission Modeling**: The $S_E$ term accounts for secondary electron emission from the plate surface, which becomes significant at high plate voltages. When high-energy electrons strike the plate, they can cause additional electrons to be emitted, which may be captured by the screen grid if at higher potential.
- **Voltage-Dependent Current Distribution**: The complex current distribution equations model how electrons are partitioned between plate and screen under various voltage conditions, accounting for the "Durchgriff" (penetration factor) of the plate.
- **Non-Linear Interactions**: The hyperbolic tangent function in the secondary emission term provides smooth transitions between different operating regimes, modeling the cross-over region where secondary electrons transition from being attracted back to the plate to being captured by the screen.

**Advanced Parameters (Physical Meaning):**

- **$a$**: **Plate voltage coefficient** - Models the direct effect of plate voltage on current distribution, accounting for non-zero "Durchgriff"
- **$\alpha_s$**: **Screen modulation factor** - Represents the screen grid's influence on current partitioning and space charge effects
- **$\beta$**: **Voltage dependency parameter** - Controls how current distribution changes with applied voltages, particularly important for power tubes
- **$s$, $\alpha_p$, $\lambda$, $v$, $w$**: **Secondary emission parameters** - Collectively model the complex secondary emission characteristics:
  - $\lambda$: **Screen effectiveness factor** - Typically ≈ 1 for beam tetrodes, up to 20 for pentodes with suppressor grids
  - $v$: **Space charge influence** - Models how grid voltage affects secondary emission suppression (typically 1-4)
  - $w$: **Geometric offset** - Accounts for tube geometry effects on secondary emission

**Physical Phenomena Modeled:**

- **Critical Compensation**: Models the transition between "over-compensated" (rounded knee) and "critically compensated" (sharp knee) pentode characteristics
- **Cross-over Voltage**: The point where secondary electrons transition from returning to the plate to being captured by the screen grid
- **Virtual Cathode Effects**: In beam tetrodes, accounts for the formation of virtual cathodes in the space between screen and plate at low plate voltages

### DerkE Pentode Model

An enhanced version of the Derk model specifically designed for tubes exhibiting pronounced "kink" behavior at low plate voltages, particularly beam-pentodes and certain small-signal pentodes like the EF80.

**Physical Principle:**

The DerkE model addresses the limitation of the standard Derk model when dealing with tubes that don't exhibit smooth current dependence on plate voltage. This phenomenon, known as "critical compensation" among beam-tetrode researchers, occurs when the rounded knee of a pentode creates a smaller region of linear $I_a - V_a$ operation.

**Mathematical Foundation:**

The key difference from the Derk model lies in the screen current formulation and the space charge current reduction term, with optional secondary emission effects:

$$I_{g2}(V_a) = \frac{I_{pk}}{K_{g2}} \left(1 + \alpha_s e^{-(\beta V_a)^{3/2}} + P_{sec}\right)$$

$$I_a(V_a) + I_{g2}(V_a) = \frac{I_{pk}}{K_{g1}} \left(1 + A V_a - \alpha e^{-(\beta V_a)^{3/2}}\right)$$

$$I_a(V_a) = I_{pk} \left(\frac{1}{K_{g1}} - \frac{1}{K_{g2}} + \frac{A V_a}{K_{g1}} - \frac{P_{sec}}{K_{g2}} - \frac{\alpha e^{-(\beta V_a)^{3/2}}}{K_{g1}} \left(\frac{1}{K_{g1}} + \frac{\alpha_s}{K_{g2}}\right)\right)$$

**Secondary Emission Term:**

$$P_{sec} = s \cdot V_a \cdot \left(1 + \tanh\left(-\alpha_p \cdot \left(V_a - \left(\frac{V_{g2}}{\lambda} - \nu V_{g1} - w\right)\right)\right)\right)$$

where:
- **$s$**: Secondary emission coefficient - linear scaling factor for emission current vs plate voltage
- **$\alpha_p$**: Cross-over sharpness parameter - controls the transition width (typically ≈ 0.2)
- **$\lambda$**: Screen effectiveness factor - screen grid influence on cross-over voltage 
- **$\nu$**: Space charge modulation factor - how grid voltage affects secondary emission suppression (1-4)
- **$w$**: Geometric offset parameter - accounts for tube construction effects on cross-over voltage

**Key Mathematical Differences:**

- **Exponential Term**: Uses $e^{-(\beta V_a)^{3/2}}$ instead of $\frac{1}{1 + \beta V_a}$ for modeling low-voltage behavior
- **Virtual Diode Behavior**: The $(3/2)$ exponent reflects the Child-Langmuir law for space-charge-limited current in the virtual diode formed between screen and plate
- **Langmuir Scaling**: At low plate voltages, models the characteristic $I_a \propto (\beta V_a)^{3/2}$ behavior
- **Saturation Modeling**: The exponential term provides smooth transition from space-charge-limited to saturated operation
- **Secondary Emission Integration**: Includes optional $P_{sec}$ term for tubes exhibiting significant secondary emission effects at higher voltages

**Physical Interpretation:**

- **Virtual Cathode Formation**: At low plate voltages, space charge creates a virtual cathode between screen and plate where electron velocity approaches zero
- **Kink Behavior**: The sharp transition when the virtual cathode disappears, causing the characteristic "knee" in beam tetrode curves
- **Critical vs Over-Compensation**: Distinguishes between sharply defined knees (critical compensation) and rounded transitions (over-compensation)
- **Secondary Emission Physics**: The $P_{sec}$ term models how high-energy electrons create secondary electrons at the plate surface
- **Cross-over Voltage**: The hyperbolic tangent function captures the voltage where secondary electrons transition from screen capture to plate return
- **Space Charge Suppression**: Models how negative grid voltages create space charge that suppresses secondary electron emission

**Model Selection Criteria:**

- **Use DerkE for**: Tubes showing pronounced kinks at low plate voltages (EF80, beam tetrodes)
- **Use Derk for**: Tubes with smooth current transitions (most small-signal pentodes like EF86)
- **Visual Inspection**: Pentodes with circular anodes are typically "real" pentodes (use Derk), while those with metal strip anodes may behave as beam pentodes (use DerkE)

**Enhanced Accuracy:**

The DerkE model provides superior fitting for tubes where the standard inverse relationship between screen current and plate voltage breaks down, particularly important for accurate modeling of audio power tubes and RF pentodes operating at low plate voltages.

## Mathematical Algorithms

### Optimization Methods

#### Powell Algorithm

Derivative-free optimization method for parameter fitting, selected for its robustness with vacuum tube measurement data:

**Mathematical Foundation:**

The Powell algorithm uses conjugate direction methods to minimize the objective function without requiring gradient calculations:

$$\min_{x} F(x) = \frac{1}{2} \sum_{i=1}^{m} r_i(x)^2$$

where $r_i(x)$ are the residuals between measured and modeled currents.

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

Automated algorithms provide physically meaningful starting points for optimization:

**Physical Constraint Analysis:**

The estimation process uses limiting conditions to extract initial parameter values:

**For Amplification Factor ($\mu$):**

Using the limiting condition where $V_a^2 \gg K_{vb}$ and $K_p(1/\mu + V_g/V_a) \ll 1$:

$$E_1 \approx V_a(1/\mu + V_g/V_a) = V_a/\mu + V_g$$

This allows direct extraction of $\mu$ from the slope of plate current vs. grid voltage characteristics.

**For Screen Current Scaling ($K_{g2}$):**

At high plate voltages, screen current approaches:

$$I_{g2}(V_a \gg 1) \approx \frac{I_{P,Koren}(V_{g1}, V_{g2})}{K_{g2}}$$

**For Voltage Dependency ($A$):**

The plate current slope at high voltages determines the $A$ parameter:

$$\frac{\partial I_a(V_a \gg 1)}{\partial V_a} = I_{P,Koren} \frac{A}{K_{g1}}$$

**Features:**
- **Physical Constraints**: Ensures parameters remain within realistic ranges based on tube physics
- **Data-Driven Estimates**: Analyzes measurement characteristics using mathematical limiting conditions
- **Convergence Acceleration**: Good starting points dramatically improve optimization success rates
- **Automatic Validation**: Cross-checks parameter estimates against known physical bounds

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

