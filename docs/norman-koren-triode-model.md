# Norman Koren Triode Model

The foundation triode model based on Norman Koren's research. This model represents the physical behavior of a triode vacuum tube by modeling the space charge effects and the relationship between grid voltage, plate voltage, and plate current.

## Physical Principle

The triode model is based on the Child-Langmuir space charge law and accounts for the electrostatic effects of the grid on the electron flow from cathode to plate. The model captures the non-linear relationship between applied voltages and the resulting plate current.

## Mathematical Foundation

$$E_1 = \frac{V_p \cdot \ln\left(1 + \exp\left(K_p \cdot \left(\frac{1}{\mu} + \frac{V_g}{\sqrt{K_{vb} + V_p^2}}\right)\right)\right)}{K_p}$$

$$
I_p = \begin{cases} 
\frac{E_1^{E_x}}{K_{g1}} & \text{if } E_1 > 0 \\ 
0 & \text{otherwise} 
\end{cases}
$$

## Model Parameters (Physical Interpretation)

- **$\mu$**: **Amplification factor** - The intrinsic voltage gain of the tube, representing the ratio of plate voltage change to grid voltage change required to maintain constant plate current. This is a fundamental tube characteristic determined by electrode geometry.
- **$E_x$**: **Space charge exponent** - Controls the curvature of the plate characteristic curves. This parameter accounts for the space charge effects in the tube, typically ranging from 1.2 to 1.6 for most triodes.
- **$K_{g1}$**: **Transconductance scaling factor** - Determines the current magnitude and relates to the tube's transconductance (gm). This parameter scales the theoretical current to match measured values.
- **$K_p$**: **Knee sharpness parameter** - Controls the transition region behavior between cutoff and saturation. Higher values create sharper transitions in the characteristic curves.
- **$K_{vb}$**: **Voltage normalization parameter** - A voltage scaling factor that influences the model's response to plate voltage variations. This parameter helps match the model to the tube's actual voltage sensitivity.
