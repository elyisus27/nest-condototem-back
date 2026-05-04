# 🤖 Automatización

## Flujo

1. Se inicia app en dispositivo
2. Se limpia logcat
3. Se escucha evento de cámara
4. Se interpreta estado:
   - aceptar visita
   - denegar visita
5. Se ejecuta acción:
   - GPIO
   - Secuencia

## Loop

El sistema permanece en espera de eventos:

- `cameraClosed`

