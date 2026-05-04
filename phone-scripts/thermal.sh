#!/system/bin/sh

LOG_FILE="/data/local/tmp/thermal_log.txt"
API_URL="http://192.168.100.4:3001/devices/thermal"
DEVICE_ID=$(getprop ro.serialno)

while true; do
  DATA=$(dumpsys thermalservice | sed -n '/Current temperatures from HAL:/,/Current cooling devices/p')

  CPU=$(echo "$DATA" | grep 'mName=CPU' | head -1 | sed 's/.*mValue=\([0-9.]*\).*/\1/')
  GPU=$(echo "$DATA" | grep 'mName=GPU' | head -1 | sed 's/.*mValue=\([0-9.]*\).*/\1/')
  BATTERY=$(echo "$DATA" | grep 'mName=BATTERY' | head -1 | sed 's/.*mValue=\([0-9.]*\).*/\1/')
  SKIN=$(echo "$DATA" | grep 'mName=SKIN' | head -1 | sed 's/.*mValue=\([0-9.]*\).*/\1/')
  PA=$(echo "$DATA" | grep 'POWER_AMPLIFIER' | head -1 | sed 's/.*mValue=\([0-9.]*\).*/\1/')
  NPU=$(echo "$DATA" | grep 'mName=NPU' | head -1 | sed 's/.*mValue=\([0-9.]*\).*/\1/')

  [ -z "$CPU" ] && CPU=0
  [ -z "$GPU" ] && GPU=0
  [ -z "$BATTERY" ] && BATTERY=0
  [ -z "$SKIN" ] && SKIN=0
  [ -z "$PA" ] && PA=0
  [ -z "$NPU" ] && NPU=0

  JSON="{\"device_id\":\"$DEVICE_ID\",\"cpu\":$CPU,\"gpu\":$GPU,\"battery\":$BATTERY,\"skin\":$SKIN,\"power_amplifier\":$PA,\"npu\":$NPU}"

  echo "$(date) -> $JSON" >> $LOG_FILE

  wget -q \
    --timeout=10 \
    --header="Content-Type: application/json" \
    --post-data="$JSON" \
    $API_URL -O /dev/null >> $LOG_FILE 2>&1

  sleep 300   # 🔥 temporal para debug
done