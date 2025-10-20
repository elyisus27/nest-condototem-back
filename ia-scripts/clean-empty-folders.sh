#!/bin/bash

# Este script elimina recursivamente todas las carpetas vacías
# dentro del directorio actual y sus subdirectorios.

echo "Buscando y eliminando carpetas vacías en el proyecto..."
echo "Esto puede tomar un momento dependiendo del tamaño de tu proyecto."

# El comando 'find' busca directorios vacíos.
# '-depth' asegura que los subdirectorios se procesen antes que sus padres,
# lo que es crucial si una carpeta se vuelve vacía después de que
# sus subcarpetas se eliminan.
# '-type d' especifica que estamos buscando directorios.
# '-empty' filtra para encontrar solo directorios vacíos.
# '-delete' elimina los directorios encontrados.
find . -depth -type d -empty -delete

echo "Proceso completado."
echo "Todas las carpetas vacías han sido eliminadas."