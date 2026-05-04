# API y Endpoints

## Dispositivos

Base path:

```text
/devices
```

| Metodo | Ruta | Servicio | Descripcion |
| --- | --- | --- | --- |
| `GET` | `/devices` | `DevicesService.findAll()` | Lista dispositivos habilitados con secuencias. |
| `GET` | `/devices/listPaginated` | `DevicesService.listPaginated()` | Lista paginada con filtros. |
| `POST` | `/devices/start-services/:adbSerial` | `AutomationService.startCycle()` | Inicia ciclo automatico. |
| `POST` | `/devices/stop-services/:adbSerial` | `AutomationService.stopCycle()` | Detiene ciclo y listener. |
| `POST` | `/devices/restart-services/:adbSerial` | `AutomationService.restartCycle()` | Reinicia ciclo. |
| `GET` | `/devices/screenshot/:adbSerial` | `AutomationService.getScreenshot()` | Devuelve screenshot base64 del dispositivo activo. |
| `POST` | `/devices/gpio/:adbSerial` | `GpioService.pulse()` | Ejecuta pulso GPIO manual. |
| `POST` | `/devices/save` | `DevicesService.save()` | Guarda o actualiza dispositivo. |
| `POST` | `/devices/thermal` | `DevicesService.create()` | Guarda log termico recibido por API. |
| `POST` | `/devices/adb_wifi_update` | `DevicesService.updateAdbAddr()` | Actualiza direccion ADB de un dispositivo. |
| `DELETE` | `/devices/:id` | `DevicesService.remove()` | Elimina dispositivo por id. |

Nota: los endpoints `start`, `stop`, `restart` y `screenshot` reciben `adbSerial`, pero actualmente el flujo automatico opera sobre el dispositivo activo de base de datos (`tagActive = 1`).

## Autenticacion

Base path:

```text
/auth
```

| Metodo | Ruta | Descripcion |
| --- | --- | --- |
| `POST` | `/auth/login` | Valida usuario/password y devuelve JWT. |
| `POST` | `/auth/logout` | Intenta cerrar sesion express. |
| `GET` | `/auth/all` | Endpoint publico de prueba. |
| `GET` | `/auth/mod` | Protegido con JWT. |
| `GET` | `/auth/usr` | Protegido con JWT. |
| `GET` | `/auth/adm` | Protegido con JWT. |

## Usuarios

Base path:

```text
/user
```

| Metodo | Ruta | Descripcion |
| --- | --- | --- |
| `POST` | `/user` | Crea usuario con validacion DTO. |
| `GET` | `/user` | Lista usuarios. Protegido con JWT. |

## Perfiles

Base path:

```text
/profile
```

| Metodo | Ruta | Descripcion |
| --- | --- | --- |
| `GET` | `/profile` | Lista perfiles. Protegido con JWT. |

## CORS

`main.ts` define una lista de origins permitidos. Si el request no tiene origin, se permite para escenarios como cURL o Postman.

El backend usa `credentials: true`, por lo que el frontend debe enviar credenciales cuando aplique.
