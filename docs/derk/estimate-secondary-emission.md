# Secondary Emission Parameter Estimation (Derk Models)

This document describes the methodology for estimating secondary emission parameters in the Derk and DerkE pentode models, based on Derk Reefman's theory (pages 38-39, sections 11.4, 11.4.1, and 11.4.2).

## Physical Context

**Secondary emission** is a phenomenon where high-energy electrons striking the screen grid knock off additional electrons from the screen grid surface. This creates **excess screen current** at low to moderate anode voltages.

### Physical Mechanism

**At Low Anode Voltage** ($V_a \approx 0$):
- Electrons from cathode are accelerated by screen grid
- Some electrons strike screen grid with moderate energy
- Secondary electrons are emitted from screen grid surface
- These secondary electrons can be recaptured by the screen or accelerated to the anode
- Net effect: **Increased screen current** beyond space charge prediction

**At Moderate Anode Voltage** ($V_a$ moderate):
- Anode field starts accelerating primary electrons past screen grid
- Electrons hit screen with higher energy → more secondary emission
- Screen current shows a **maximum** or **inflection point**
- This creates the characteristic "kink" in screen current curves

**At High Anode Voltage** ($V_a$ high):
- Most electrons pass through screen to anode
- Secondary electrons pulled back to screen by strong anode field
- Screen current returns to baseline (space charge only)

### Parameters Modeled

The secondary emission effects are controlled by five parameters:

- **$\lambda$**: Screen grid amplification factor (like $\mu$ for screen)
- **$\nu$** (nu): Control grid dependence of transition voltage
- **$w$**: Base transition voltage offset
- **$s$**: Magnitude of secondary emission contribution
- **$\alpha_p$**: Sharpness of transition (fixed default: 0.2)

### Circular Dependency Challenge

**Important Note:** Estimating secondary emission parameters creates a circular dependency:

1. Space charge parameters ($\alpha_s$, $\beta$) are estimated at low $V_a$
2. Secondary emission also affects current at low $V_a$
3. Secondary emission parameters require knowing $\alpha_s$, $\beta$
4. But $\alpha_s$, $\beta$ estimation is affected by secondary emission!

**Solution Approach:**
1. First estimate $\alpha_s$, $\beta$ ignoring secondary emission
2. Then estimate secondary emission parameters using those values
3. Finally, re-optimize **all parameters simultaneously** to refine estimates

---

## Section 11.4.1: Estimating $\lambda$, $\nu$, and $w$

### Parameter: $\lambda$ (Lambda)

**Physical meaning:** Screen grid amplification factor, analogous to $\mu$ for the control grid.

**Estimation Method:**
$$\lambda_{est} = \mu_{est}$$

**Implementation:**
Simply copy the previously estimated $\mu$ value. This is an approximation based on typical tube behavior.

**Rationale:**
The screen grid acts like a second control electrode, and its amplification factor is typically similar to the tube's intrinsic $\mu$.

---

### Parameters: $\nu$ (Nu) and $w$

**Physical meaning:** 
These parameters define where (at what $V_a$) secondary emission effects peak, as a function of grid voltages.

#### Step 1: Find Feature Points

For each measurement series with constant $(V_{g1}, V_{g2})$:

1. **Search for local maximum** in $I_{g2}(V_a)$
   - Scan screen current as function of anode voltage
   - Identify peak value: $I_{g2,max}$
   - Record anode voltage at peak: $V_{a,max}$

2. **If no maximum found, search for inflection point**
   - Calculate second derivative $\frac{d^2 I_{g2}}{dV_a^2}$
   - Find where second derivative changes sign
   - Record voltage at inflection: $V_{a,max}$

3. **If neither found**
   - Set $V_{a,max} = 0$ for this series
   - Indicates minimal or no secondary emission

**Definition (Equation 90):**
$$I_{g2,max}(V_{g2}, V_{g1}) = I_{g2}(V_{a,max}, V_{g2}, V_{g1})$$

#### Step 2: Linearization (Equation 91)

The theory predicts a linear relationship:

