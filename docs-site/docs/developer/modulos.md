# Modulos y Responsabilidades

## `AppModule`

Archivo: `src/app.module.ts`

Responsabilidades:

- cargar variables de entorno,
- configurar conexion MySQL,
- habilitar scheduler,
- registrar modulos de seguridad,
- registrar modulo de dispositivos,
- registrar seed inicial.

Imports principales:

- `ConfigModule`
- `TypeOrmModule`
- `ScheduleModule`
- `UserModule`
- `ProfileModule`
- `UserProfileModule`
- `AuthModule`
- `DevicesModule`

## `DevicesModule`

Archivo: `src/residential/devices/devices.module.ts`

Responsabilidades:

- agrupar el dominio de dispositivos,
- registrar entidades `Device`, `DeviceThermalLog` y `CrossingLog`,
- exponer controller HTTP de dispositivos,
- proveer automatizacion, ADB, GPIO, secuencias y scheduler.

Providers:

| Provider | Responsabilidad |
| --- | --- |
| `DevicesService` | CRUD y puente entre controller y servicios internos. |
| `AdbService` | Factory ligera para crear instancias ADB por dispositivo. |
| `AutomationService` | Ciclo principal automatico. |
| `GpioService` | Inicializacion y pulsos GPIO. |
| `SequenceExecutorService` | Ejecucion de pasos configurados. |
| `DevicesSchedule` | Monitoreo periodico de dispositivos. |

## `AuthModule`

Archivo: `src/security/auth/auth.module.ts`

Responsabilidades:

- login,
- emision de JWT,
- estrategia `jwt`,
- proteccion de endpoints con `AuthGuard('jwt')`.

El token expira en 1 hora segun la configuracion actual del `JwtModule`.

## `UserModule`, `ProfileModule`, `UserProfileModule`

Administran usuarios, perfiles y relaciones usuario-perfil.

El seed inicial crea perfiles y usuarios basicos cuando la base esta vacia o cuando se fuerza regeneracion con `DATABASE_SYNC`.

## Servicios Globales

### `MySQLInsertTablesService`

Archivo: `src/globals/mysql.schedule.ts`

Corre con `@Timeout(5000)`.

Responsabilidades:

- crear perfiles iniciales,
- crear usuarios iniciales,
- crear relaciones usuario-perfil,
- crear dispositivos iniciales,
- crear secuencias iniciales.

## Responsabilidad por Archivo Clave

| Archivo | Rol |
| --- | --- |
| `src/main.ts` | Bootstrap HTTP, CORS, session y puerto. |
| `src/app.module.ts` | Composicion raiz de Nest. |
| `devices.controller.ts` | Endpoints REST de dispositivos. |
| `devices.service.ts` | Casos de uso simples y delegacion. |
| `automation.service.ts` | Estado vivo del automatismo. |
| `adb.service.ts` | Driver ADB/logcat/UI dump/parser. |
| `gpio.service.ts` | Control fisico o simulacion de GPIO. |
| `sequence-executore.service.ts` | Ejecutor de steps dinamicos. |
| `devices.schedule.ts` | Telemetria periodica de dispositivos. |
