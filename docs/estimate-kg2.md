# Screen Grid Scaling Parameter ($K_{g2}$) Estimation

## Overview

The screen grid scaling parameter $K_{g2}$ is a pentode-specific parameter that scales the screen current in the Norman-Koren and Derk pentode models. This document describes the estimation methodology that uses high plate voltage measurements where screen current behavior is most stable, leveraging previously estimated triode parameters.

## Theoretical Foundation

### Definition

The screen grid scaling parameter $K_{g2}$ appears in pentode models to relate the fundamental current $I_{pk}$ to the screen current:

**Norman-Koren Pentode Model**:
$$I_s = \frac{I_{pk}}{K_{g2}}$$

**Derk Pentode Models**:
$$I_s = \frac{I_{pk} \cdot (1 + \alpha_s/(1 + \beta V_p) + S_E)}{K_{g2}}$$

where $I_{pk}$ is the fundamental Koren current based on screen voltage and grid voltage.

### Physical Significance

**Current Scaling**:
- $K_{g2}$ scales the magnitude of screen current relative to the fundamental current
- Similar role to $K_{g1}$ for plate current, but for the screen grid
- Reflects the screen grid's geometry and electron collection efficiency

**Physical Interpretation**:
- **Small $K_{g2}$**: High screen current relative to total cathode emission
- **Large $K_{g2}$**: Low screen current, most electrons reach the plate
- Related to screen grid transparency and electron interception

**Typical Values**:
- **Remote cutoff pentodes**: 100-500 (higher screen current)
- **Sharp cutoff pentodes**: 500-2000 (moderate screen current)
- **Beam power tubes**: 2000-10000 (low screen current, high plate current)

### Role in Pentode Operation

The screen grid serves multiple functions:
1. **Accelerate electrons** from cathode toward plate
2. **Shield control grid** from plate voltage variations
3. **Intercept some electrons** (screen current)
4. **Allow most electrons through** to plate (high transparency)

The $K_{g2}$ parameter quantifies the electron interception characteristic.

## Methodology: High Voltage Measurement

### Key Innovation

At high plate voltages, the screen current relationship simplifies, allowing direct extraction of $K_{g2}$:

✅ **Uses high plate voltage points**: Where screen current is most stable  
✅ **Leverages triode parameters**: Uses previously estimated $\mu$, $E_x$, $K_p$, $K_{vb}$  
✅ **Direct calculation**: No iterative optimization required  
✅ **One point per series**: Avoids averaging noise-prone low-voltage data

### Simplified Relationship

At high plate voltages, the screen current in pentode models approximates:

$$I_s \approx \frac{I_{pk}(V_g, V_s)}{K_{g2}}$$

**Assumption**: At high $V_a$, secondary emission and space charge redistribution effects are minimal or constant.

### Solving for $K_{g2}$

Rearranging the simplified equation:

$$K_{g2} = \frac{I_{pk}(V_g, V_s)}{I_{s,measured}}$$

where:
- $I_{pk}$ is calculated using triode parameters
- $I_{s,measured}$ is the observed screen current

### Fundamental Current $I_{pk}$

The fundamental Koren current is calculated using:

$$E_1 = \frac{V_s \cdot \ln\left(1 + \exp\left(K_p \cdot \left(\frac{1}{\mu} + \frac{V_g}{\sqrt{K_{vb} + V_s^2}}\right)\right)\right)}{K_p}$$

$$I_{pk} = \begin{cases} 
E_1^{E_x} & \text{if } E_1 > 0 \\ 
0 & \text{otherwise}
\end{cases}$$

**Note**: This uses screen voltage $V_s$ instead of plate voltage $V_a$, as screen voltage primarily controls cathode emission in pentodes.

## Algorithm Steps

### 1. Verify Dependencies

The estimation requires four previously calculated triode parameters:

$$\mu, \quad E_x, \quad K_p, \quad K_{vb} \quad \text{must all be defined}$$

**Error handling**: If any are undefined, throw error "Cannot estimate kg2 without kp, mu, kvb and ex"

