import type { Metadata } from "next";
import { Geist, Noto_Serif } from "next/font/google";
import "@/app/globals.css";
import Script from "next/script";
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

const themeScript = `
  (function() {
    const theme = localStorage.getItem('theme');
    if (theme === 'dark' || (!theme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    } else {
      document.documentElement.classList.add('light');
      document.documentElement.classList.remove('dark');
    }
  })();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="it" className="light" suppressHydrationWarning>
      <head>
        <Script id="theme-switcher" strategy="beforeInteractive">
          {themeScript}
        </Script>
      </head>
      <body
        className={`${geistSans.variable} ${notoSerif.variable} font-sans antialiased bg-white dark:bg-black`}
      >
        <TRPCProvider>{children}</TRPCProvider>
        {process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID && (
          <Script
            src="https://cloud.umami.is/script.js"
            data-website-id={process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID}
            strategy="afterInteractive"
          />
        )}
      </body>
    </html>
  );
}
