# Arquitectura Actual

```
mermaid
flowchart TD

A[Abrir app] --> B[Ir a Visitas]
B --> C[Click Escanear QR]
C --> D[Activar cámara frontal]

D --> E[Esperar evento]
E -->|Cámara cerrada| F[Analizar resultado]

F -->|Válido| G[Permitir acceso]
F -->|Inválido| H[Denegar acceso]

G --> E
H --> E
```