**Rationale**: The $I_{pk}$ calculation requires these parameters from triode-mode measurements.

### 2. Filter Measurement Types

Only process files with pentode measurements containing screen current data:

**Valid measurement types**:
- `IPIS_VA_VG_VS_VH`: Plate characteristics with screen data
- `IPIS_VA_VS_VG_VH`: Alternative axis configuration
- `IPIS_VAVS_VG_VH`: Triode-strapped configuration

**Requirement**: Measurements must include separate $I_s$ (screen current) data.

### 3. Process Each Series

For each measurement series (constant grid and screen voltages):

**Sort by plate voltage**: Order points by increasing $V_a$ to facilitate high-voltage selection.

**Select highest voltage point**: Process points in **reverse order** (highest $V_a$ first) to prioritize stable high-voltage measurements.

### 4. Apply Validity Conditions

For each measurement point:

**Screen current requirement**:
$$I_{s,measured} > 0$$

Only points with positive screen current are valid for estimation.

**Grid voltage correction**:
$$V_{g,corrected} = V_{g,measured} + V_{g,offset}$$

### 5. Calculate Fundamental Current $I_{pk}$

Using the triode parameters and screen voltage:

**Step 1: Compute effective voltage**
$$\xi = K_p \cdot \left(\frac{1}{\mu} + \frac{V_{g,corrected}}{\sqrt{K_{vb} + V_s^2}}\right)$$

**Step 2: Calculate $E_1$**
$$E_1 = \frac{V_s}{K_p} \cdot \ln(1 + e^\xi)$$

**Step 3: Apply power law**
$$I_{pk} = \begin{cases} 
E_1^{E_x} & \text{if } E_1 > 0 \\ 
0 & \text{otherwise}
\end{cases}$$

### 6. Estimate $K_{g2}$ for This Point

Calculate the screen grid scaling parameter:

$$K_{g2,estimate} = \frac{I_{pk} \times 1000}{I_{s,measured}}$$

**Unit conversion**: Factor of 1000 converts $I_{pk}$ (in Amperes) to match $I_s$ (in milliamperes).

**Absolute value**: 
$$K_{g2,estimate} = |K_{g2,estimate}|$$

Ensures positive parameter regardless of any sign artifacts.

### 7. Accept First Valid Estimate

For each series, use only the **first valid estimate** (highest $V_a$ point):

$$K_{g2,series} = K_{g2,estimate,first}$$

**Rationale**:
- Highest voltage point has most stable screen current
- Avoids averaging points with different characteristics
- Single point per operating condition prevents bias

**Break after first**: Once a valid estimate is found for a series, move to next series.

### 8. Average Across Series

Collect estimates from all measurement series:

$$K_{g2,final} = \frac{1}{N_{series}} \sum_{i=1}^{N_{series}} K_{g2,series,i}$$

**Averaging benefits**:
- Reduces measurement noise
- Accounts for variations across operating points (different $V_g$, $V_s$ combinations)
- Provides robust estimate

### 9. Apply Default Value if Necessary

If no valid estimates obtained:

$$K_{g2} = \begin{cases} 
\frac{1}{N} \sum K_{g2,i} & \text{if } N > 0 \\ 
1000 & \text{otherwise}
\end{cases}$$

**Default justification**: $K_{g2} = 1000$ represents a mid-range value suitable for typical pentodes and initial optimization.

## Supported Measurement Types

The function specifically processes pentode measurements with screen current data:

| Measurement Type | Description | Usage |
|------------------|-------------|-------|
| `IPIS_VA_VG_VS_VH` | Pentode plate characteristics: Ia(Va, Vg), Is(Va, Vg) with Vs constant | Primary pentode mode |
| `IPIS_VA_VS_VG_VH` | Alternative axis: Ia(Va, Vs), Is(Va, Vs) with Vg constant | Screen voltage sweep |
| `IPIS_VAVS_VG_VH` | Triode-strapped: Ia(Va=Vs, Vg) + Is(Va=Vs, Vg) | Pentode in triode connection |

