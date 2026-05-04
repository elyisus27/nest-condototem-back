#!/bin/bash

set -e

BASE_DIR="docs-site"
DOCS_DIR="$BASE_DIR/docs"

echo "🚀 Generando documentación completa (v2 técnica)..."

mkdir -p $DOCS_DIR/arquitectura/actual
mkdir -p $DOCS_DIR/arquitectura/nueva/componentes
mkdir -p $DOCS_DIR/arquitectura/nueva/flujos
mkdir -p $DOCS_DIR/arquitectura/nueva/decisiones

# -------------------------
# mkdocs.yml
# -------------------------
cat > $BASE_DIR/mkdocs.yml << 'EOF'
site_name: Condovive Totem Docs

theme:
  name: material
  features:
    - navigation.tabs
    - navigation.sections
    - navigation.expand
    - navigation.indexes

nav:
  - Inicio: index.md

  - Arquitectura:
      - Overview: arquitectura/index.md

      - Actual:
          - Overview: arquitectura/actual/index.md

      - Nueva (v2):
          - Overview: arquitectura/nueva/index.md
          - Visión General: arquitectura/nueva/vision-general.md

          - Componentes:
              - Execution Engine: arquitectura/nueva/componentes/execution-engine.md
              - Action Definition: arquitectura/nueva/componentes/action-definition.md
              - Screen Evaluator: arquitectura/nueva/componentes/screen-evaluator.md
              - Action Strategies: arquitectura/nueva/componentes/action-strategies.md
              - ADB Driver: arquitectura/nueva/componentes/adb-driver.md

          - Flujos:
              - Navegación: arquitectura/nueva/flujos/navegacion.md
              - Carga de Datos: arquitectura/nueva/flujos/carga-datos.md
              - Acciones Críticas: arquitectura/nueva/flujos/acciones-criticas.md

          - Decisiones:
              - Reintentos: arquitectura/nueva/decisiones/reintentos.md
              - Timeouts: arquitectura/nueva/decisiones/timeouts.md
              - Validaciones: arquitectura/nueva/decisiones/validaciones.md
EOF

# -------------------------
# BASE FILES
# -------------------------
cat > $DOCS_DIR/index.md << 'EOF'
# Condovive Totem Docs

Documentación técnica del sistema de automatización basado en ADB + evaluación de UI.
EOF

cat > $DOCS_DIR/arquitectura/index.md << 'EOF'
# Arquitectura

Se divide en:

- Arquitectura actual (legacy)
- Nueva arquitectura v2 (execution-driven)
EOF

cat > $DOCS_DIR/arquitectura/actual/index.md << 'EOF'
# Arquitectura Actual

Problemas identificados:

- Ejecución basada en sleeps
- Sin validación real de UI
- Acoplamiento fuerte entre pasos
- ADB expuesto directamente
EOF

cat > $DOCS_DIR/arquitectura/nueva/index.md << 'EOF'
# Nueva Arquitectura (v2)

Arquitectura orientada a ejecución basada en estado real de UI.

Principios:

- Acción → Validación → Decisión
- Sin sleeps ciegos
- Evaluación basada en XML
EOF

cat > $DOCS_DIR/arquitectura/nueva/vision-general.md << 'EOF'
# Visión General

Flujo:

State Machine → Execution Engine → ADB → UI → XML → Evaluator → Decision

El sistema no ejecuta pasos, interpreta estado.
EOF

# -------------------------
# EXECUTION ENGINE (FULL)
# -------------------------
cat > $DOCS_DIR/arquitectura/nueva/componentes/execution-engine.md << 'EOF'
# Execution Engine

Motor central de ejecución.

## Flujo interno

1. Ejecutar acción
2. Esperar estabilización (debounce)
3. Evaluar XML
4. Decidir

## Algoritmo

attempts = 0
start_time = now()

while true:

    execute(action)

    sleep(300ms)

    state = evaluator.evaluate()

    if state[action.validation]:
        return SUCCESS

    if now() - start_time > timeout:
        return TIMEOUT

    if strategy == "retry":
        if attempts >= max_retries:
            return FAILED
        attempts++

    elif strategy == "wait":
        sleep(1000)
        continue

    elif strategy == "fail":
        return FAILED

## Reglas

- Nunca avanzar sin validación
- Nunca retry infinito
- Timeout obligatorio
EOF

# -------------------------
# SCREEN EVALUATOR
# -------------------------
cat > $DOCS_DIR/arquitectura/nueva/componentes/screen-evaluator.md << 'EOF'
# Screen Evaluator

Analiza XML de UI.

## Fuente

adb shell uiautomator dump

## Ejemplo de reglas

VISIT_LIST_VISIBLE:
    existe nodo con texto "Visitas"

VISIT_LIST_LOADED:
    count(items) > 0

LOADING:
    existe progress bar

## Regla

Nunca usar tiempo como fuente de verdad.
EOF

# -------------------------
# STRATEGIES
# -------------------------
cat > $DOCS_DIR/arquitectura/nueva/componentes/action-strategies.md << 'EOF'
# Action Strategies

## Tipos

RETRY → navegación  
WAIT → carga  
FAIL → acciones críticas  

## Regla clave

La estrategia depende del efecto, no de la acción.
EOF

# -------------------------
# ADB DRIVER
# -------------------------
cat > $DOCS_DIR/arquitectura/nueva/componentes/adb-driver.md << 'EOF'
# ADB Driver

API mínima:

tap(x,y)
swipe(...)
dump_ui()

## Regla

ADB solo se usa aquí.
EOF

# -------------------------
# FLUJOS
# -------------------------
cat > $DOCS_DIR/arquitectura/nueva/flujos/navegacion.md << 'EOF'
# Navegación

tap → evaluar → retry

Resuelve taps perdidos y UI lenta.
EOF

cat > $DOCS_DIR/arquitectura/nueva/flujos/carga-datos.md << 'EOF'
# Carga de Datos

loop hasta que UI indique carga completa.
EOF

cat > $DOCS_DIR/arquitectura/nueva/flujos/acciones-criticas.md << 'EOF'
# Acciones Críticas

No reintentar.

Ejemplo: toggle cámara.
EOF

# -------------------------
# DECISIONES
# -------------------------
cat > $DOCS_DIR/arquitectura/nueva/decisiones/reintentos.md << 'EOF'
# Reintentos

Solo en acciones seguras.

Nunca infinitos.
EOF

cat > $DOCS_DIR/arquitectura/nueva/decisiones/timeouts.md << 'EOF'
# Timeouts

Previenen loops infinitos.
EOF

cat > $DOCS_DIR/arquitectura/nueva/decisiones/validaciones.md << 'EOF'
# Validaciones

Toda acción debe validarse contra XML.
EOF

echo "✅ Docs técnicos creados correctamente"
echo "👉 Ejecuta:"
echo "cd docs-site && mkdocs serve"