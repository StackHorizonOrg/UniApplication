FROM node:20-alpine

# Installa tzdata per supportare i fusi orari e imposta TZ a Europe/Rome
RUN apk add --no-cache tzdata
ENV TZ=Europe/Rome

# Abilita pnpm tramite corepack
RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# Copia i file di configurazione del package
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# Copia TUTTI i file di configurazione necessari
COPY next.config.ts tsconfig.json ./
COPY tailwind.config.ts postcss.config.mjs ./
COPY components.json biome.json ./

# Installa le dipendenze (frozen-lockfile equivale a npm ci)
RUN pnpm install --frozen-lockfile

# Copia il codice sorgente
COPY app ./app
COPY lib ./lib
COPY server ./server

# Build dell'applicazione
RUN pnpm run build

# Rimuovi le dipendenze di sviluppo
RUN pnpm prune --prod

EXPOSE 3001
ENV PORT=3001
CMD ["pnpm", "start"]


# docker build -t uniapplication .
# docker run -d -p 3001:3001 --restart unless-stopped --name uniapplication uniapplication:latest