$$V_{a,max} - \frac{V_{g2}}{\lambda_{est}} = -\nu_{est} \cdot V_{g1} - w_{est}$$

Rearranging:
$$V_{a,max} = \frac{V_{g2}}{\lambda_{est}} - \nu_{est} \cdot V_{g1} - w_{est}$$

Or, grouping the unknowns:
$$V_{a,max} - \frac{V_{g2}}{\lambda_{est}} = -\nu_{est} \cdot V_{g1} - w_{est}$$

#### Step 3: Linear Regression

**Plot:** $(V_{a,max} - \frac{V_{g2}}{\lambda_{est}})$ as a function of $V_{g1}$

**Fit line:** $y = a \cdot V_{g1} + b$

**Extract parameters:**
- Slope: $a = -\nu_{est}$ → $\nu_{est} = -a$
- Intercept: $b = -w_{est}$ → $w_{est} = -b$

**Expected behavior:**
- **Negative slope**: More negative $V_{g1}$ → higher transition voltage $V_{a,max}$
- **Positive $\nu$**: Since slope is negative and $\nu = -a$
- **Variable $w$**: Depends on tube geometry

#### Edge Case: No Feature Points Detected

If **no maxima or inflection points** are found in any series:

**Action:**
- Set $\nu_{est} = 0$
- Set $w_{est} = 0$
- Issue warning: "Consider fitting without secondary emission effects"

**Implication:**
The tube may not exhibit significant secondary emission, or measurements don't cover the relevant voltage range. Optimization may still adjust these parameters, but results may be non-physical and only provide "aesthetical improvements."

---

## Section 11.4.2: Estimating $s$

Parameter $s$ represents the **magnitude** of the secondary emission contribution to screen current.

### Estimation Method (Equations 92-93)

#### Step 1: Calculate Secondary Emission Contribution (Equation 92)

At each feature point $(V_{a,max}, V_{g1}, V_{g2})$:

$$P_{sec,est}(V_{g1}, V_{g2}) = I_{g2,max}(V_{g2}, V_{g1}) - \frac{I_{P,Koren,est}}{k_{g2}} \left(1 + \alpha_s e^{-(\beta_{est} V_{a,max})^{3/2}}\right)$$

**Physical interpretation:**

- **$I_{g2,max}$**: Observed screen current at feature point (includes both space charge and secondary emission)
- **$\frac{I_{P,Koren}}{k_{g2}}(1 + \alpha_s e^{...})$**: Expected screen current from **space charge effects only** (DerkE model)
- **$P_{sec}$**: Excess current attributed to **secondary emission** (the difference)

**Note:** For Derk model (hyperbolic decay), replace the exponential with:
$$\frac{I_{P,Koren,est}}{k_{g2}} \left(1 + \frac{\alpha_s}{1 + \beta \cdot V_{a,max}}\right)$$

#### Step 2: Normalize and Average (Equation 93)

$$S_{est} = \left\langle \frac{k_{g2} \cdot P_{sec,est}(V_{g1}, V_{g2})}{2 \cdot V_{a,max} \cdot I_{P,Koren,est}} \right\rangle_{(V_{g1},V_{g2})}$$

**Normalization factors:**

1. **$k_{g2}$**: Scales by screen grid transconductance
2. **$2 \cdot V_{a,max}$**: Normalizes by voltage (factor of 2 relates to area/integral under curve)
3. **$I_{P,Koren,est}$**: Normalizes by characteristic current scale

**Averaging:**
Take the mean over all grid voltage combinations $(V_{g1}, V_{g2})$ that have valid feature points.

**Typical values:** $s$ typically ranges from 0 to 0.1 (dimensionless)

---

## Complete Estimation Algorithm

### Prerequisites

Before estimating secondary emission parameters, the following must be determined:
1. **Triode parameters**: $\mu$, $E_x$, $K_{g1}$, $K_p$, $K_{vb}$
2. **Screen parameter**: $K_{g2}$
3. **Space charge parameters**: $\alpha_s$, $\beta$

### Step-by-Step Process

