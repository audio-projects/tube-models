set xlabel "Anode Voltage (V)"
set ylabel "Anode Current (mA)"
plot '6SN7.dat','6SN7.fit'u 1: 2w l title columnhead( 2),'6SN7.fit'u 1: 3w l title columnhead( 3),'6SN7.fit'u 1: 4w l title columnhead( 4),'6SN7.fit'u 1: 5w l title columnhead( 5),'6SN7.fit'u 1: 6w l title columnhead( 6),'6SN7.fit'u 1: 7w l title columnhead( 7)
 pause -1