**Critical requirement**: All measurement types must include separate screen current ($I_s$) measurements.

**Not supported**: Pure triode measurements (`IP_VA_VG_VH`, etc.) without screen current data.

## Practical Example: EF80 Pentode Parameter Estimation

### Input Data

**Previously estimated triode parameters** (from triode-strapped measurements):
- $\mu_{est} = 35.2$ (from μ estimation)
- $E_{x,est} = 1.42$ (from Ex/Kg1 estimation)
- $K_{p,est} = 7.8$ (from Kp estimation)
- $K_{vb,est} = 450$ (from Kvb estimation)

**Measurement data**:
- Type: IPIS_VA_VG_VS_VH (pentode plate characteristics)
- Control grid voltage range: -0.5V to -3.0V
- Screen voltage: 250V (constant)
- Plate voltage range: 50V to 300V

### Data Processing for $V_g = -1.0V$, $V_s = 250V$ Series

Selecting the highest plate voltage point with valid screen current:

| $V_a$ (V) | $I_p$ (mA) | $I_s$ (mA) | Valid? |
|-----------|------------|------------|--------|
| 300       | 8.5        | 2.3        | ✓ Selected |
| 275       | 8.2        | 2.4        | Not checked |
| 250       | 7.8        | 2.5        | Not checked |

### $I_{pk}$ Calculation

**Effective voltage term**:
$$\xi = K_p \cdot \left(\frac{1}{\mu} + \frac{V_g}{\sqrt{K_{vb} + V_s^2}}\right)$$

$$\xi = 7.8 \cdot \left(\frac{1}{35.2} + \frac{-1.0}{\sqrt{450 + 250^2}}\right)$$

$$\xi = 7.8 \cdot (0.0284 - 0.00399) = 7.8 \cdot 0.0244 = 0.190$$

**Calculate $E_1$**:
$$E_1 = \frac{250}{7.8} \cdot \ln(1 + e^{0.190}) = 32.05 \cdot \ln(1.209) = 32.05 \cdot 0.190 = 6.09$$

**Calculate $I_{pk}$**:
$$I_{pk} = E_1^{E_x} = 6.09^{1.42} = 11.8 \text{ (in Ampere-scale units)}$$

### $K_{g2}$ Estimation

$$K_{g2} = \frac{I_{pk} \times 1000}{I_{s,measured}} = \frac{11.8 \times 1000}{2.3} = 5130$$

### Results for Multiple Operating Points

| $V_g$ (V) | $V_s$ (V) | $V_a$ (V) | $I_s$ (mA) | $I_{pk}$ | $K_{g2}$ estimate |
|-----------|-----------|-----------|------------|----------|-------------------|
| -0.5      | 250       | 300       | 3.8        | 18.5     | 4868             |
| -1.0      | 250       | 300       | 2.3        | 11.8     | 5130             |
| -1.5      | 250       | 300       | 1.4        | 7.2      | 5143             |
| -2.0      | 250       | 300       | 0.8        | 4.1      | 5125             |
| -2.5      | 250       | 300       | 0.45       | 2.3      | 5111             |

### Final Estimate

**Averaged $K_{g2}$**: 5075 (standard deviation: 109)

**Analysis**:
- Consistent across control grid voltages (low variance)
- High value indicates good screen grid transparency
- Typical for small-signal pentodes
- Stable estimates validate high-voltage methodology

## Mathematical Details

### Why High Plate Voltage?

At high plate voltages:
1. **Stable screen current**: Less affected by space charge redistribution
2. **Minimal secondary emission**: Electrons reaching screen stay captured
3. **Reduced plate-screen coupling**: Screen current more directly related to $I_{pk}$
4. **Better signal-to-noise**: Stronger currents, clearer measurements

### Unit Conversion Factor

The factor of 1000 in the calculation:

$$K_{g2} = \frac{I_{pk} \times 1000}{I_s}$$

**Explanation**:
- $I_{pk}$ calculation produces result in **Ampere-scale units** (based on model formulation)
- $I_s$ measurement is in **milliamperes** (standard measurement units)
- Factor converts $I_{pk}$ to match $I_s$ units
- Results in dimensionless $K_{g2}$ (scaling factor)

