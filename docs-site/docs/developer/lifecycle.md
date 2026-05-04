# Lifecycle y Arranque

Esta pagina describe quien llama a quien y en que momento.

## Secuencia de Arranque

```mermaid
sequenceDiagram
    participant Main as main.ts
    participant Nest as NestFactory
    participant App as AppModule
    participant DB as TypeORM/MySQL
    participant Sched as ScheduleModule
    participant GPIO as GpioService
    participant Seed as MySQLInsertTablesService
    participant Auto as AutomationService
    participant HTTP as Controllers

    Main->>Nest: NestFactory.create(AppModule)
    Nest->>App: Construye modulos y providers
    App->>DB: Crea conexion TypeORM
    App->>Sched: Habilita Cron y Timeout
    Nest->>GPIO: onModuleInit()
    Main->>HTTP: app.listen(APP_PORT)
    Nest->>Auto: onApplicationBootstrap()
    Auto->>Auto: setImmediate(startCycle)
    Sched->>Seed: @Timeout(5000)
```

## Orden Conceptual

1. `bootstrap()` crea la aplicacion Nest.
2. Nest resuelve imports, controllers y providers.
3. Se inicializa configuracion y base de datos.
4. Se habilita scheduler.
5. Providers con hooks de lifecycle ejecutan su inicializacion.
6. `main.ts` configura CORS y session.
7. `app.listen(APP_PORT)` deja la API disponible.
8. `AutomationService.onApplicationBootstrap()` agenda `startCycle()`.
9. `MySQLInsertTablesService.handleTimeout()` corre despues de 5 segundos para seed inicial.
10. `DevicesSchedule.monitorDevices()` queda programado cada 5 minutos.

## Lifecycle de `AutomationService`

`AutomationService` implementa `OnApplicationBootstrap`.

Su hook:

```ts
async onApplicationBootstrap() {
  setImmediate(() => {
    this.startCycle().catch(...)
  });
}
```

La intencion es que el ciclo automatico arranque despues de que Nest termino de levantar la aplicacion. `setImmediate` evita que el trabajo largo de ADB bloquee directamente el hook.

## Ciclo Principal de Automatizacion

```mermaid
flowchart TD
    A[startCycle] --> B[loadActiveDevice]
    B -->|sin device| Z[termina]
    B --> C[crear AdbInstance]
    C --> D[running = true]
    D --> E[initAndNavigate]
    E --> F[forceStopApp]
    F --> G[clearLogcat]
    G --> H[launchApp]
    H --> I[waitForUI Home]
    I --> J[tap Visitas]
    J --> K[waitForUI Escanear QR]
    K --> L[tap Escanear QR]
    L --> M[waitForUI Camara]
    M --> N[tap flip camara frontal]
    N --> O[runAutomationLoop]
```

## Loop de Eventos

`runAutomationLoop()` inicia el listener de logcat una sola vez y despues queda esperando eventos:

```mermaid
flowchart TD
    A[startListeningForCameraEvents] --> B[waitForCameraEvent]
    B --> C[Evento cameraClosed]
    C --> D[loadActiveDevice fresco]
    D --> E{state}
    E -->|aceptar visita| F[Pulso GPIO si hay pin]
    E -->|denegar visita| G[Pulso opcional segun PULSE_ON_DENY]
    E -->|unknown| H[Sin pulso por defecto]
    F --> I[buscar secuencia por nombre]
    G --> I
    H --> I
    I --> J[SequenceExecutorService.executeSequence]
    J --> K[saveCrossingLog]
    K --> B
```

## Stop y Restart

`stopCycle()`:

- marca `running = false`,
- detiene el listener ADB con `adb.stopListening()`,
- limpia la instancia activa.

`restartCycle()`:

- llama `stopCycle()`,
- espera 1 segundo,
- llama `startCycle()`.

## Lifecycle de `GpioService`

`GpioService` implementa `OnModuleInit`.

Durante `onModuleInit()`:

- detecta arquitectura con `process.arch`,
- si corre en ARM intenta cargar `onoff`,
- busca dispositivos habilitados,
- inicializa los pines en estado alto (`writeSync(1)`),
- si no hay hardware compatible, trabaja en modo simulacion.

## Lifecycle de Jobs Programados

`MySQLInsertTablesService` usa `@Timeout(5000)` para inicializar data base despues del arranque.

`DevicesSchedule` usa `@Cron('0 */5 * * * *')`, por lo que corre cada 5 minutos en el segundo 0.

## Punto Importante

Hay dos mundos corriendo al mismo tiempo:

- **HTTP/API**: controllers disponibles para frontend, administracion o pruebas manuales.
- **Automatizacion viva**: loop en memoria esperando eventos de ADB/logcat y ejecutando acciones fisicas.

Por eso el manejo de estado en `AutomationService` (`running`, `adb`) es el centro operativo del sistema.
