FROM accetto/ubuntu-vnc-xfce-chromium-g3:latest
USER root
# Skipper le téléchargement de Chromium intégré de Puppeteer
#ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD true

RUN apt update && apt install -y \
    nodejs && \
    node -v 
RUN apt install -y npm 
RUN ln -s /usr/bin/chromium-browser /usr/bin/chromium

# Travailler dans le répertoire /app
WORKDIR /app
COPY package.json package-lock.json ./ 
RUN npm install

# Copier l'application
COPY . .

# Exposer les ports pour le serveur Node.js et le VNC
EXPOSE 3000 5901 6901

CMD ["node", "server.js"]