### Comparison with Plate Current Scaling

**Plate current** (uses $K_{g1}$):
$$I_p = \frac{I_{pk} \cdot f(V_a)}{K_{g1}}$$

**Screen current** (uses $K_{g2}$):
$$I_s = \frac{I_{pk}}{K_{g2}}$$

**Relationship**: 
- Both scale the same fundamental current $I_{pk}$
- $K_{g2}$ typically larger than $K_{g1}$ (screen current smaller)
- Ratio $K_{g2}/K_{g1}$ indicates current distribution

## Trace Information

When tracing is enabled, the algorithm stores diagnostic information:

**For each valid estimate**:
- File name
- Estimated $K_{g2}$ value

This diagnostic data enables:
- **Operating point analysis**: See how $K_{g2}$ varies across conditions
- **Quality assessment**: Identify outliers or inconsistent estimates
- **Consistency verification**: Check stability across different $V_g$, $V_s$ combinations
- **Debugging**: Diagnose estimation issues

## Edge Cases and Error Handling

### Missing Triode Parameters

**Condition**: $\mu$, $E_x$, $K_p$, or $K_{vb}$ is undefined

**Behavior**: Throw error "Cannot estimate kg2 without kp, mu, kvb and ex"

**Rationale**: Cannot calculate $I_{pk}$ without complete triode parameter set.

### No Pentode Measurements

**Condition**: No files with valid pentode measurement types

**Behavior**: 
- No series processed
- Default value used: $K_{g2} = 1000$

**Cause**: Only triode measurements available, no screen current data.

### Zero or Missing Screen Current

**Condition**: $I_s \leq 0$ or $I_s = \text{null}$

**Behavior**: Skip that measurement point, continue to next

**Causes**:
- Measurement noise (negative values)
- Triode-only measurement (no screen grid)
- Data acquisition error

### Zero or Negative $I_{pk}$

**Condition**: Calculated $I_{pk} \leq 0$

**Behavior**: Skip that measurement point

**Causes**:
- Invalid parameter estimates from triode fitting
- Operating point outside model validity
- Extreme grid bias (cutoff region)

### No Valid Estimates

If all series fail to produce estimates:

$$K_{g2} = 1000$$

**Implications**:
- May indicate poor triode parameter estimates
- Measurements may not include high-voltage points
- Screen current data may be problematic

### Division by Very Small Screen Current

**Condition**: $I_s$ very small (near zero) leading to extremely large $K_{g2}$

**Behavior**: 
- Calculation proceeds (no explicit bounds checking)
- Outlier may affect average
- Physical reasonableness validated during optimization

**Mitigation**: Using high-voltage points where $I_s$ is more stable reduces this risk.

## Integration with Parameter Estimation Chain

The $K_{g2}$ estimation is a **pentode-specific extension** of the triode parameter chain:

**Complete Pentode Estimation Sequence**:

1. **Triode-Strapped Measurements**:
   - Measure pentode with screen connected to plate
   - $\mu$ Estimation (independent)
   - $E_x$ and $K_{g1}$ Estimation (uses $\mu$)
   - $K_p$ Estimation (uses $\mu$, $E_x$, $K_{g1}$)
   - $K_{vb}$ Estimation (uses all previous)

2. **Pentode-Specific Measurements**:
   - Measure pentode with separate screen voltage
   - **$K_{g2}$ Estimation**: Uses triode parameters (this step)

3. **Optional Derk Model Parameters**:
   - $A$ Estimation (plate voltage coefficient)
   - $\alpha_s$, $\beta$ Estimation (space charge redistribution)
   - Secondary emission parameters

**Dependencies**:
- **Requires**: Complete triode parameter set ($\mu$, $E_x$, $K_{g1}$, $K_p$, $K_{vb}$)
- **Provides**: $K_{g2}$ for pentode models
- **Measurement requirement**: Must have pentode-mode data with screen current

## Two-Stage Measurement Approach

