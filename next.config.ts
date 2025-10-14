import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,

  // Ottimizzazioni per il caricamento
  compiler: {
    removeConsole: process.env.NODE_ENV === "production",
  },

  // Configurazione per le immagini
  images: {
    formats: ["image/avif", "image/webp"],
  },

  // Ottimizzazione del bundle
  experimental: {
    optimizePackageImports: ["lucide-react", "@tanstack/react-query"],
  },
    output: 'export', // <-- serve a sostituire next export

};

export default nextConfig;
