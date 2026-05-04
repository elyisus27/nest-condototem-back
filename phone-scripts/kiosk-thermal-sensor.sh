#!/system/bin/sh

while true
do

PROX=$(cat /sys/class/sensors/proximity_sensor/state 2>/dev/null)

# fallback si no existe
if [ -z "$PROX" ]; then
  PROX=0
fi

if [ "$PROX" = "1" ]; then
    # 👤 ALGUIEN CERCA → modo performance

    echo 2009000 > /sys/devices/system/cpu/cpu0/cpufreq/scaling_max_freq
    echo 2009000 > /sys/devices/system/cpu/cpu1/cpufreq/scaling_max_freq
    echo 2009000 > /sys/devices/system/cpu/cpu2/cpufreq/scaling_max_freq
    echo 2009000 > /sys/devices/system/cpu/cpu3/cpufreq/scaling_max_freq

    echo 1491000 > /sys/devices/system/cpu/cpu4/cpufreq/scaling_max_freq
    echo 1491000 > /sys/devices/system/cpu/cpu5/cpufreq/scaling_max_freq
    echo 1491000 > /sys/devices/system/cpu/cpu6/cpufreq/scaling_max_freq
    echo 1491000 > /sys/devices/system/cpu/cpu7/cpufreq/scaling_max_freq

    settings put system screen_brightness 220

else
    # 💤 NADIE → modo ahorro agresivo

    echo 1000000 > /sys/devices/system/cpu/cpu0/cpufreq/scaling_max_freq
    echo 1000000 > /sys/devices/system/cpu/cpu1/cpufreq/scaling_max_freq
    echo 1000000 > /sys/devices/system/cpu/cpu2/cpufreq/scaling_max_freq
    echo 1000000 > /sys/devices/system/cpu/cpu3/cpufreq/scaling_max_freq

    echo 800000 > /sys/devices/system/cpu/cpu4/cpufreq/scaling_max_freq
    echo 800000 > /sys/devices/system/cpu/cpu5/cpufreq/scaling_max_freq
    echo 800000 > /sys/devices/system/cpu/cpu6/cpufreq/scaling_max_freq
    echo 800000 > /sys/devices/system/cpu/cpu7/cpufreq/scaling_max_freq

    settings put system screen_brightness 80

fi

sleep 2

done