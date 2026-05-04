# Automatizacion ADB/GPIO

## Objetivo

El flujo automatico mantiene la app Android lista para escanear QR, detecta el resultado de la visita y ejecuta acciones fisicas o de interfaz.

La clase central es `AutomationService`.

## Instancia ADB

`AdbService` es injectable, pero la operacion real se hace con `AdbInstance`.

`AutomationService` crea la instancia asi:

```ts
this.adb = new AdbInstance(device);
```

Cada `AdbInstance` queda asociada a un `Device`, principalmente por `device.adbDevice`.

## Comandos ADB

`AdbInstance.runAdb(args)` ejecuta:

```text
adb -s <adbDevice> <args...>
```

Funciones principales:

| Funcion | Que hace |
| --- | --- |
| `tap(x, y)` | Envia touch por coordenadas. |
| `swipe(...)` | Envia gesto de desplazamiento. |
| `takeScreenshot()` | Ejecuta `screencap -p` y devuelve base64. |
| `forceStopApp()` | Cierra `com.condovive.guard`. |
| `clearLogcat()` | Limpia logcat del dispositivo. |
| `launchApp()` | Lanza la app con `monkey`. |
| `waitForUI(predicate, timeout)` | Hace polling de UI dump hasta cumplir condicion. |

## Listener de Camara

`startListeningForCameraEvents()` abre:

```text
adb -s <adbDevice> logcat -s CameraService
```

El trigger actual es:

```text
disconnect: Disconnected client for camera 1
```

Cuando aparece ese texto:

1. espera 2 segundos,
2. ejecuta `uiautomator dump /dev/tty`,
3. reintenta hasta 120 veces cada 500 ms buscando textos esperados,
4. clasifica el estado,
5. parsea datos visibles,
6. emite `cameraClosed` en `cameraEvent`.

## Clasificacion del Evento

Estados actuales:

| Estado | Condicion |
| --- | --- |
| `denegar visita` | XML contiene invitacion expirada, registrada previamente o texto similar. |
| `aceptar visita` | XML contiene `Anfitrion`, `Host` o `Co-Anfitriones`. |
| `unknown` | No se detecta una condicion conocida. |

## Parser de Datos

`parseXmlData(xml)` extrae nodos `text` y `bounds` del UI dump.

Campos generados:

- `hostName`
- `hostUnit`
- `coHost`
- `visitorName`
- `visitorPhone`
- `visitorEmail`
- `visitType`

La estrategia actual usa posiciones aproximadas y labels de la pantalla.

## GPIO

`GpioService.pulse(pin, durationMs)`:

- si hay hardware ARM y `onoff`, baja el pin a `0`, espera y vuelve a `1`,
- si no hay hardware disponible, registra una simulacion.

En el flujo automatico:

- visita aceptada: pulso si `device.gpioPin` existe,
- visita denegada: pulso solo si `PULSE_ON_DENY` esta habilitado y hay pin.

## Secuencias Dinamicas

Despues del pulso, el sistema busca una secuencia del dispositivo cuyo nombre contenga el estado:

```ts
device.sequences?.find((s) =>
  s.name.toLowerCase().includes(state.toLowerCase())
)
```

Despues ejecuta `SequenceExecutorService.executeSequence()`.

Tipos de step:

| Type | Accion |
| --- | --- |
| `1` | Tap en `x1`, `y1`. |
| `2` | Swipe de `x1,y1` a `x2,y2`. |

Cada step puede incluir:

- `waitForText`: espera a que el UI dump contenga un texto o resource-id antes de ejecutar,
- `delay`: espera despues de ejecutar,
- `description`: texto legible para logs.

## Registro de Cruce

Al final del evento, `saveCrossingLog()` persiste la informacion en `dev_crossing_log`.

El log se guarda despues de GPIO y despues de la secuencia para priorizar la accion fisica y la continuidad operativa.
