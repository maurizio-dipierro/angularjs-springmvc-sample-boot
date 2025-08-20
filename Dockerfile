# Ambiente compatibile con Gulp 3 / Bower / BrowserSync “old”
FROM node:10.24.1

# repo Stretch -> archiviati: usa archive.debian.org
RUN sed -i -e 's/deb.debian.org/archive.debian.org/g' \
           -e 's|security.debian.org|archive.debian.org|g' /etc/apt/sources.list \
 && sed -i '/stretch-updates/d' /etc/apt/sources.list \
 && printf 'Acquire::Check-Valid-Until "false";\n' > /etc/apt/apt.conf.d/99no-check-valid \
 && apt-get update \
 && apt-get install -y --no-install-recommends git ca-certificates \
 && rm -rf /var/lib/apt/lists/*


# Tool globali coerenti con il progetto
RUN npm i -g gulp@3.9.1 gulp-cli bower

WORKDIR /app

# Usa il registry ufficiale; evita audit/fund per velocizzare
RUN npm config set registry https://registry.npmjs.org

# Copia i descriptor prima (per cache layer)
COPY package.json /app/
# Se hai anche bower.json, lo copiamo pure
COPY bower.json /app/

# Install deps npm
RUN npm install --no-audit --no-fund

# Pinna le versioni “vecchie” per evitare il crash engine.io/browser-sync
# (vedi errore this.pingIntervalTimer.refresh)
RUN npm i -D browser-sync@2.18.12 socket.io@1.7.3 socket.io-client@1.7.3 \
           engine.io@1.8.0 engine.io-client@1.8.0

# Installa le dipendenze Bower (run as root -> serve --allow-root)
RUN bower install --allow-root --config.interactive=false || true

# Ora copia il resto del progetto
COPY . /app

# Espone le porte usate da BrowserSync
EXPOSE 3000 3001

# Avvio di default: server di dev
CMD ["gulp", "serve"]
