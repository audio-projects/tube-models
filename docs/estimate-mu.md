# Amplification Factor (μ) Estimation

## Overview

The amplification factor (μ) estimation is a critical first step in vacuum tube parameter extraction. This document describes the implementation of the Derk Reefman methodology for estimating μ using measurement data at 5% of maximum plate current, as described in "Spice models for vacuum tubes using the uTracer" (page 35). The estimator only runs when `initial.mu` is unset; pre-seeded values bypass the calculation.

## Theoretical Foundation

### Definition

The amplification factor (μ) represents the ratio of changes in plate voltage to changes in grid voltage required to maintain constant plate current:

$$\mu = -\frac{\Delta V_a}{\Delta V_g}\bigg|_{I_p = \text{constant}}$$

### Physical Significance

- **Voltage amplification**: Indicates how effectively the grid controls plate current compared to plate voltage
- **Tube geometry**: Reflects the physical spacing and geometry of the grid-cathode-plate structure
- **Operating point independent**: μ is largely constant across the tube's operating range (especially in triodes)

## Methodology: Derk Reefman Approach

### Key Innovation

Instead of traditional cutoff-based methods, this approach uses measurements at **5% of maximum current**. This provides:

✅ **Superior noise immunity**: Measurements well above noise floor  
✅ **Consistent measurement level**: Same current across different grid voltages  
✅ **Robust interpolation**: Avoids cutoff region uncertainty  
✅ **Universal applicability**: Works for triodes, pentodes, and tetrodes

### Mathematical Basis

For two measurement points at the same plate current but different grid voltages:

$$\mu_{est} = -\frac{V_{a2} - V_{a1}}{V_{g2} - V_{g1}}$$

where:
- $V_{a1}, V_{a2}$ = plate voltages at the target current (5% of maximum)
- $V_{g1}, V_{g2}$ = grid voltages for the two measurement curves
- Target current = 0.05 × maximum observed plate current

## Algorithm Steps

### 1. Find Maximum Plate Current

The algorithm scans all measurement files and series to identify the maximum observed plate current:

$$I_{p,max} = \max_{files, series, points} \{I_p\}$$

This establishes the reference for the target current calculation.

### 2. Set Target Current Level

Following Derk Reefman's methodology, the target current is set to 5% of the maximum:

$$I_{target} = 0.05 \times I_{p,max}$$

This level ensures:
- Measurements well above the noise floor
- Sufficient space charge effects for accurate μ determination
- Consistent comparison across different grid voltage curves

### 3. Extract Points at Target Current

For each measurement series (representing a constant grid voltage curve):

**Data Organization:**
- Points are sorted in-place by increasing plate voltage (`ep`)
- For each series, identify two consecutive measurement points that bracket the target current

**Current Calculation:**

The implementation combines plate and optional screen currents for every point. For **triodes**, the screen current term is undefined, so the total reduces to the measured plate current. For **pentodes and tetrodes**, the screen contribution is automatically included, providing a better measure of the cathode current controlled by the grid voltage.

**Grid Voltage Adjustment:**
$$V_{g,corrected} = (V_{g,measured} \text{ or } 0) + V_{g,offset}$$

The offset corrects for measurement calibration differences between files. If a series omits an explicit grid voltage, the implementation treats the missing value as 0 before applying the file-level offset.

### 4. Linear Interpolation

For each series where two points bracket the target current, interpolate to find the exact plate voltage:

**Linear Relationship:**

Given two measurement points $(V_{a,lower}, I_{p,lower})$ and $(V_{a,upper}, I_{p,upper})$:

$$I_p = m \cdot V_a + n$$

where:
$$m = \frac{I_{p,upper} - I_{p,lower}}{V_{a,upper} - V_{a,lower}}$$

$$n = I_{p,upper} - m \cdot V_{a,upper}$$

**Solving for Plate Voltage at Target Current:**

$$V_{a,interpolated} = \frac{I_{target} - n}{m}$$

This produces a point at exactly the target current for the given grid voltage:
$$P_i = (V_{a,interpolated}, V_{g,i}, I_{target})$$

### 5. Calculate μ from Point Pairs

After collecting interpolated points from multiple grid voltage series:

