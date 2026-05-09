import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
import { SiteShell } from "@/components/layout";
import { getAuthState } from "@/lib/auth";
import { leagueConfig } from "@/lib/league-config";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const themeColor = "#050608";

export const metadata: Metadata = {
  metadataBase: new URL(leagueConfig.siteUrl),
  applicationName: "Mediterranean Endurance League",
  title: {
    default: `${leagueConfig.leagueName} | Le Mans Ultimate Racing`,
    template: `%s | ${leagueConfig.leagueName}`,
  },
  description: leagueConfig.description,
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: leagueConfig.shortName,
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [
      { url: "/icon", type: "image/png", sizes: "192x192" },
      { url: "/app-icon.svg", type: "image/svg+xml", sizes: "any" },
    ],
    apple: [{ url: "/apple-icon", type: "image/png", sizes: "180x180" }],
  },
  openGraph: {
    title: leagueConfig.leagueName,
    description: leagueConfig.description,
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor,
  viewportFit: "cover",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const auth = await getAuthState();

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full">
        <SiteShell auth={auth}>{children}</SiteShell>
        <Analytics />
      </body>
    </html>
  );
}
