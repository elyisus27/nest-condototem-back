#!/bin/bash
#Asegurarse que este archivo tenga finales de línea de tipo Unix/Linux:  LF
# Set permissions for USB devices before starting the app
# This ensures the NestJS app has access
echo "Configuring USB device permissions..."
chmod -R 777 /dev/bus/usb

# Start the NestJS application
echo "Starting NestJS application..."
node dist/main
#npm run start:prod