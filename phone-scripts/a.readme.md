# entrar por adb al shell en super usuario y pegar los scripts en esa carpeta

adb shell su
ls data/adb/service.d/

# 📲 1. Subir el script por ADB (remoto)
# 📲 1.1 Subir a carpeta temporal
adb push thermal.sh /data/local/tmp/thermal.sh
# 🔐 1.2 Mover con root
adb shell
# Luego dentro:
su
mv /data/local/tmp/thermal.sh /data/adb/service.d/thermal.sh
chmod 755 /data/adb/service.d/thermal.sh

# 🔁 2. Reiniciar dispositivo
adb reboot
# 🔍 3. Verificar que sí está corriendo

# y logs:
adb shell su -c "cat /data/local/tmp/thermal_log.txt"

#borrar logs
rm /data/local/tmp/thermal_log.txt
