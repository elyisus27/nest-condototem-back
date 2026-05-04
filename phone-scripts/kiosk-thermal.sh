while true
do

TEMP=$(cat /sys/class/thermal/thermal_zone1/temp) # mtktsAP
TEMP_C=$((TEMP/1000))

HOUR=$(date +%H)

# 🔥 MODO CALOR (por hora o temperatura)
if ([ $HOUR -ge 12 ] && [ $HOUR -lt 18 ]) || [ $TEMP_C -ge 45 ]; then

# CPU BIG ↓↓↓
for cpu in 4 5 6 7; do
  echo 0 > /sys/devices/system/cpu/cpu$cpu/online
done

# CPU LITTLE ↓↓↓
for cpu in 0 1 2 3; do
  echo 1200000 > /sys/devices/system/cpu/cpu$cpu/cpufreq/scaling_max_freq
done

# Governor conservador
for cpu in 0 1 2 3; do
  echo powersave > /sys/devices/system/cpu/cpu$cpu/cpufreq/scaling_governor
done

# Brillo bajo
settings put system screen_brightness 90

# Animaciones off
settings put global window_animation_scale 0
settings put global transition_animation_scale 0
settings put global animator_duration_scale 0

else

# Reactivar cores
for cpu in 4 5 6 7; do
  echo 1 > /sys/devices/system/cpu/cpu$cpu/online
done

# Frecuencia normal
for cpu in 0 1 2 3; do
  echo 2000000 > /sys/devices/system/cpu/cpu$cpu/cpufreq/scaling_max_freq
done

for cpu in 4 5 6 7; do
  echo 1400000 > /sys/devices/system/cpu/cpu$cpu/cpufreq/scaling_max_freq
done

# Governor normal
for cpu in 0 1 2 3 4 5 6 7; do
  echo schedutil > /sys/devices/system/cpu/cpu$cpu/cpufreq/scaling_governor
done

# Brillo normal
settings put system screen_brightness 180

fi

sleep 60

done