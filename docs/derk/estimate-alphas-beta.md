# Initial Estimation of $\alpha_s$ and $\beta$ Parameters (Derk Model)

This document describes the methodology for estimating the space charge parameters $\alpha_s$ and $\beta$ in the Derk pentode model, based on Derk Reefman's theory (page 37, section 11.2.3).

## Physical Context

In the Derk pentode model, the parameters $\alpha_s$ and $\beta$ model the **space charge effects** that cause screen current to deviate from its ideal value at low anode voltages:

- $\alpha_s$: Screen current space charge coefficient - represents the magnitude of space charge influence on screen current
- $\beta$: Voltage-dependent decay rate - controls how rapidly space charge effects diminish as anode voltage increases

### Physical Behavior at Low Anode Voltage

At very low anode voltages ($V_a \approx 0$), space charge effects cause **screen current to exceed its ideal value**:

**Normal Operation** ($V_a$ high):

- Electrons accelerated by screen grid pass through to the anode
- Screen current is baseline: $I_{g2} \approx \frac{I_{P,Koren}}{k_{g2}}$

**Low Anode Voltage** ($V_a \approx 0$):

- Weak anode field cannot overcome space charge cloud
- Electrons that normally reach the anode are captured by the screen grid instead
- Screen current increases: $I_{g2} > \frac{I_{P,Koren}}{k_{g2}}$
- This excess is modeled by the term $\frac{\alpha_s}{1 + \beta V_a}$

As $V_a$ increases from 0, the anode field strengthens, space charge effects diminish, and screen current returns to baseline (controlled by $\beta$).

## Theoretical Foundation

### Screen Current Model at Low Anode Voltages

For very small anode voltages ($V_a \approx 0$), the screen current in the Derk model is approximated as:

$$I_{g2}(V_a \approx 0) \approx \frac{I_{P,Koren}}{k_{g2}} \left(1 + \frac{\alpha_s}{1 + \beta V_a}\right)$$

Where:
- $I_{P,Koren}$ is the Norman-Koren current calculated from triode parameters
- $k_{g2}$ is the screen grid transconductance parameter
- The term $\frac{\alpha_s}{1 + \beta V_a}$ represents space charge reduction that is strongest at $V_a = 0$

### Mathematical Transformation

The hyperbolic relationship can be linearized by plotting:

$$y = \left(\frac{I_{g2,obs}(V_a) \cdot k_{g2,est}}{I_{P,Koren,est}} - 1\right)^{-1}$$

as a function of $V_a$. This transformation converts the hyperbolic decay into a **straight line**:

$$y = a \cdot V_a + b$$

Where:
- $a$ = slope (derivative with respect to $V_a$)
- $b$ = intercept at $V_a = 0$

### Physical Interpretation of Line Parameters

From the model equation $\frac{\alpha_s}{1 + \beta V_a}$, we can derive:

$$\left(\frac{\alpha_s}{1 + \beta V_a}\right)^{-1} = \frac{1}{\alpha_s} + \frac{\beta}{\alpha_s} V_a$$

Therefore:
- **Intercept**: $b = \frac{1}{\alpha_s}$ → $\alpha_s = \frac{1}{b}$
- **Slope**: $a = \frac{\beta}{\alpha_s}$ → $\beta = \alpha_s \cdot a$

### Expected Sign Convention

Since space charge effects cause screen current to **increase** at low $V_a$:

$$\frac{I_{g2} k_{g2}}{I_{P,Koren}} - 1 > 0 \text{ at low } V_a$$

The reciprocal transformation yields:

$$y = \frac{1}{\text{positive}} + \frac{\text{positive}}{\text{positive}} \cdot V_a$$

**Both fitted parameters must be positive:**
- $b > 0$ (intercept) → ensures $\alpha_s > 0$
- $a > 0$ (slope) → ensures $\beta > 0$

If fitted values are negative, this indicates:
- Incorrect measurement data (screen current too low)
- Wrong measurement type selected
- Tube damage or anomalous behavior

