#!/bin/bash

# Nombre del archivo de salida por defecto
OUTPUT_FILE="nest_project_info.txt"

# Función para imprimir la estructura de carpetas
print_directory_structure() {
    echo "## 1. Estructura de Carpetas (src - Nivel 4):"
    echo "---------------------------------------------------------"
    if command -v tree &> /dev/null; then
        tree -L 4 src
    else
        echo "El comando 'tree' no está instalado. Puedes usar 'ls -R src' como alternativa."
        ls -R src/
    fi
    echo ""
}

# Función para imprimir los módulos
print_modules() {
    echo "## 2. Archivos de Módulo (*.module.ts):"
    echo "---------------------------------------------------------"
    find src/ -name "*.module.ts" -exec sh -c '
        echo "### Archivo: {}"
        cat "{}"
        echo ""
    ' \;
    echo ""
}

# Función para imprimir los controladores
print_controllers() {
    echo "## 3. Archivos de Controlador (*.controller.ts):"
    echo "---------------------------------------------------------"
    find src/ -name "*.controller.ts" -exec sh -c '
        echo "### Archivo: {}"
        cat "{}"
        echo ""
    ' \;
    echo ""
}

# Función para imprimir los servicios
print_services() {
    echo "## 4. Archivos de Servicio (*.service.ts):"
    echo "---------------------------------------------------------"
    find src/ -name "*.service.ts" -exec sh -c '
        echo "### Archivo: {}"
        cat "{}"
        echo ""
    ' \;
    echo ""
}

# Función para imprimir los DTOs
print_dtos() {
    echo "## 5. Archivos DTO (*.dto.ts):"
    echo "---------------------------------------------------------"
    find src -name "*.dto.ts" -exec sh -c '
        echo "### Archivo: {}"
        cat "{}"
        echo ""
    ' \;
    echo ""
}

# Función para imprimir pipes y guards
print_pipes_and_guards() {
    echo "## 6. Pipes y Guards:"
    echo "---------------------------------------------------------"

    echo "-- Pipes (*.pipe.ts):"
    find src -name "*.pipe.ts" -exec sh -c '
        echo "### Archivo: {}"
        cat "{}"
        echo ""
    ' \;

    echo "-- Guards (*.guard.ts):"
    find src -name "*.guard.ts" -exec sh -c '
        echo "### Archivo: {}"
        cat "{}"
        echo ""
    ' \;

    echo ""
}

# Función para imprimir middlewares y filtros
print_middlewares_and_filters() {
    echo "## 7. Middlewares y Filtros (ExceptionFilter, Logger, etc.):"
    echo "---------------------------------------------------------"

    echo "-- Middlewares (*.middleware.ts):"
    find src -name "*.middleware.ts" -exec sh -c '
        echo "### Archivo: {}"
        cat "{}"
        echo ""
    ' \;

    echo "-- Exception Filters (*.filter.ts):"
    find src -name "*.filter.ts" -exec sh -c '
        echo "### Archivo: {}"
        cat "{}"
        echo ""
    ' \;

    echo ""
}

# --- Lógica Principal ---

echo "--- Recopilando Información del Proyecto NestJS ---"
echo ""

echo "Selecciona una opción de salida:"
echo "1) Mostrar en pantalla"
echo "2) Guardar en archivo ($OUTPUT_FILE)"
read -p "Tu elección (1 o 2): " choice

if [ "$choice" == "1" ]; then
    print_directory_structure
    print_modules
    print_controllers
    print_services
    print_dtos
    print_pipes_and_guards
    print_middlewares_and_filters
elif [ "$choice" == "2" ]; then
    echo "--- Recopilando Información del Proyecto NestJS ---" > "$OUTPUT_FILE"
    echo "" >> "$OUTPUT_FILE"
    print_directory_structure >> "$OUTPUT_FILE"
    print_modules >> "$OUTPUT_FILE"
    print_controllers >> "$OUTPUT_FILE"
    print_services >> "$OUTPUT_FILE"
    print_dtos >> "$OUTPUT_FILE"
    print_pipes_and_guards >> "$OUTPUT_FILE"
    print_middlewares_and_filters >> "$OUTPUT_FILE"
    echo -e "\nLa información ha sido guardada en: $OUTPUT_FILE"
else
    echo "Opción inválida. Saliendo del script."
    exit 1
fi

echo -e "\n--- Fin del Script ---"
