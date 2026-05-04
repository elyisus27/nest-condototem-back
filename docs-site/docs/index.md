# Condovive Totem Backend

Este sitio documenta el backend `nest-condovivetotem-backend`.

El proyecto es una API en NestJS que administra dispositivos tipo totem, controla una tablet Android mediante ADB, escucha eventos de camara/logcat, ejecuta secuencias de navegacion en la app Condovive Guard, acciona GPIO para apertura fisica y registra el cruce en base de datos.

La documentacion esta dividida en dos lecturas principales:

- **Administracion**: explicacion funcional, alcance operativo y vista global del sistema.
- **Developer**: arranque interno, lifecycle, modulos, servicios, endpoints, automatismos, datos y configuracion.

## Lectura recomendada

Para una vista no tecnica, empieza en [Administracion](administracion/index.md).

Para entender quien llama a quien, cuando arrancan los listeners y que responsabilidad tiene cada modulo, empieza en [Developer - Lifecycle y arranque](developer/lifecycle.md).