## Estimation Algorithm

### Prerequisites

Before estimating $\alpha_s$ and $\beta$, the following parameters must already be determined:
- **Triode parameters**: $\mu$, $E_x$, $K_{g1}$, $K_p$, $K_{vb}$ (from triode-strapped measurements)
- **Screen parameter**: $K_{g2}$ (from high-$V_a$ screen current)

### Step-by-Step Process

**Step 1: Data Selection**

- Use pentode measurement data with $V_a$ as the X-axis
- Select only points at **very small anode voltages** (where space charge effects dominate)
- Ensure points satisfy power dissipation limits: $I_p \cdot V_a < P_{max}$
- Typically use the first 4 points of each series

**Step 2: Linear Regression for Each Series**

For each measurement series (constant $V_{g1}$, $V_{g2}$):

1. Calculate $I_{P,Koren,est}$ using the triode parameters:
   $$I_{P,Koren,est} = I_{pk}(V_{g1}, V_{g2})$$

2. For each low-$V_a$ point, compute:
   $$y = \left(\frac{I_{g2,obs} \cdot k_{g2,est}}{I_{P,Koren,est}} - 1\right)^{-1}$$

3. Fit a straight line $y = a \cdot V_a + b$ using least squares optimization

4. Record the slope $a$ and intercept $b$ for this series

**Step 3: Averaging Across All Series**

Average the fitted parameters across all grid voltage combinations:

$$\langle a \rangle = \frac{1}{N} \sum_{i=1}^{N} a_i$$

$$\langle b \rangle = \frac{1}{N} \sum_{i=1}^{N} b_i$$

**Step 4: Calculate Final Estimates**

From the averaged line parameters (equation 87 in Theory.pdf):

$$\alpha_{s,est} = \frac{1}{\langle b \rangle}$$

$$\beta_{est} = \alpha_{s,est} \cdot \langle a \rangle$$

## Implementation Details

### Optimization Method

The linear regression uses the **Powell optimization algorithm** with:
- **Initial guess**: $[a_0, b_0] = [5, 0.05]$
  - Corresponds to typical values: $\alpha_s \approx 20$, $\beta \approx 0.001$
- **Objective function**: Minimize sum of squared residuals
  $$\min_{a,b} \sum_{i=1}^{4} \left[\frac{1}{\left(\frac{I_{g2,i} k_{g2}}{I_{P,Koren,i}} - 1\right)} - (a \cdot V_{a,i} + b)\right]^2$$

### Point Selection Strategy

**Fixed 4-point method:**
1. Sort all series points by ascending $V_a$
2. Use only points where $I_p \cdot V_a < P_{max}$ (power limit)
3. Take the **first 4 valid points** (lowest voltages)
4. Stop at 4 points even if more are available

**Rationale:** 
- Theory valid only at very low $V_a$ (where $V_a \ll 1$ in normalized units)
- Using more points introduces non-linearity
- 4 points provide sufficient data for stable 2-parameter fit

### Convergence Handling

