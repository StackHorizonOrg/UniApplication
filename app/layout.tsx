import type { Metadata } from "next";
import { Geist, Noto_Serif } from "next/font/google";
import "@/app/globals.css";
import type React from "react";
import { TRPCProvider } from "@/lib/providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const notoSerif = Noto_Serif({
  variable: "--font-noto-serif",
  subsets: ["latin"],
  weight: ["400", "600", "700"],
});

export const metadata: Metadata = {
  title: "Orario Universitario",
  description: "App per visualizzare l'orario delle lezioni universitarie",
  icons: {
    icon: "/favicon.ico",
    apple: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="it" className="light">
      <body
        className={`${geistSans.variable} ${notoSerif.variable} font-sans antialiased bg-white dark:bg-black`}
      >
        <TRPCProvider>{children}</TRPCProvider>
      </body>
    </html>
  );
}
