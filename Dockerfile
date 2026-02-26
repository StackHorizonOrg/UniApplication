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
COPY next.config.ts tsconfig.json drizzle.config.ts ./
COPY tailwind.config.ts postcss.config.mjs ./
COPY components.json biome.json ./

# Installa le dipendenze (frozen-lockfile equivale a npm ci)
RUN pnpm install --frozen-lockfile

# Copia il codice sorgente
COPY app ./app
COPY components ./components
COPY lib ./lib
COPY server ./server
COPY data ./data
COPY drizzle ./drizzle

# Copia il file .env.local per le variabili d'ambiente
COPY .env.local .env.local

# Build dell'applicazione
RUN pnpm run build

EXPOSE 3001
ENV PORT=3001

# Avvia migrazioni (push), poi app e worker usando tsx locale
CMD ["sh", "-c", "npx drizzle-kit push --config drizzle.config.ts --force && pnpm start & npx tsx server/jobs/check-updates.ts --cron"]


# docker build -t uniapplication .
# docker run -d -p 3001:3001 --restart unless-stopped --name uniapplication uniapplication:latest