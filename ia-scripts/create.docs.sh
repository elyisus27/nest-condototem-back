#!/bin/bash

echo "🚀 Generando documentación MkDocs..."

# Obtener ruta raíz del proyecto (subiendo desde ia-scripts)
ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
DOCS_DIR="$ROOT_DIR/docs-site"

echo "📁 Root detectado: $ROOT_DIR"

# Crear estructura base
mkdir -p "$DOCS_DIR/docs"
cd "$DOCS_DIR" || exit

# Crear mkdocs.yml
cat > mkdocs.yml << 'EOF'
site_name: Condovive Totem API
site_description: Documentación técnica del backend NestJS para automatización de dispositivos
theme:
  name: material

nav:
  - Inicio: index.md
  - Arquitectura:
      - Overview: arquitectura/overview.md
  - Backend:
      - Módulos: backend/modules.md
      - Controladores: backend/controllers.md
      - Servicios: backend/services.md
  - Dispositivos:
      - Flujo de Automatización: dispositivos/automation.md
      - ADB y Control: dispositivos/adb.md
      - GPIO: dispositivos/gpio.md
  - Seguridad:
      - Autenticación: seguridad/auth.md
EOF

# Crear carpetas
mkdir -p docs/arquitectura
mkdir -p docs/backend
mkdir -p docs/dispositivos
mkdir -p docs/seguridad

# =========================
# INDEX
# =========================
cat > docs/index.md << 'EOF'
# 🏠 Condovive Totem API

Backend desarrollado en **NestJS** para la automatización de dispositivos Android en entornos residenciales.

## 🔥 Características principales

- Control remoto de dispositivos vía ADB
- Automatización basada en eventos (logcat)
- Ejecución de secuencias dinámicas
- Integración con hardware (GPIO)
- Autenticación JWT

## 🧠 Enfoque del sistema

Este backend actúa como un **orquestador de dispositivos físicos**, permitiendo:

- Monitoreo
- Control
- Automatización de accesos

EOF

# =========================
# ARQUITECTURA
# =========================
cat > docs/arquitectura/overview.md << 'EOF'
# 🧠 Arquitectura del Sistema

El sistema sigue una arquitectura modular basada en NestJS.

## 📦 Módulos principales

- **Security**
  - Usuarios, perfiles y autenticación
- **Residential**
  - Dispositivos
  - Automatización

## 🔁 Flujo general

1. Dispositivo registrado en BD
2. Se crea instancia de servicio
3. Se conecta vía ADB
4. Se inicia loop de automatización
5. Eventos de cámara disparan acciones

## ⚙️ Componentes clave

- `DevicesService` → gestión central
- `AutomationService` → orquestación
- `CondoviveService` → lógica por dispositivo
- `AdbService` → interacción con Android
- `GpioService` → control hardware

EOF

# =========================
# BACKEND - MODULES
# =========================
cat > docs/backend/modules.md << 'EOF'
# 📦 Módulos

## AppModule

Módulo raíz que integra:

- TypeORM
- Configuración global
- Scheduler
- Módulos de negocio

## DevicesModule

Responsable de:

- Gestión de dispositivos
- Automatización
- ADB
- GPIO

## AuthModule

Manejo de autenticación JWT:

- Login
- Guards
- Estrategias

EOF

# =========================
# BACKEND - CONTROLLERS
# =========================
cat > docs/backend/controllers.md << 'EOF'
# 🎮 Controladores

## DevicesController

Endpoints clave:

- `/devices` → listado
- `/devices/start-services/:adbSerial`
- `/devices/stop-services/:adbSerial`
- `/devices/screenshot/:adbSerial`

## AdbController

- `/adb/:serial/screenshot`

## AuthController

- `/auth/login`
- `/auth/logout`

EOF

# =========================
# BACKEND - SERVICES
# =========================
cat > docs/backend/services.md << 'EOF'
# ⚙️ Servicios

## DevicesService

- Gestión de dispositivos en BD
- Registro de servicios activos
- Proxy hacia lógica de automatización

## AutomationService

- Inicializa ciclos
- Controla ejecución por dispositivo

## CondoviveService

- Loop principal de automatización
- Manejo de eventos de cámara
- Ejecución de secuencias

EOF

# =========================
# DISPOSITIVOS - AUTOMATION
# =========================
cat > docs/dispositivos/automation.md << 'EOF'
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

EOF

# =========================
# DISPOSITIVOS - ADB
# =========================
cat > docs/dispositivos/adb.md << 'EOF'
# 📱 ADB

## Funcionalidades

- Tap
- Swipe
- Screenshot
- Launch app
- Force stop

## Implementación

Uso de:

- `child_process.spawn`
- comandos adb directos

EOF

# =========================
# DISPOSITIVOS - GPIO
# =========================
cat > docs/dispositivos/gpio.md << 'EOF'
# ⚡ GPIO

## Uso

- Control de apertura de puertas
- Pulsos eléctricos

## Comportamiento

- ARM → hardware real
- Windows → simulación

EOF

# =========================
# SEGURIDAD
# =========================
cat > docs/seguridad/auth.md << 'EOF'
# 🔐 Autenticación

## Login

- Usuario + contraseña
- Validación con bcrypt

## JWT

- Token firmado
- Expiración: 1 hora

## Guards

Protección de endpoints mediante:

- `AuthGuard('jwt')`

EOF

echo "✅ Documentación generada en: $DOCS_DIR"

echo ""
echo "👉 Siguiente paso:"
echo "cd docs-site"
echo "pip install mkdocs-material"
echo "mkdocs serve"