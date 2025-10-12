# DerkE Pentode Model: Estimating $\alpha_s$ Parameter

## Overview

This document describes the estimation of the **space charge parameter $\alpha_s$** for the **DerkE pentode model** (exponential decay variant). The DerkE model uses exponential decay of space charge effects with anode voltage, as opposed to the hyperbolic decay in the standard Derk model.

**Source:** Theory.pdf, Section 11.2.4 - Initial estimate $\alpha_{s,est}$ and $\beta_{est}$ (DerkE pentode model)

---

## Physical Context

### Space Charge in Pentode Tubes

In pentode operation, electrons emitted from the cathode form a **space charge cloud** that affects current distribution between the anode (plate) and screen grid.

**Key behavior:**
- **Low anode voltages**: Space charge effects are strong, screen current is enhanced
- **High anode voltages**: Space charge effects diminish, more electrons reach the anode
- **DerkE model**: Uses **exponential decay** $e^{-(\beta V_a)^{3/2}}$ to model this transition

### Parameter $\alpha_s$

**Physical meaning:**
- **Magnitude** of space charge contribution to screen current at very low anode voltages
- Dimensionless scaling factor (typically 0.1 to 2.0)
- Related to cathode emission density and tube geometry

**Model equation (low $V_a$):**
$$I_{g2}(V_a \approx 0) \approx \frac{I_{P,Koren}}{k_{g2}} \left(1 + \alpha_s e^{-(\beta V_a)^{3/2}}\right)$$

Where:
- $I_{g2}$: Screen grid current
- $I_{P,Koren}$: Characteristic triode current (from Norman-Koren model)
- $k_{g2}$: Screen grid transconductance parameter
- $\beta$: Space charge decay rate parameter

---

## Estimation Method (Section 11.2.4)

### Theory.pdf Equations 88-89

**Step 1: Approximate screen current at low $V_a$ (Equation 88)**

For very small anode voltages:
$$I_{g2}(V_a \approx 0) \approx \frac{I_{P,Koren}}{k_{g2}} \left(1 + \alpha_s e^{-(\beta V_a)^{3/2}}\right)$$

**Step 2: Linearization transformation**

Rearrange and take the natural logarithm:
$$\frac{I_{g2} \cdot k_{g2}}{I_{P,Koren}} - 1 = \alpha_s e^{-(\beta V_a)^{3/2}}$$

Taking logarithm of both sides:
$$\log\left(\frac{I_{g2} \cdot k_{g2}}{I_{P,Koren}} - 1\right) = \log(\alpha_s) - (\beta V_a)^{3/2}$$

**Step 3: Linear regression on transformed data**

Plot $\log\left(\frac{I_{g2,obs} \cdot k_{g2}}{I_{P,Koren,est}} - 1\right)$ as a function of $V_a^{3/2}$

This should yield a **straight line**:
$$y = b + a \cdot V_a^{3/2}$$

Where:
- **Intercept $b$**: $b = \log(\alpha_s)$
- **Slope $a$**: $a = -\beta^{3/2}$ (negative slope expected)

**Step 4: Extract parameters (Equation 89)**

From the averaged linear regression coefficients:
$$\alpha_{s,est} = e^{\langle b \rangle_{(V_{g1},V_{g2})}}$$

$$\beta_{est} = \left(\langle -a \rangle_{(V_{g1},V_{g2})}\right)^{2/3}$$

**Averaging notation:** $\langle \cdot \rangle_{(V_{g1},V_{g2})}$ means average over all grid voltage combinations.

---

## Algorithm Summary

### Prerequisites

Before estimating $\alpha_s$, the following parameters must be determined:
1. **Triode parameters**: $\mu$, $E_x$, $K_{g1}$, $K_p$, $K_{vb}$ (from triode model fit)
2. **Screen grid parameter**: $k_{g2}$ (from pentode-specific estimation)

### Step-by-Step Process

