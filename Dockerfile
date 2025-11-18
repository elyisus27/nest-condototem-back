#intercambiar segun plataforma x86 / armv7 para solo testear docker build, o seguir dockerfile.instructions
FROM ubuntu:22.04 
#FROM arm32v7/ubuntu:22.04

RUN apt-get update && \
    apt-get install -yq \
        git \
        build-essential \
        curl \
        gnupg \
        udev \
        android-tools-adb \
        usbutils \
        python3 make g++ && \
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash - && \
    apt-get install -yq nodejs && \
    apt-get autoremove -y && \
    apt-get clean

# --- Instalar WiringOP desde la rama h3 ---
RUN git clone https://github.com/zhaolei/WiringOP.git -b h3 /tmp/WiringOP && \
    cd /tmp/WiringOP && \
    ./build && \
    rm -rf /tmp/WiringOP

RUN echo 'SUBSYSTEM=="usb", ENV{DEVTYPE}=="usb_device", MODE="0666", GROUP="plugdev"' > /etc/udev/rules.d/51-android.rules

WORKDIR /usr/src/app
COPY ./package.json ./package.json

RUN npm install onoff || true   # 👈 instalación aunque no esté en package.json, dependencias orange pi
RUN npm install                 


COPY start.sh ./
COPY ./dist ./dist

RUN chmod +x start.sh

EXPOSE 3001

# Set the entrypoint to the start script
CMD ["./start.sh"]