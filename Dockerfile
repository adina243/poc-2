# Utiliser une image Node.js légère
#FROM node:16-slim
FROM accetto/ubuntu-vnc-xfce-chromium-g3

# Skipper le téléchargement de Chromium intégré de Puppeteer
#ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD true

# Mettre à jour les certificats et installer les dépendances nécessaires, y compris Google Chrome, Xvfb, et VNC
#RUN apt-get update && apt-get install -y \
#    ca-certificates \
#    wget \
#    gnupg \
#    supervisor \
#    x11vnc \
#    xvfb \
#    fonts-liberation \
#    libappindicator3-1 \
#    libasound2 \
#    libatk-bridge2.0-0 \
#    libatk1.0-0 \
#    libcups2 \
#    libdbus-glib-1-2 \
#    libx11-xcb1 \
#    libxcomposite1 \
#    libxdamage1 \
#    libxrandr2 \
#    libgbm1 \
#    xdg-utils \
#    --no-install-recommends && \
#    update-ca-certificates && \
#    wget https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb && \
#    apt-get install -y ./google-chrome-stable_current_amd64.deb && \
#    rm google-chrome-stable_current_amd64.deb && \
#    rm -rf /var/lib/apt/lists/*
RUN apt-get update && apt-get install -y \
    git-core \
    curl \
    build-essential \
    openssl libssl-dev && \
    git clone https://github.com/nodejs/node.git && \
    cd node && \
    ./configure && \
    make && \
    sudo make install

# Travailler dans le répertoire /app
WORKDIR /app
COPY package.json package-lock.json ./ 
RUN npm install

# Copier l'application
COPY . .

# Configurer supervisord pour gérer VNC, Xvfb et Google Chrome
#COPY supervisord.conf /etc/supervisor/conf.d/supervisord.conf

# Exposer les ports pour le serveur Node.js et le VNC
EXPOSE 3000 5901 6901

# Lancer supervisord pour gérer VNC, Xvfb et Google Chrome
# CMD ["/usr/bin/supervisord"]
CMD ["node", "server.js"]