**For each measurement series** with constant $V_{g1}$ and $V_{g2}$:

1. **Filter low-voltage points**
   - Use only points where $V_a$ is small (typically $V_a < 50V$ or lowest 20% of data)
   - Ensures space charge effects dominate

2. **Calculate normalized screen current**
   $$P_{sc} = \frac{I_{g2,obs} \cdot k_{g2,est}}{I_{P,Koren,est}} - 1$$
   
3. **Apply logarithmic transformation**
   $$y = \log(P_{sc})$$
   
   **Note:** Only use points where $P_{sc} > 0$ (space charge contribution exists)

4. **Transform voltage axis**
   $$x = V_a^{3/2}$$
   
   This is the **key difference** from the Derk model (which uses $x = V_a$ directly)

5. **Linear regression**
   - Fit line: $y = a \cdot x + b$
   - Record slope $a$ and intercept $b$

6. **Average over all series**
   $$\langle a \rangle = \frac{1}{N} \sum_{i=1}^{N} a_i$$
   $$\langle b \rangle = \frac{1}{N} \sum_{i=1}^{N} b_i$$

7. **Calculate final estimates**
   $$\alpha_{s,est} = e^{\langle b \rangle}$$
   $$\beta_{est} = (\langle -a \rangle)^{2/3}$$

---

## Expected Results

### Parameter Ranges

| Parameter | Typical Range | Physical Meaning |
|-----------|---------------|------------------|
| $\alpha_s$ | 0.1 to 2.0 | Space charge magnitude (dimensionless) |
| $\beta$ | 0.01 to 0.1 | Decay rate (V⁻¹) |
| Slope $a$ | Negative | Space charge decreases with voltage |
| Intercept $b$ | $-2$ to $+1$ | Log of space charge magnitude |

### Validation Checks

**1. Slope sign**
- Slope $a$ must be **negative** (space charge decreases with voltage)
- If positive: Data may not show space charge behavior, or wrong voltage range selected

**2. Intercept range**
- Intercept $b$ should be reasonable: typically $-2 < b < 1$
- Translates to: $0.14 < \alpha_s < 2.7$

**3. Data quality**
- Linear fit should have good correlation ($R^2 > 0.7$ desirable)
- Poor fit indicates: insufficient low-voltage data, noise, or model mismatch

**4. Parameter consistency**
- $\alpha_s$ should be positive (by definition)
- $\beta$ should be positive (exponential decay requires positive rate)

---

## Comparison with Derk Model

| Aspect | Derk Model (Hyperbolic) | DerkE Model (Exponential) |
|--------|------------------------|---------------------------|
| **Decay function** | $\frac{1}{1 + \beta V_a}$ | $e^{-(\beta V_a)^{3/2}}$ |
| **Transformation** | Reciprocal: $y = \frac{1}{P_{sc}}$ | Logarithm: $y = \log(P_{sc})$ |
| **Voltage axis** | Linear: $x = V_a$ | Power: $x = V_a^{3/2}$ |
| **Intercept formula** | $\alpha_s = \frac{1}{\langle b \rangle}$ | $\alpha_s = e^{\langle b \rangle}$ |
| **Slope formula** | $\beta = \alpha_s \cdot \langle a \rangle$ | $\beta = (\langle -a \rangle)^{2/3}$ |
| **Decay speed** | Slower (hyperbolic) | Faster (exponential) |
| **Best for** | Gradual transitions | Sharp transitions |

---

## Model Selection Guide

### When to Use DerkE Model

**Recommended for tubes exhibiting:**
1. **Sharp transition** from space-charge-limited to voltage-limited operation
2. **Rapid decrease** in screen current at low anode voltages
3. **High-transconductance** pentodes (e.g., EF86, 6AU6)
4. **Modern receiving tubes** with efficient screening

### When to Use Standard Derk Model

