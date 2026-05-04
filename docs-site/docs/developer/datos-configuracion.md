# Datos y Configuracion

## Variables de Entorno

Archivo de ejemplo: `.env.sample`

| Variable | Uso |
| --- | --- |
| `DB_TYPE` | Tipo de base de datos. Actualmente MySQL. |
| `DB_HOST` | Host de base de datos. |
| `DB_USER` | Usuario de base de datos. |
| `DB_PASS` | Password de base de datos. |
| `DB_NAME` | Nombre de base de datos. |
| `DB_PORT` | Puerto de base de datos. |
| `DATABASE_SYNC` | Controla sincronizacion TypeORM y seed inicial. |
| `JWT_SECRET` | Secreto para firmar JWT. |
| `APP_PORT` | Puerto HTTP de NestJS. |
| `PULSE_ON_DENY` | Permite pulso GPIO tambien en visitas denegadas. |

## Entidades Principales

### `Device`

Tabla: `dev_device`

Representa un totem/tablet/dispositivo controlado por ADB.

Campos relevantes:

- `deviceId`
- `deviceName`
- `description`
- `adbDevice`
- `gpioPin`
- `msPulse`
- `tagEnabled`
- `tagActive`
- `tagDelete`
- `sequences`

### `Sequence`

Tabla: `dev_sequence`

Agrupa pasos para una accion de interfaz.

Campos:

- `sequenceId`
- `name`
- `device`
- `steps`

Ejemplos de nombres usados por seed:

- `GoToCamera`
- `Aceptar Visita`
- `Denegar Visita`
- `CloseAllApps`

### `SequenceStep`

Tabla: `dev_sequence_step`

Define una accion ADB puntual.

Campos:

- `order`
- `type`
- `x1`, `y1`
- `x2`, `y2`
- `swapTime`
- `delay`
- `description`
- `waitForText`

### `CrossingLog`

Tabla: `dev_crossing_log`

Guarda el resultado de un cruce:

- estado,
- anfitrion,
- unidad,
- co-anfitrion,
- visitante,
- telefono,
- correo,
- tipo de visita,
- XML crudo,
- fecha.

### `DeviceThermalLog`

Tabla: `dev_thermal_logs`

Guarda telemetria:

- cpu,
- gpu,
- battery,
- skin,
- power amplifier,
- npu,
- nivel de bateria,
- estado de bateria,
- fecha.

## Configuracion TypeORM

La configuracion esta en `AppModule`.

Detalles importantes:

- `timezone: 'Z'`
- `dateStrings: true`
- `connectionLimit: 10`
- entidades cargadas desde `__dirname + '/**/*.entity.{js,ts}'`
- `synchronize` depende de `DATABASE_SYNC == '1'`

## Seed Inicial

`MySQLInsertTablesService` genera datos iniciales cuando no hay registros o cuando la configuracion fuerza regeneracion.

Orden del seed:

1. perfiles,
2. usuarios,
3. relaciones usuario-perfil,
4. dispositivos,
5. secuencias,
6. steps.

## Dependencias Externas Operativas

El host que corre el backend necesita:

- Node.js compatible con NestJS 10,
- acceso a MySQL,
- Android Debug Bridge (`adb`) disponible en PATH,
- red hacia el dispositivo si se usa ADB por WiFi,
- hardware GPIO compatible y libreria `onoff` si se requiere apertura fisica real.
