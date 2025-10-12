# Norman Koren Pentode Models

## Standard Pentode Model

*(Historical reference - not used in software)*

Extends the triode model for pentode operation with screen grid effects. The pentode adds a positively charged screen grid (G2) between the control grid (G1) and plate, which reduces the plate-to-grid capacitance and provides better high-frequency performance.

### Physical Principle

The screen grid accelerates electrons toward the plate while shielding the control grid from plate voltage variations. This creates two distinct current paths: electrons that reach the plate (plate current) and electrons captured by the screen grid (screen current). The model accounts for the complex electrostatic interactions between all electrodes.

### Key Equations

$$E_1 = \frac{V_s \cdot \ln\left(1 + \exp\left(K_p \cdot \left(\frac{1}{\mu} + \frac{V_g}{V_s}\right)\right)\right)}{K_p}$$

$$I_p = \frac{E_1^{E_x} \cdot \arctan\left(\frac{V_p}{K_{vb}}\right)}{K_{g1}}$$

$$I_s = \frac{{(V_g + \frac{V_s}{\mu})}^{E_x}}{K_{g2}}$$

### Physical Meaning

- The **first equation** represents the effective driving voltage considering both control grid and screen grid effects
- The **arctangent term** in the plate current equation models the saturation behavior as plate voltage increases
- The **screen current equation** accounts for electrons captured by the screen grid, influenced by both grid and screen voltages

## New Pentode Model ✅

**This is the model used in this software**

Enhanced pentode model using the $I_{pk}$ current function, which provides improved accuracy for modern pentode designs by better modeling the interaction between screen voltage and cathode current.

### Mathematical Foundation

$$E_1 = \frac{V_s \cdot \ln\left(1 + \exp\left(K_p \cdot \left(\frac{1}{\mu} + \frac{V_g}{\sqrt{K_{vb} + V_s^2}}\right)\right)\right)}{K_p}$$

$$
I_{pk} = \begin{cases} 
E_1^{E_x} & \text{if } E_1 > 0 \\ 
0 & \text{otherwise} 
\end{cases}
$$

$$I_p = \frac{I_{pk} \cdot \arctan\left(\frac{V_p}{K_{vb}}\right)}{K_{g1}}$$

$$I_s = \frac{I_{pk}}{K_{g2}}$$

### Enhanced Features

- **Improved Screen Voltage Modeling**: The $\sqrt{K_{vb} + V_s^2}$ term better represents the electrostatic field distribution in modern pentode designs
- **Unified Current Source**: The $I_{pk}$ function represents the total cathode emission current, which is then distributed between plate and screen
- **Better High-Voltage Accuracy**: More accurate modeling of pentode behavior at high plate voltages

### Additional Parameters

- **$K_{g2}$**: Screen current scaling factor - determines the fraction of total cathode current captured by the screen grid