**Recommended for tubes exhibiting:**
1. **Gradual transition** between operating regions
2. **Slow decrease** in screen current with anode voltage
3. **Power pentodes** (e.g., EL34, 6L6, KT88)
4. **Vintage tubes** with less efficient screening

### Empirical Test

Fit both models and compare:
- **DerkE better**: If exponential decay fits low-voltage data better
- **Derk better**: If hyperbolic decay provides more stable parameters

---

## Troubleshooting

### Problem: No valid points after filtering

**Symptoms:** All points have $P_{sc} \leq 0$ after transformation

**Causes:**
- $k_{g2}$ estimate is too large
- Voltage range doesn't include space charge region
- Screen current data is noisy or incorrect

**Solutions:**
1. Verify $k_{g2}$ estimation is correct
2. Include lower voltage measurements (down to 5-10V if possible)
3. Check for measurement errors in screen current data

---

### Problem: Positive slope in regression

**Symptoms:** $a > 0$ (space charge appears to increase with voltage)

**Causes:**
- Wrong voltage range selected (too high $V_a$)
- Secondary emission dominates over space charge
- Data includes non-monotonic screen current behavior

**Solutions:**
1. Restrict to lower voltage range (e.g., $V_a < 30V$)
2. Consider disabling secondary emission initially
3. Manually inspect screen current curves for anomalies

---

### Problem: Unrealistic $\alpha_s$ values

**Symptoms:** $\alpha_s < 0.01$ or $\alpha_s > 10$

**Causes:**
- Poor linear fit quality ($R^2$ is low)
- Insufficient data points in low-voltage region
- Triode parameters ($\mu$, $K_p$, etc.) are incorrect

**Solutions:**
1. Re-fit triode parameters with better initial guesses
2. Collect more measurements at low anode voltages
3. Check if standard Derk model fits better (try both)

---

### Problem: Large variation between series

**Symptoms:** Standard deviation of $\langle b \rangle$ is large

**Causes:**
- Inconsistent behavior across different $V_{g1}$, $V_{g2}$ combinations
- Noise in measurements
- Model doesn't capture tube behavior well

**Solutions:**
1. Weight averaging by number of points in each series
2. Exclude outlier series with poor fit quality
3. Consider using median instead of mean for averaging

---

## Implementation Notes

### Current Implementation

The estimation is implemented in:
- **File:** `src/app/workers/estimates/estimate-derke-parameters.ts`
- **Function:** `estimateDerkEParameters()`

**Key implementation details:**
1. Uses logarithmic transformation: $y = \log(I_{g2} k_{g2} / I_{PK} - 1)$
2. Voltage axis transformation: $x = V_a^{3/2}$
3. Linear regression via least squares minimization
4. Averages slope and intercept across all grid voltage combinations

### Recent Fixes

**2024 Parameter Estimation Review:**
- Fixed sign error in logarithmic transformation (was inverting $\alpha_s$)
- Corrected from: `y = -log(...) + a·x + b`
- Corrected to: `y = log(...) - (a·x + b)`
- Result: $\alpha_s$ now correctly calculated as $e^{\langle b \rangle}$ instead of $e^{-\langle b \rangle}$

---

## References

- **Theory.pdf**: Section 11.2.4, Equations 88-89
- **Derk Reefman**: Original pentode modeling theory
- **Related docs**: 
  - `docs/derk/estimate-alphas-beta.md` - Standard Derk model
  - `docs/derk-reefman-pentode-model.md` - Full DerkE model specification

---

## Summary

The DerkE model uses **exponential decay** to model space charge effects in pentodes:

1. **Transform** screen current ratio using **logarithm**
2. **Plot** against $V_a^{3/2}$ (not linear $V_a$)
3. **Fit** straight line to get slope $a$ and intercept $b$
4. **Calculate**: $\alpha_s = e^{\langle b \rangle}$, $\beta = (\langle -a \rangle)^{2/3}$

This provides **initial estimates** that are refined during full model optimization.
