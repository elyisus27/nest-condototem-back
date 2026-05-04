## Description
Backup de instrucciones tasker, obtener y subir con adb
Abrir powershell en Descargas 

```bash
adb pull /sdcard/Tasker/configs/user/<nombre_archivo> <ruta_local_pc>
adb pull /sdcard/Tasker/configs/user/backup.xml 

adb push <ruta_local_pc>\<nombre_archivo> /sdcard/Tasker/configs/user/
adb push backup.xml /sdcard/Tasker/configs/user/
```






## Installation

```bash
$ npm install
```