# Derk Reefman Pentode Models

## Derk Pentode Model

An alternative pentode modeling approach incorporating secondary emission effects and advanced electrode interactions. This model extends the basic pentode equations to account for complex physical phenomena that occur in real tubes, particularly at high voltages and currents.

### Physical Principles

Secondary emission occurs when high-energy electrons striking the plate cause additional electrons to be emitted. These secondary electrons can be captured by the screen grid if it's at a higher potential than the plate, effectively reducing the net plate current. The Derk model mathematically represents these complex interactions.

### Mathematical Foundation

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

### Enhanced Features

- **Secondary Emission Modeling**: The $S_E$ term accounts for secondary electron emission from the plate surface, which becomes significant at high plate voltages. When high-energy electrons strike the plate, they can cause additional electrons to be emitted, which may be captured by the screen grid if at higher potential.
- **Voltage-Dependent Current Distribution**: The complex current distribution equations model how electrons are partitioned between plate and screen under various voltage conditions, accounting for the "Durchgriff" (penetration factor) of the plate.
- **Non-Linear Interactions**: The hyperbolic tangent function in the secondary emission term provides smooth transitions between different operating regimes, modeling the cross-over region where secondary electrons transition from being attracted back to the plate to being captured by the screen.

### Advanced Parameters (Physical Meaning)

- **$a$**: **Plate voltage coefficient** - Models the direct effect of plate voltage on current distribution, accounting for non-zero "Durchgriff"
- **$\alpha_s$**: **Screen modulation factor** - Represents the screen grid's influence on current partitioning and space charge effects
- **$\beta$**: **Voltage dependency parameter** - Controls how current distribution changes with applied voltages, particularly important for power tubes
- **$s$, $\alpha_p$, $\lambda$, $v$, $w$**: **Secondary emission parameters** - Collectively model the complex secondary emission characteristics:
  - $\lambda$: **Screen effectiveness factor** - Typically ≈ 1 for beam tetrodes, up to 20 for pentodes with suppressor grids
  - $v$: **Space charge influence** - Models how grid voltage affects secondary emission suppression (typically 1-4)
  - $w$: **Geometric offset** - Accounts for tube geometry effects on secondary emission

### Physical Phenomena Modeled

- **Critical Compensation**: Models the transition between "over-compensated" (rounded knee) and "critically compensated" (sharp knee) pentode characteristics
- **Cross-over Voltage**: The point where secondary electrons transition from returning to the plate to being captured by the screen grid
- **Virtual Cathode Effects**: In beam tetrodes, accounts for the formation of virtual cathodes in the space between screen and plate at low plate voltages

## DerkE Pentode Model

An enhanced version of the Derk model specifically designed for tubes exhibiting pronounced "kink" behavior at low plate voltages, particularly beam-pentodes and certain small-signal pentodes like the EF80.

### Physical Principle

The DerkE model addresses the limitation of the standard Derk model when dealing with tubes that don't exhibit smooth current dependence on plate voltage. This phenomenon, known as "critical compensation" among beam-tetrode researchers, occurs when the rounded knee of a pentode creates a smaller region of linear $I_a - V_a$ operation.

### Mathematical Foundation

The key difference from the Derk model lies in the screen current formulation and the space charge current reduction term, with optional secondary emission effects:

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

### Secondary Emission Term

$$P_{sec} = s \cdot V_a \cdot \left(1 + \tanh\left(-\alpha_p \cdot \left(V_a - \left(\frac{V_{g2}}{\lambda} - \nu V_{g1} - w\right)\right)\right)\right)$$

where:
- **$s$**: Secondary emission coefficient - linear scaling factor for emission current vs plate voltage
- **$\alpha_p$**: Cross-over sharpness parameter - controls the transition width (typically ≈ 0.2)
- **$\lambda$**: Screen effectiveness factor - screen grid influence on cross-over voltage 
- **$\nu$**: Space charge modulation factor - how grid voltage affects secondary emission suppression (1-4)
- **$w$**: Geometric offset parameter - accounts for tube construction effects on cross-over voltage

### Key Mathematical Differences

- **Exponential Term**: Uses $e^{-(\beta V_a)^{3/2}}$ instead of $\frac{1}{1 + \beta V_a}$ for modeling low-voltage behavior
- **Virtual Diode Behavior**: The $(3/2)$ exponent reflects the Child-Langmuir law for space-charge-limited current in the virtual diode formed between screen and plate
- **Langmuir Scaling**: At low plate voltages, models the characteristic $I_a \propto (\beta V_a)^{3/2}$ behavior
- **Saturation Modeling**: The exponential term provides smooth transition from space-charge-limited to saturated operation
- **Secondary Emission Integration**: Includes optional $P_{sec}$ term for tubes exhibiting significant secondary emission effects at higher voltages

### Physical Interpretation

- **Virtual Cathode Formation**: At low plate voltages, space charge creates a virtual cathode between screen and plate where electron velocity approaches zero
- **Kink Behavior**: The sharp transition when the virtual cathode disappears, causing the characteristic "knee" in beam tetrode curves
- **Critical vs Over-Compensation**: Distinguishes between sharply defined knees (critical compensation) and rounded transitions (over-compensation)
- **Secondary Emission Physics**: The $P_{sec}$ term models how high-energy electrons create secondary electrons at the plate surface
- **Cross-over Voltage**: The hyperbolic tangent function captures the voltage where secondary electrons transition from screen capture to plate return
- **Space Charge Suppression**: Models how negative grid voltages create space charge that suppresses secondary electron emission

### Model Selection Criteria

- **Use DerkE for**: Tubes showing pronounced kinks at low plate voltages (EF80, beam tetrodes)
- **Use Derk for**: Tubes with smooth current transitions (most small-signal pentodes like EF86)
- **Visual Inspection**: Pentodes with circular anodes are typically "real" pentodes (use Derk), while those with metal strip anodes may behave as beam pentodes (use DerkE)

### Enhanced Accuracy

The DerkE model provides superior fitting for tubes where the standard inverse relationship between screen current and plate voltage breaks down, particularly important for accurate modeling of audio power tubes and RF pentodes operating at low plate voltages.