**Step 1: Estimate $\lambda$**
```
λ_est = μ_est
```

**Step 2: Find Feature Points**

For each measurement series $(V_{g1}, V_{g2})$:

1. Calculate first derivative: $\frac{dI_{g2}}{dV_a}$
2. Calculate second derivative: $\frac{d^2I_{g2}}{dV_a^2}$
3. Search for local maximum: $\frac{dI_{g2}}{dV_a} = 0$ and $\frac{d^2I_{g2}}{dV_a^2} < 0$
4. If no maximum, search for inflection: $\frac{d^2I_{g2}}{dV_a^2} = 0$
5. Record $V_{a,max}$ and $I_{g2,max}$
6. If neither found, set $V_{a,max} = 0$

**Step 3: Estimate $\nu$ and $w$**

Only use series where $V_{a,max} > 0$:

1. For each series, calculate: $y_i = V_{a,max,i} - \frac{V_{g2,i}}{\lambda_{est}}$
2. Plot $y$ vs $V_{g1}$
3. Fit line: $y = a \cdot V_{g1} + b$ (least squares)
4. Extract: $\nu_{est} = -a$, $w_{est} = -b$

If no valid series found:
- $\nu_{est} = 0$
- $w_{est} = 0$
- Issue warning

**Step 4: Estimate $s$**

Only use series where $V_{a,max} > 0$:

1. For each series, calculate $I_{P,Koren,est}(V_{g1}, V_{g2})$
2. Calculate expected screen current from space charge:
   - DerkE: $I_{expected} = \frac{I_{P,Koren}}{k_{g2}}(1 + \alpha_s e^{-(\beta V_{a,max})^{3/2}})$
   - Derk: $I_{expected} = \frac{I_{P,Koren}}{k_{g2}}(1 + \frac{\alpha_s}{1 + \beta V_{a,max}})$
3. Calculate excess: $P_{sec} = I_{g2,max} - I_{expected}$
4. Normalize: $s_i = \frac{k_{g2} \cdot P_{sec}}{2 \cdot V_{a,max} \cdot I_{P,Koren}}$
5. Average: $s_{est} = \frac{1}{N}\sum s_i$

Default if no valid points: $s_{est} = 0.05$

**Step 5: Set $\alpha_p$**
```
α_p = 0.2 (fixed default)
```

---

## Implementation Notes

### Feature Point Detection

**Practical considerations:**

1. **Use numerical derivatives:**
   - Central difference for first derivative: $\frac{dI_{g2}}{dV_a} \approx \frac{I_{g2,i+1} - I_{g2,i-1}}{V_{a,i+1} - V_{a,i-1}}$
   - Central difference for second derivative: $\frac{d^2I_{g2}}{dV_a^2} \approx \frac{I_{g2,i+1} - 2I_{g2,i} + I_{g2,i-1}}{(V_{a,i+1} - V_{a,i})^2}$

2. **Noise handling:**
   - Smooth data before derivative calculation (optional)
   - Use tolerance for zero detection (e.g., $|\frac{dI_{g2}}{dV_a}| < \epsilon$)

3. **Multiple maxima:**
   - Use the **first** maximum (lowest $V_a$) if multiple found
   - This corresponds to primary secondary emission peak

### Typical Parameter Values

| Parameter | Typical Range | Physical Meaning |
|-----------|---------------|------------------|
| $\lambda$ | 20-100 | Same as $\mu$ typically |
| $\nu$ | 0-2 | Grid voltage dependence |
| $w$ | 0-100 V | Base transition voltage |
| $s$ | 0-0.1 | Secondary emission magnitude |
| $\alpha_p$ | 0.2 (fixed) | Transition sharpness |

### Data Quality Requirements

**Good secondary emission estimation requires:**

1. **Voltage coverage:** Measurements must span from low $V_a$ (< 50V) through the kink region (50-150V)
2. **Sufficient points:** At least 10-20 points per series to detect features accurately
3. **Low noise:** Screen current measurements must be accurate (< 1% error)
4. **Multiple series:** Need various $(V_{g1}, V_{g2})$ combinations for robust averaging