**Point Selection:**
- Points are sorted by **absolute grid voltage** magnitude: $|V_g|$
- The **two lowest** $|V_g|$ values are selected for calculation
- **Rationale**: Lower grid voltages provide better measurement quality and less space charge distortion

**Amplification Factor Calculation:**

Using the two selected points with lowest $|V_g|$:

$$\mu = -\frac{V_{a,2} - V_{a,1}}{V_{g,2} - V_{g,1}}$$

where:
- $V_{a,1}, V_{a,2}$ are the interpolated plate voltages
- $V_{g,1}, V_{g,2}$ are the grid voltages (with $|V_{g,1}| < |V_{g,2}|$)

**Sign Convention:**

The negative sign accounts for the inverse relationship: more negative grid voltage requires higher plate voltage to maintain constant current.

### 6. Finalize Estimate

If sufficient data is available (at least 2 grid voltage series), the calculated μ value is used:

$$\mu_{final} = \mu_{calculated}$$

Otherwise, a default value is provided:

$$\mu_{default} = 50$$

This default represents a typical mid-range amplification factor for common triodes and pentodes.

## Supported Measurement Types

The function processes the following uTracer measurement configurations:

| Measurement Type | Description | Usage |
|------------------|-------------|-------|
| `IP_VA_VG_VH` | Triode plate characteristics: Ia(Va, Vg) with Vh constant | Standard triode μ estimation |
| `IP_VG_VA_VH` | Triode grid characteristics: Ia(Vg, Va) with Vh constant | Alternative triode format |
| `IPIS_VAVS_VG_VH` | Pentode in triode connection: Ia(Va=Vs, Vg) + Is(Va=Vs, Vg) | Pentode connected as triode |
| `IPIS_VA_VG_VS_VH` | Pentode plate characteristics: Ia(Va, Vg), Is(Va, Vg) with Vs constant | Standard pentode operation |
| `IPIS_VG_VA_VS_VH` | Pentode grid characteristics: Ia(Vg, Va), Is(Vg, Va) with Vs constant | Pentode grid sweep |
| `IPIS_VAVS_VG_VH` | Combined pentode measurements: Ia(Vg, Va=Vs) + Is(Vg, Va=Vs) | Pentode triode mode |

## Current Calculation Strategy

### Triodes
Uses plate current only.

### Pentodes
Uses total cathode current (plate + screen).

**Rationale:** In pentodes, electrons are collected by both plate and screen. Using total current provides a better measure of space charge effects controlled by the grid voltage.

## Practical Example: ECC82 μ Estimation

### Input Data

- **Maximum plate current**: 25.2 mA
- **Target current** (5%): 1.26 mA
- **Measurement type**: IP_VA_VG_VH (triode plate characteristics)
- **Grid voltage range**: -2V to -7V

### Interpolated Points at 1.26 mA

| Grid Voltage | Plate Voltage | Point |
|--------------|---------------|-------|
| -2.0V        | 24.3V         | mup[0] |
| -3.0V        | 37.1V         | mup[1] |
| -4.0V        | 49.8V         | mup[2] |
| -5.0V        | 62.5V         | mup[3] |
| -6.0V        | 75.2V         | mup[4] |
| -7.0V        | 87.9V         | mup[5] |

### Calculation

Using the two lowest absolute grid voltages (-2V and -3V):

$$\mu_{est} = -\frac{V_{a,Vg=-3} - V_{a,Vg=-2}}{V_{g=-3} - V_{g=-2}}$$

$$\mu_{est} = -\frac{37.1 - 24.3}{-3.0 - (-2.0)} = -\frac{12.8}{-1.0} = 12.8$$

### Results

- **Estimated μ**: 12.8
- **ECC82 datasheet μ**: ~12.5
- **Accuracy**: Within 2.4% of published value
- **Consistency**: High (multiple grid pairs give similar results)

### Verification with Other Grid Pairs

| Grid Pair | $V_{a1}$ (V) | $V_{a2}$ (V) | $\Delta V_a$ | $\Delta V_g$ | μ |
|-----------|--------------|--------------|--------------|--------------|-----|
| (-2,-3)   | 24.3         | 37.1         | 12.8         | -1.0         | 12.8 |
| (-3,-4)   | 37.1         | 49.8         | 12.7         | -1.0         | 12.7 |
| (-4,-5)   | 49.8         | 62.5         | 12.7         | -1.0         | 12.7 |
| (-5,-6)   | 62.5         | 75.2         | 12.7         | -1.0         | 12.7 |
| (-6,-7)   | 75.2         | 87.9         | 12.7         | -1.0         | 12.7 |

