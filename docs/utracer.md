# uTracer Calibration Guide

## Equipment Required

- Precision digital multimeter (DMM) with ±0.1V accuracy or better
- Access to uTracer hardware connections

## Accessing Calibration

1. Open the **uTracer Setup** dialog from the main interface
2. Locate the **Calibration** section with slider controls
3. Click the **Read** button at the bottom to view live ADC readings from the uTracer

## Calibration Procedures

### 1. Power Supply Voltage Measurement Calibration

Before calibrating any other voltages, ensure the uTracer accurately measures the main power supply voltage. This is the foundation for all other calibrations since many circuits derive their references from the power supply.

#### Procedure

1. **Connect the DMM** to measure the main power supply voltage
   - Connect DMM across the power supply terminals
   - Ensure proper polarity and voltage range on the DMM
   
2. **Power on and stabilize**
   - Turn on the uTracer and allow it to warm up for 15-30 minutes
   - Let the power supply voltage stabilize under no-load conditions

3. **Open uTracer Setup**
   - Open the **uTracer Setup** dialog from the main interface
   - Click the **Read** button to obtain live ADC measurements
   - Observe the displayed power supply voltage value

4. **Compare and adjust**
   - Note the DMM reading (e.g., 210.5V)
   - Note the uTracer reading (e.g., 208.2V)
   - Adjust the **Power Supply Voltage** calibration slider until the values match
   - Click **Read** again to verify the measurement now matches the DMM
   - Fine-tune if needed until readings match within ±0.2V

5. **Verify under load** (optional but recommended)
   - Connect a moderate load (e.g., the plate load resistor from later calibrations)
   - Verify the voltage reading remains accurate under load
   - The power supply voltage may drop slightly under load; this is normal

### 2. Negative Voltage Measurement Calibration

This calibration ensures the uTracer accurately measures the boost converter output (typically -40V to -50V).

#### Procedure

1. **Connect the DMM** to measure the negative voltage supply rail on the uTracer hardware
   - Measure across the negative voltage divider (R3/R4), or capacitor C1
   
2. **Power on and stabilize**
   - Allow the uTracer to warm up for 15-30 minutes
   - Let the boost converter stabilize

3. **Open uTracer Setup**
   - Click the **Read** button to obtain live measurements
   - Observe the displayed negative voltage value in the debug section

4. **Compare and adjust**
   - Note the DMM reading (e.g., -42.3V)
   - Note the uTracer reading (e.g., -40.8V)
   - Adjust the **Negative Voltage** calibration slider until the values match
   - Click **Read** again to verify the measurement now matches the DMM
   - Fine-tune if needed

### 3. Grid Voltage DAC Calibration

The grid voltage uses piecewise calibration across three ranges to account for circuit non-linearities. The uTracer Setup dialog contains three calibration sliders for grid voltage DAC:

- **Grid -1V Voltage** (0.9 to 1.1) - Calibrates grid voltage DAC for 0V to -1V range
- **Grid -4V Voltage** (0.9 to 1.1) - Calibrates grid voltage DAC for -1V to -4V range
- **Grid -40V Voltage** (0.9 to 1.1) - Calibrates grid voltage DAC for -4V to -40V range

#### Equipment Needed

- **High-value resistor** (1MΩ to 10MΩ, ±1% tolerance or better)

**Important**: To prevent grid loading and ensure accurate measurements, always connect this high-value resistor between the grid pin and cathode pin of the tube socket during calibration. This simulates the tube's grid-cathode impedance without drawing significant current.

#### Range 1: 0V to -1V (Grid -1V Voltage)

Calibrate using a test voltage of **-0.5V**:

1. **Set a test point** in the main interface or curve tracer
   - Set grid voltage to -0.5V
   - Set plate and screen to 0V to avoid tube damage
   - Apply the settings

2. **Measure with DMM**
   - Connect a 1MΩ to 10MΩ resistor between grid and cathode pins
   - Connect DMM across the resistor
   - Read the actual grid voltage (e.g., -0.48V)
   - Adjust **Grid -1V Voltage** calibration slider until the values match

3. **Verify**
   - Set grid to -0.5V again and measure
   - Test other voltages in range (e.g., -0.25V, -0.75V, -1.0V)

#### Range 2: -1V to -4V (Grid -4V Voltage)

Calibrate using a test voltage of **-2.5V**:

1. **Set test point**
   - Set grid voltage to -2.5V in the main interface
   - Apply the settings

2. **Measure with DMM**
   - Maintain the 1MΩ to 10MΩ resistor between grid and cathode
   - Read actual grid voltage (e.g., -2.55V)
   - Adjust **Grid -4V Voltage** calibration slider until the values match

4. **Verify**
   - Test voltages across the range (-1.5V, -2.0V, -3.0V, -4.0V)

#### Range 3: -4V to -40V (Grid -40V Voltage)

Calibrate using a test voltage of **-20V**:

1. **Set test point**
   - Set grid voltage to -20V in the main interface
   - Apply the settings

