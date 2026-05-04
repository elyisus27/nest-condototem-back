#!/system/bin/sh

# esperar a que el sistema arranque
sleep 20

# activar adb wifi permanente
setprop persist.adb.tcp.port 5555
stop adbd
start adbd

# evitar que la pantalla se duerma
svc power stayon true
settings put system screen_off_timeout 2147483647

# desactivar doze (ahorro agresivo de batería)
dumpsys deviceidle disable