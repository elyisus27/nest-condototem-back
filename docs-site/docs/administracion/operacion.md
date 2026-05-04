# Operacion del Sistema

## Inicio del Servicio

Cuando el backend inicia, primero levanta la API HTTP y prepara las dependencias principales: configuracion, base de datos, modulos de seguridad, modulos de dispositivos y programadores internos.

Despues del bootstrap de NestJS, el servicio de automatizacion arranca el ciclo del dispositivo activo. Esta decision permite que la API quede disponible y que los controllers puedan responder mientras el flujo automatico se prepara.

## Flujo Administrativo de Cruce

1. El backend busca el dispositivo activo en la base de datos.
2. Se conecta por ADB si el dispositivo esta configurado con IP y puerto.
3. Fuerza el cierre de la app Android y limpia logcat.
4. Abre la app `com.condovive.guard`.
5. Navega a la pantalla de visitas.
6. Activa la camara frontal.
7. Se queda esperando eventos de camara desde logcat.
8. Cuando detecta un evento, lee la pantalla con UI Automator.
9. Clasifica el resultado como visita aceptada, denegada o desconocida.
10. Si corresponde, envia un pulso GPIO.
11. Ejecuta la secuencia configurada para regresar la app a estado operativo.
12. Guarda el registro del cruce.

## Que Puede Administrarse

Desde la API de dispositivos se puede:

- listar dispositivos registrados,
- guardar o actualizar dispositivos,
- eliminar dispositivos,
- consultar dispositivos paginados,
- iniciar servicios,
- detener servicios,
- reiniciar servicios,
- tomar screenshot del dispositivo activo,
- ejecutar pulso GPIO manual,
- actualizar direccion ADB,
- registrar datos termicos.

## Monitoreo

El sistema tiene un job programado cada 5 minutos que revisa los dispositivos mediante ADB.

Este job:

- valida si el dispositivo responde,
- intenta reconectar si esta offline,
- lee informacion termica desde `dumpsys thermalservice`,
- lee bateria desde `dumpsys battery`,
- guarda logs en `dev_thermal_logs`.

## Datos Iniciales

Existe un servicio de inicializacion que corre 5 segundos despues del arranque.

Si la base esta vacia, o si `DATABASE_SYNC` tiene el modo esperado por el proyecto, genera:

- perfiles basicos: admin, usuario y guardia,
- usuarios iniciales,
- relacion usuario-perfil,
- dispositivo inicial,
- secuencias iniciales de navegacion, aceptacion, rechazo y cierre.

## Consideraciones Operativas

- Debe existir al menos un dispositivo activo en base de datos.
- El host donde corre el backend debe tener acceso a `adb`.
- En hardware ARM, el GPIO intenta operar con la libreria `onoff`.
- En Windows u otros entornos sin GPIO, el pulso se registra como simulacion.
- La automatizacion depende de textos visibles y coordenadas de la app Android; cambios en la interfaz pueden requerir actualizar secuencias o condiciones de espera.
