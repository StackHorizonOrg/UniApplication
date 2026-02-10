This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

### 1. Setup delle variabili d'ambiente

Copia il file `.env.example` in `.env.local` e configura le variabili:

```bash
cp .env.example .env.local
```

Modifica `.env.local` con i tuoi valori:
- `ADMIN_PASSWORD`: Password per l'accesso al pannello amministrativo

### 2. Avvia il server di sviluppo

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy

### Docker Deploy

Per il deploy con Docker, consulta la [guida completa al deploy](DEPLOY.md).

**Quick start con Docker Compose:**
```bash
docker-compose up -d
```

**Quick start con Docker:**
```bash
# Build
docker build -t uniapplication .

# Run
docker run -d -p 3001:3001 --env-file .env.local --restart unless-stopped --name uniapplication uniapplication:latest
```

### Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

**Nota:** Quando fai il deploy su Vercel, ricordati di configurare le variabili d'ambiente nel pannello di controllo.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
