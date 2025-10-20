#intercambiar segun plataforma x86 / armv7 para solo testear docker build, o seguir dockerfile.instructions
FROM ubuntu:22.04 
#FROM arm32v7/ubuntu:22.04

RUN apt-get update && \
    apt-get install -yq curl gnupg udev android-tools-adb usbutils && \
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash - && \
    apt-get install -yq nodejs python3 make g++ && \
    apt-get autoremove -y && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

RUN echo 'SUBSYSTEM=="usb", ENV{DEVTYPE}=="usb_device", MODE="0666", GROUP="plugdev"' > /etc/udev/rules.d/51-android.rules

WORKDIR /usr/src/app
COPY ./package.json ./package.json

RUN npm install onoff || true   # 👈 instalación aunque no esté en package.json, dependencias orange pi
RUN npm install                 


COPY start.sh ./
COPY ./dist ./dist

RUN chmod +x start.sh

EXPOSE 3000

# Set the entrypoint to the start script
CMD ["./start.sh"]