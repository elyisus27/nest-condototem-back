# Resumen Tecnico

## Stack

- NestJS 10
- TypeScript
- TypeORM
- MySQL
- `@nestjs/schedule`
- Passport JWT
- ADB mediante `child_process.spawn` y `spawnSync`
- GPIO opcional con `onoff`

## Entrada Principal

La aplicacion arranca desde `src/main.ts`.

`main.ts` crea el `AppModule`, configura CORS, registra `express-session` y escucha en el puerto definido por `APP_PORT`.

## Modulo Raiz

`src/app.module.ts` concentra la configuracion base:

- `ConfigModule.forRoot()` lee `.env`.
- `TypeOrmModule.forRootAsync()` abre conexion MySQL.
- `ScheduleModule.forRoot()` habilita `@Cron` y `@Timeout`.
- Importa modulos de seguridad.
- Importa `DevicesModule`.
- Registra `MySQLInsertTablesService` para seed inicial.

## Dominio Principal

El dominio mas importante para la automatizacion esta bajo:

```text
src/residential/devices
```

Sus piezas principales son:

- `DevicesController`: API HTTP para dispositivos y control manual.
- `DevicesService`: capa de aplicacion para CRUD y delegacion al ciclo automatico.
- `AutomationService`: lifecycle principal del automatismo.
- `AdbService` / `AdbInstance`: control ADB, screenshots, UI dump, logcat y parser.
- `GpioService`: inicializacion y pulsos de GPIO.
- `SequenceExecutorService`: ejecuta steps configurados en base de datos.
- `DevicesSchedule`: monitoreo periodico de termica, bateria y conexion.

## Idea de Diseno Actual

La API y los controllers deben estar disponibles desde el inicio del proceso.

Los automatismos no se ejecutan dentro del constructor de servicios. Se disparan despues del bootstrap de Nest, usando `OnApplicationBootstrap` y `setImmediate`, para no bloquear la creacion de la aplicacion.

Ese punto es importante: el backend no solo sirve endpoints, tambien mantiene un proceso de automatizacion vivo en memoria.