2. **Measure with DMM**
   - Maintain the 1MΩ to 10MΩ resistor between grid and cathode
   - Read actual grid voltage (e.g., -19.8V)
   - Adjust **Grid -40V Voltage** calibration slider until the values match

4. **Verify**
   - Test across the full range (-5V, -10V, -15V, -25V, -35V)

### 4. Plate and Screen Voltage/Current Calibration

Accurate plate and screen voltage and current measurements are critical for tube characterization. Use a known precision resistor as a load to calibrate both voltage and current simultaneously.

#### Equipment Needed

- **Known load resistor** with the following specifications:
  - **Resistance calculation** (limiting current to 200mA):
   
    $$R_{load} ≥ \frac{V_{max}}{0.2}$$

  - **Power rating** (use at least 1.5x safety margin):
  
    $$P ≥ \frac{V_{max}^2}{R_{load}}$$

  - **Tolerance**: ±1% or better for accurate current calculations
  - **Examples**:
    - For $V_{max} = 100V$: Use $R ≥ 500Ω$, $P ≥ 20W$
    - For $V_{max} = 200V$: Use $R ≥ 1kΩ$, $P ≥ 40W$
    - For $V_{max} = 300V$: Use $R ≥ 1.5kΩ$, $P ≥ 60W$
  - **Recommended**: 1kΩ to 2kΩ, 50W wirewound resistor for general calibration work

#### Procedure

##### Plate Voltage and Current Calibration

1. **Connect the load resistor**
   - Connect the precision resistor between the plate and cathode pins
   - Note the exact resistor value (e.g., $R_{load} = 1000Ω$ measured)

2. **Set test voltage**
   - Set plate voltage to a known value (e.g., 100V)
   - Set screen to 0V
   - Apply the settings

3. **Measure voltage with DMM**
   - Measure actual voltage across the resistor (e.g., $V_{actual} = 99.2V$)
   - Calculate actual current: 
   
    $$I_{actual} = \frac{V_{actual}}{R_{load}}$$

   - Example: 

    $$\frac{99.2V}{1000Ω} = 0.0992A = 99.2mA$$

4. **Compare to uTracer readings**
   - Note uTracer plate voltage reading (e.g., 97.5V)
   - Note uTracer plate current reading (e.g., 95.0mA)
   - Adjust **Plate voltage** calibration slider until the voltages match
   - Adjust **Plate current** calibration slider until the currents match

5. **Verify at multiple voltages**
   - Test at 50V, 100V, 150V, 200V (as appropriate for your hardware)
   - Ensure both voltage and current readings remain accurate
   - Current should always equal $\frac{V_{measured}}{R_{load}}$

##### Screen Voltage and Current Calibration

Follow the same procedure as plate calibration, but:

1. Connect the load resistor to the screen grid pin instead
2. Set screen voltage to test value (e.g., 100V)
3. Keep plate at 0V and grid at cutoff
4. Measure and calculate as above
5. Apply screen voltage and current calibration factors

#### Important Considerations

- **Current accuracy verification**: The calculated current ($\frac{V}{R}$) provides a reference independent of the uTracer's current sensing circuit
- **Resistor heating**: Allow resistor to cool between measurements to maintain accuracy
- **Simultaneous calibration**: This method calibrates voltage and current together, ensuring consistency
- **Safety**: Never exceed the resistor's power rating ($P = \frac{V^2}{R}$)

### 5. Verification Procedure

After completing all calibrations, verify accuracy across the full operating range:

1. **Create a test sequence** with grid voltages:
   - -0.25V, -0.75V (Range 1)
   - -1.5V, -3.0V (Range 2)
   - -5V, -10V, -15V, -25V, -35V (Range 3)

2. **Measure each voltage** with the DMM

3. **Compare readings**
   - Differences should be within ±0.1V
   - If not, revisit the affected range calibration

### 6. Important Notes

- **Piecewise interpolation**: The system uses linear interpolation between calibration points. Voltages at the boundary between ranges (e.g., -1V, -4V) use the lower range's calibration.

- **Temperature stability**: Always allow 15-30 minutes warm-up before calibrating. Temperature drift can affect readings.

- **Grid loading prevention**: Always use a 1MΩ to 10MΩ resistor between grid and cathode during grid voltage calibration. This prevents the DMM input impedance from loading the grid circuit and causing measurement errors.

- **Resistor-based calibration advantages**: 
  - Provides independent voltage and current verification using Ohm's law ($I = \frac{V}{R}$)
  - Eliminates uncertainty from current sensor calibration alone
  - Known resistor values provide traceable measurement standards
  - Single measurement setup calibrates both voltage and current

- **Current limiting**: Always ensure your load resistor limits current below 200mA to stay within uTracer specifications and prevent damage.

- **Safety**: The negative voltage boost converter can produce voltages below -40V, and plate voltages can exceed 300V. Exercise caution when measuring. Ensure load resistors have adequate power ratings.

- **Persistent storage**: All calibration values are automatically saved to browser local storage and persist across sessions.