- Only successful Powell fits are included in averaging
- Failed fits are silently discarded
- If **all series fail**, fallback defaults are used: $\alpha_s = 5$, $\beta = 0.001$
- No explicit convergence reporting (relies on Powell's internal criteria)

### Implementation Compliance

**The implementation in `estimate-derk-parameters.ts` correctly follows Theory.pdf equation 86-87:**

The code implements the transformation:
```typescript
const d = 1 / (p.is * kg2 / ip - 1) - (a * p.ep + b);
```

This matches the theory exactly:
$$\left(\frac{I_{g2} k_{g2}}{I_P} - 1\right)^{-1} = a \cdot V_a + b$$

**Sign validation:** Both fitted parameters $a$ and $b$ are expected to be **positive**.
- No explicit convergence reporting (relies on Powell's internal criteria)

## Implementation Notes

### Typical Values

- $\alpha_s$: Typically ranges from 0.1 to 10
  - Larger values indicate stronger space charge effects
  - Default fallback: 5

- $\beta$: Typically ranges from 0.0001 to 0.01 (V⁻¹)
  - Controls rate of space charge decay with $V_a$
  - Default fallback: 0.001

### Data Quality Considerations

1. **Low-voltage region is critical**: Only use points where $V_a < 50V$ typically
2. **Avoid noise**: Screen current measurements must be accurate at low $V_a$
3. **Multiple series needed**: Average over various $V_{g1}$, $V_{g2}$ combinations for robustness
4. **Power limits**: Exclude points exceeding maximum plate dissipation

## Validation and Quality Checks

### Expected Parameter Ranges

**For typical pentodes:**

| Parameter | Typical Range | Physical Meaning |
|-----------|---------------|------------------|
| $\alpha_s$ | 0.1 to 10 | Magnitude of space charge effect |
| $\beta$ | 0.0001 to 0.01 V⁻¹ | Rate of space charge decay |

**Red flags indicating problems:**

1. $\alpha_s < 0$ → Wrong sign convention or bad data
2. $\alpha_s > 50$ → Unrealistically strong space charge (check $K_{g2}$)
3. $\beta < 0$ → Wrong sign convention or bad data
4. $\beta > 0.1$ → Unrealistically fast decay (check voltage units)

### Fit Quality Indicators

**Good estimation:**
- Multiple series converge successfully (> 5 series)
- Fitted parameters $a, b > 0$ for all series
- Low variance across series: $\sigma_a / \langle a \rangle < 0.5$
- Final parameters in typical ranges

**Poor estimation:**
- Few successful fits (< 3 series)
- Negative fitted parameters
- High variance: $\sigma_a / \langle a \rangle > 1$
- Parameters outside typical ranges

### Physical Consistency Check

The ratio $\frac{\beta}{\alpha_s} = a$ should be small (typically 0.0001 to 0.01), indicating:
- Space charge effects are strongest at $V_a = 0$
- Effects decay gradually as $V_a$ increases
- At $V_a \approx \frac{1}{\beta}$, space charge contribution is halved

## Troubleshooting

### Problem: All series fail to converge

**Possible causes:**
- Insufficient low-$V_a$ points (< 4 valid points per series)
- Power limit too restrictive
- Missing screen current measurements

**Solutions:**
- Check measurement data completeness
- Verify power dissipation limit is reasonable
- Ensure triode parameters ($\mu$, $E_x$, etc.) are pre-estimated

### Problem: Negative fitted parameters

**Possible causes:**
- Screen current **decreases** at low $V_a$ (opposite of expected)
- Wrong $K_{g2}$ estimate (too high)
- Measurement type mismatch

**Solutions:**
- Verify screen current measurements are correct
- Re-estimate $K_{g2}$ from high-$V_a$ data
- Check that pentode (not triode) measurements are used

### Problem: High variance across series

**Possible causes:**
- Noisy screen current measurements
- Inconsistent grid voltages
- Some series in non-linear region

**Solutions:**
- Use more measurement series for better averaging
- Inspect individual series fits for outliers
- Consider increasing power limit to get more low-$V_a$ points

### Problem: Unrealistic parameter values

**Possible causes:**
- Wrong voltage scale (mV instead of V)
- Current scale mismatch (µA instead of mA)
- Incorrect $I_{P,Koren}$ calculation

**Solutions:**
- Verify voltage and current units in measurement files
- Check triode parameter estimates
- Compare with published values for similar tubes

## References

- **Theory.pdf**: Page 37, Section 11.2.3 "Initial estimate αs,est and βest (Derk model)"
- Derk Reefman's pentode modeling methodology

## See Also

- [Derk Pentode Model](../derk-reefman-pentode-model.md) - Complete model documentation
- [DerkE Parameter Estimation](estimate-alphas-beta-derke.md) - For DerkE model variant (exponential decay)
- [Parameter Estimation Overview](../../README.md#pentode-parameter-estimation) - Full estimation sequence
