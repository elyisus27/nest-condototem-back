#!/bin/bash

IP_TABLET="192.168.1.50"  # <--- Cambia por la IP de tu tablet
PUERTO_INICIO=30000
PUERTO_FIN=45000

echo "Buscando puerto ADB en $IP_TABLET..."

for puerto in $(seq $PUERTO_INICIO $PUERTO_FIN); do
  # Intento de apertura de socket (timeout de 1 segundo para el barrido)
  (echo > /dev/tcp/$IP_TABLET/$puerto) >/dev/null 2>&1 && {
    echo "[!] Puerto encontrado: $puerto. Intentando conexión ADB..."
    
    resultado=$(adb connect $IP_TABLET:$puerto)
    
    if [[ $resultado == *"connected"* ]]; then
      echo "OK: Conectado exitosamente a $IP_TABLET:$puerto"
      exit 0
    fi
  }
done

echo "No se encontró ningún puerto abierto en el rango especificado."
exit 1