**Average**: 12.72 (standard deviation: 0.045)

## Trace Information

When tracing is enabled, the algorithm stores diagnostic information including:

- **Maximum observed plate current** ($I_{p,max}$)
- **Target current value** ($I_{target} = 0.05 \times I_{p,max}$)
- **Array of interpolated points** at the target current for each grid voltage

This diagnostic data enables:
- **Algorithm visualization**: Plot the interpolated points to verify extraction
- **Quality assessment**: Verify point distribution across grid voltage range
- **Debugging**: Diagnose estimation issues and data quality problems

## Edge Cases and Error Handling

### Insufficient Data Points

**Requirement**: At least **2 grid voltage series** are needed to calculate μ.

**Behavior**:
- If sufficient data exists: Use the calculated value from voltage differences
- If insufficient data: Return default value

$$\mu_{final} = \begin{cases} 
\mu_{calculated} & \text{if } N_{series} \geq 2 \\ 
50 & \text{otherwise}
\end{cases}$$

**Default value justification**: 50 represents a typical mid-range triode/pentode amplification factor suitable for initial optimization.

### No Bracketing Points Found

If no measurement points bracket the target current (5% of maximum) for a particular grid voltage series, that series is skipped. The algorithm continues processing remaining series.

**Condition for valid bracketing**:
$$I_{p,lower} \leq I_{target} \leq I_{p,upper}$$

### Single Grid Voltage Series

Requires at least **2 series** at different grid voltages to calculate the voltage difference ratio. Single series measurements return the default value.

### Zero or Negative Currents

**Handling strategy**:
- Points with zero current cannot bracket the positive target current and therefore do not contribute
- Negative current measurements are not clamped; they may appear as the lower bound, but only series that cross the target current influence the result
- The bracketing requirement ($I_{p,lower} \leq I_{target} \leq I_{p,upper}$) ensures the calculation proceeds only when the series reaches or exceeds the target current

## Advantages Over Traditional Methods

| Aspect | Traditional (Cutoff-Based) | Derk Reefman (5% Method) |
|--------|---------------------------|--------------------------|
| **Measurement region** | Near cutoff (low current) | 5% of maximum current |
| **Signal-to-noise** | Poor (near noise floor) | Excellent (well above noise) |
| **Cutoff detection** | Required (uncertain) | Not needed |
| **Consistency** | Variable (depends on cutoff definition) | High (fixed current level) |
| **Tube type support** | Limited (triodes only) | Universal (triodes, pentodes, tetrodes) |
| **Interpolation accuracy** | Low (sparse data) | High (dense measurements) |

## Integration with Other Estimators

The μ estimation is performed **first** in the parameter estimation chain, as subsequent estimators depend on the μ value:

**Estimation Sequence**:

1. **$\mu$ Estimation**: Calculate amplification factor (independent)
2. **$E_x$ and $K_{g1}$ Estimation**: Uses $\mu$ in log-linear regression
3. **$K_p$ Estimation**: Uses $\mu$, $E_x$, and $K_{g1}$ for knee parameter
4. **$K_{vb}$ Estimation**: Uses all previous parameters for voltage balance

This sequential dependency means errors in μ estimation propagate through subsequent calculations, making accurate μ determination critical for overall model quality.

## Code Location

- **Implementation**: `/src/app/workers/estimates/estimate-mu.ts`
- **Tests**: `/src/app/workers/estimates/estimate-mu.spec.ts`
- **Usage**: Called from `/src/app/workers/estimates/estimate-triode-parameters.ts`

## References

- Derk Reefman, "Spice models for vacuum tubes using the uTracer", page 35
- Norman Koren, "Improved vacuum tube models for SPICE simulations"
- Child-Langmuir Law and space charge theory

## Related Documentation

- [Norman Koren Triode Model](norman-koren-triode-model.md)
- [Ex/Kg1 Estimation](estimate-ex-kg1.md)
- [Kp Estimation](estimate-kp.md)
- [Kvb Estimation](estimate-kvb.md)
