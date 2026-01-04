# uTracer Calibration Guide

## Negative Voltage Calibration

The uTracer uses a negative voltage boost converter to supply voltages for the control grid. Four separate calibration sliders are available in the uTracer Setup dialog to ensure accurate negative voltage measurements and precise grid voltage control.

### Equipment Required
- Precision digital multimeter (DMM) with ±0.1V accuracy or better
- Access to uTracer hardware connections (negative voltage rail and tube socket grid pin)

### Accessing Calibration

1. Open the **uTracer Setup** dialog from the main interface
2. Locate the **Calibration** section with slider controls
3. Click the **Read** button at the bottom to view live ADC readings from the uTracer

### Calibration Controls

The right column of the Calibration section contains four sliders for negative voltage calibration:

- **Negative Voltage** (0.9 to 1.1) - Calibrates measurement of the boost converter output
- **Grid -1V Voltage** (0.9 to 1.1) - Calibrates grid voltage DAC for 0V to -1V range
- **Grid -4V Voltage** (0.9 to 1.1) - Calibrates grid voltage DAC for -1V to -4V range
- **Grid -40V Voltage** (0.9 to 1.1) - Calibrates grid voltage DAC for -4V to -40V range

### 1. Negative Voltage Measurement Calibration

This calibration ensures the uTracer accurately measures the boost converter output (typically -40V to -50V).

#### Procedure

1. **Connect the DMM** to measure the negative voltage supply rail on the uTracer hardware
   - Measure across the negative voltage divider (R3/R4)
   
2. **Power on and stabilize**
   - Allow the uTracer to warm up for 15-30 minutes
   - Let the boost converter stabilize

3. **Open uTracer Setup**
   - Click the **Read** button to obtain live measurements
   - Observe the displayed negative voltage value in the debug section

4. **Compare and adjust**
   - Note the DMM reading (e.g., -42.3V)
   - Note the uTracer reading (e.g., -40.8V)
   - Calculate: Calibration = DMM reading ÷ uTracer reading
   - Example: -42.3 ÷ -40.8 = 1.0368

5. **Apply calibration**
   - Adjust the **Negative Voltage** slider to 1.0368
   - Click **Read** again to verify the measurement now matches the DMM
   - Fine-tune if needed

### 2. Grid Voltage DAC Calibration

The grid voltage uses piecewise calibration across three ranges to account for circuit non-linearities. Each range has its own calibration slider.

#### Range 1: 0V to -1V (Grid -1V Voltage)

Calibrate using a test voltage of **-0.5V**:

1. **Set a test point** in the main interface or curve tracer
   - Set grid voltage to -0.5V
   - Set plate and screen to 0V to avoid tube damage
   - Apply the settings

2. **Measure with DMM**
   - Connect DMM to the grid pin of the tube socket
   - Read the actual grid voltage (e.g., -0.48V)

3. **Open uTracer Setup and adjust**
   - Calculate: Calibration = Actual ÷ Target = -0.48 ÷ -0.5 = 0.96
   - Adjust **Grid -1V Voltage** slider to 0.96
   - Close the dialog

4. **Verify**
   - Set grid to -0.5V again and measure
   - Test other voltages in range (e.g., -0.25V, -0.75V, -1.0V)

#### Range 2: -1V to -4V (Grid -4V Voltage)

Calibrate using a test voltage of **-2.5V**:

1. **Set test point**
   - Set grid voltage to -2.5V in the main interface
   - Apply the settings

2. **Measure with DMM**
   - Read actual grid voltage (e.g., -2.55V)

3. **Adjust calibration**
   - Calculate: -2.55 ÷ -2.5 = 1.02
   - Open uTracer Setup
   - Adjust **Grid -4V Voltage** slider to 1.02

4. **Verify**
   - Test voltages across the range (-1.5V, -2.0V, -3.0V, -4.0V)

#### Range 3: -4V to -40V (Grid -40V Voltage)

Calibrate using a test voltage of **-20V**:

1. **Set test point**
   - Set grid voltage to -20V in the main interface
   - Apply the settings

2. **Measure with DMM**
   - Read actual grid voltage (e.g., -19.8V)

3. **Adjust calibration**
   - Calculate: -19.8 ÷ -20 = 0.99
   - Open uTracer Setup
   - Adjust **Grid -40V Voltage** slider to 0.99

4. **Verify**
   - Test across the full range (-5V, -10V, -15V, -25V, -35V)

### Verification Procedure

After completing all calibrations, verify accuracy across the full operating range:

1. **Create a test sequence** with grid voltages:
   - -0.25V, -0.75V (Range 1)
   - -1.5V, -3.0V (Range 2)
   - -5V, -10V, -15V, -25V, -35V (Range 3)

2. **Measure each voltage** with the DMM

3. **Compare readings**
   - Differences should be within ±0.1V
   - If not, revisit the affected range calibration

### Important Notes

- **Piecewise interpolation**: The system uses linear interpolation between calibration points. Voltages at the boundary between ranges (e.g., -1V, -4V) use the lower range's calibration.

- **Temperature stability**: Always allow 15-30 minutes warm-up before calibrating. Temperature drift can affect readings.

- **No grid current**: Use a high-impedance voltmeter (>10MΩ input impedance). Grid current will cause measurement errors.

- **Safety**: The negative voltage boost converter can produce voltages below -40V. Exercise caution when measuring.

- **Persistent storage**: All calibration values are automatically saved to browser local storage and persist across sessions.