### Stage 1: Triode-Strapped Configuration

**Setup**: Connect screen grid to plate ($V_s = V_a$)

**Purpose**:
- Tube operates as triode
- Estimate fundamental parameters ($\mu$, $E_x$, $K_{g1}$, $K_p$, $K_{vb}$)
- Simpler model, fewer parameters

**Result**: Complete triode parameter set

### Stage 2: Pentode Configuration  

**Setup**: Separate screen voltage ($V_s$ independent of $V_a$)

**Purpose**:
- Measure screen current separately
- Estimate pentode-specific parameters ($K_{g2}$, etc.)
- Full pentode behavior characterization

**Result**: Complete pentode parameter set

**Rationale** (Derk Reefman, page 36):
> "The initial parameter estimates μest, xest, kp,est, kg1,est, kVB,est in any of the pentode models can most conveniently be obtained by first strapping the pentode as a triode, and fitting the Koren triode model to the observed data."

## Physical Interpretation

### Parameter Magnitude

**Small $K_{g2}$ (< 500)**:
- High screen current relative to cathode emission
- Low screen grid transparency
- More electrons intercepted by screen
- Remote cutoff pentodes, variable-μ tubes

**Medium $K_{g2}$ (500-2000)**:
- Moderate screen current
- Good screen transparency
- Balanced current distribution
- Sharp cutoff pentodes, RF amplifiers

**Large $K_{g2}$ (> 2000)**:
- Low screen current relative to total emission
- High screen grid transparency
- Most electrons reach plate
- Beam power tubes, audio output pentodes

### Relationship to Tube Design

The $K_{g2}$ value reflects:
- **Screen grid wire spacing**: Wider spacing → higher transparency → larger $K_{g2}$
- **Screen grid wire diameter**: Thinner wires → more transparency → larger $K_{g2}$
- **Beam formation**: Beam tubes concentrate electrons → less screen interception → larger $K_{g2}$
- **Electrode alignment**: Better alignment → higher transparency → larger $K_{g2}$

## Comparison with Other Pentode Parameters

| Parameter | What It Scales | Typical Range | Estimation Method |
|-----------|---------------|---------------|-------------------|
| $K_{g1}$ | Plate current | 100-10000 | Log-linear regression |
| $K_{g2}$ | Screen current | 100-10000 | High-voltage point ratio |
| $K_{vb}$ | Voltage dependence | 50-3200 | Discrete search |
| $A$ | Plate-voltage effect | 0.0001-0.01 | Slope estimation (Derk only) |

## Advantages of High-Voltage Single-Point Method

| Aspect | This Method | Alternative Approaches |
|--------|-------------|----------------------|
| **Data used** | One high-voltage point per series | Multiple points, all voltages |
| **Stability** | Most stable screen current region | May include unstable low-voltage data |
| **Simplicity** | Direct calculation | Regression or optimization |
| **Speed** | Fast (one point per series) | Slower (multiple evaluations) |
| **Robustness** | Avoids problematic low-voltage behavior | Affected by secondary emission, space charge |

## Code Location

- **Implementation**: `/src/app/workers/estimates/estimate-kg2.ts`
- **Tests**: `/src/app/workers/estimates/estimate-kg2.spec.ts`
- **Ipk function**: `/src/app/workers/models/ipk.ts`
- **Usage**: Called from `/src/app/workers/estimates/estimate-pentode-parameters.ts`

## References

- Derk Reefman, "Spice models for vacuum tubes using the uTracer", page 36 (two-stage approach)
- Norman Koren, "Improved vacuum tube models for SPICE simulations"
- Pentode theory and screen grid operation
- Electron current distribution in multi-grid tubes

## Related Documentation

- [μ Estimation](estimate-mu.md)
- [Ex/Kg1 Estimation](estimate-ex-kg1.md)
- [Kp Estimation](estimate-kp.md)
- [Kvb Estimation](estimate-kvb.md)
- [Norman Koren Pentode Model](norman-koren-pentode-model.md)
- [Derk Pentode Model](derk-reefman-pentode-model.md)
