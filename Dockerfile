# STAGE 1 — BUILD (ARM)
#intercambiar segun plataforma x86 / armv7 para solo testear docker build, o seguir dockerfile.instructions
FROM node:18-bookworm AS builder
#FROM arm32v7/node:18-bookworm AS builder

RUN apt-get update && apt-get install -y \
    git \
    build-essential \
    python3 \
    make \
    g++ \
    android-tools-adb \
    udev \
 && rm -rf /var/lib/apt/lists/*

# WiringOP
RUN git clone https://github.com/zhaolei/WiringOP.git -b h3 /tmp/WiringOP && \
    cd /tmp/WiringOP && ./build && rm -rf /tmp/WiringOP

WORKDIR /usr/src/app

COPY package.json package-lock.json ./

RUN npm ci --omit=dev --build-from-source && npm cache clean --force

COPY dist ./dist
COPY start.sh ./start.sh
RUN chmod +x start.sh

# STAGE 2 — RUNTIME

FROM node:18-bookworm-slim

RUN apt-get update && apt-get install -y \
    android-tools-adb \
    libusb-1.0-0 \
    udev \
 && rm -rf /var/lib/apt/lists/*

# 🔑 Regla udev para ADB persistente
RUN echo 'SUBSYSTEM=="usb", ENV{DEVTYPE}=="usb_device", MODE="0666", GROUP="plugdev"' \
    > /etc/udev/rules.d/51-android.rules

WORKDIR /usr/src/app

COPY --from=builder /usr/src/app/dist ./dist
COPY --from=builder /usr/src/app/node_modules ./node_modules
COPY --from=builder /usr/src/app/start.sh ./start.sh

EXPOSE 3001
CMD ["./start.sh"]