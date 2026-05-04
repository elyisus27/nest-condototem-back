# Device Schedule

El módulo **DeviceSchedule** es un job programado (cron) encargado de:

- Monitorear dispositivos Android vía Android Debug Bridge (ADB)
- Verificar conectividad
- Obtener métricas térmicas y de batería
- Persistir logs en base de datos

Se ejecuta de forma periódica cada 5 minutos, actuando como un recolector centralizado de telemetría.

```mermaid
flowchart TD
    A[Cron cada 5 minutos] --> B[Obtener lista de dispositivos]
    B --> C{Iterar dispositivos}

    C --> D[Ping ADB]
    D -->|Offline| E[Intentar reconnect adb]
    E --> C

    D -->|Online| F[Ejecutar dumpsys thermalservice]
    F --> G[Ejecutar dumpsys battery]

    G --> H{¿Datos válidos?}
    H -->|No| C
    H -->|Sí| I[Parsear thermal data]
    I --> J[Parsear battery data]

    J --> K[Construir entidad DeviceThermalLog]
    K --> L[Guardar en BD]

    L --> C
```