---

## Validation and Quality Checks

### Expected Behavior

**Good feature point detection:**
- Clear maximum or inflection in screen current curves
- $V_{a,max}$ varies systematically with $V_{g1}$
- Linear relationship in $V_{a,max}$ vs $V_{g1}$ plot
- Multiple series (> 5) with valid feature points

**Good $s$ estimation:**
- Positive $s$ values (secondary emission increases current)
- Consistent across series (low variance)
- Magnitude reasonable (typically $s < 0.1$)

### Red Flags

1. **No feature points detected:**
   - Tube may not exhibit secondary emission
   - Voltage range may be insufficient
   - Consider model without secondary emission

2. **Negative $s$ values:**
   - Indicates model mismatch
   - $\alpha_s$, $\beta$ may be incorrectly estimated
   - Secondary emission may not be present

3. **Very large $s$ (> 0.2):**
   - Unrealistic magnitude
   - Check $K_{g2}$ accuracy
   - Verify space charge parameters

4. **High variance in $\nu$, $w$ fit:**
   - Poor linear relationship in $V_{a,max}$ vs $V_{g1}$
   - May indicate complex secondary emission behavior
   - Consider if secondary emission model is appropriate

---

## Troubleshooting

### Problem: No feature points detected

**Symptom:** All series have $V_{a,max} = 0$

**Possible causes:**
- Voltage range doesn't cover kink region
- Tube is general pentode without significant secondary emission
- Noise masks feature points

**Solutions:**
- Extend measurements to higher $V_a$ (up to 200V)
- Use model **without** secondary emission ($s = \nu = w = 0$)
- Apply smoothing to screen current data before feature detection

### Problem: Non-linear $V_{a,max}$ vs $V_{g1}$ relationship

**Symptom:** Poor fit quality in Step 3

**Possible causes:**
- Complex secondary emission behavior
- Multiple emission mechanisms
- Feature point detection errors

**Solutions:**
- Manually inspect screen current curves
- Use only most reliable feature points (clear maxima)
- Accept that model may not perfectly capture behavior

### Problem: Negative $P_{sec}$ values

**Symptom:** Observed $I_{g2,max}$ less than space charge prediction

**Possible causes:**
- $\alpha_s$, $\beta$ overestimated
- $K_{g2}$ incorrect
- Feature point incorrectly identified

**Solutions:**
- Re-estimate $\alpha_s$, $\beta$ with better data selection
- Verify $K_{g2}$ from high-$V_a$ region
- Exclude series with negative $P_{sec}$ from $s$ averaging

### Problem: Parameter optimization gives non-physical values

**Symptom:** After full optimization, secondary emission parameters are unrealistic

**Possible causes:**
- Initial estimates poor
- Model doesn't match tube behavior
- Overfitting to noise

**Solutions:**
- Use model without secondary emission
- Accept that parameters provide "aesthetical improvements" only
- Fix some parameters during optimization (e.g., $\alpha_p = 0.2$)

---

## When to Use Secondary Emission Model

### Use secondary emission when:
- Screen current shows clear maximum or kink at moderate $V_a$
- Tube is high-power pentode or beam tetrode (6L6, EL34, KT88, etc.)
- Measurements cover voltage range from 0V to 200V+
- Feature points can be reliably detected

### Skip secondary emission when:
- Screen current increases monotonically with $V_a$
- No clear features in screen current curves
- Tube is low-power pentode (EF86, 6AU6, etc.)
- Voltage coverage insufficient
- Space charge model alone provides good fit

---

## References

- **Theory.pdf**: Pages 38-39, Sections 11.4, 11.4.1, 11.4.2
- Derk Reefman's pentode modeling methodology
- Secondary emission physics in vacuum tubes

## See Also

- [Derk Model Parameter Estimation](estimate-alphas-beta.md) - Space charge parameters
- [DerkE Model Parameter Estimation](../derke/estimate-alphas-beta.md) - For beam tetrodes
- [Derk Pentode Model](../derk-reefman-pentode-model.md) - Complete model documentation
