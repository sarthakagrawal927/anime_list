import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";
import Navigation from "@/components/Navigation";
import { AuthProvider } from "@/lib/auth";

export const metadata: Metadata = {
  title: {
    default: "MAL Explorer - Discover & Track Anime",
    template: "%s | MAL Explorer",
  },
  description:
    "Discover anime with powerful filters, explore statistics across 15,000+ titles, and track your watchlist. Built on MyAnimeList data.",
  keywords: [
    "anime", "myanimelist", "anime discovery", "anime tracker",
    "anime statistics", "watchlist", "anime search", "anime filter",
  ],
  authors: [{ name: "Sarthak Agrawal" }],
  openGraph: {
    title: "MAL Explorer - Discover & Track Anime",
    description:
      "Discover anime with powerful filters, explore statistics across 15,000+ titles, and track your watchlist.",
    type: "website",
    url: "https://anime-explorer-mal.vercel.app",
    siteName: "MAL Explorer",
  },
  twitter: {
    card: "summary",
    title: "MAL Explorer - Discover & Track Anime",
    description:
      "Discover anime with powerful filters, explore statistics across 15,000+ titles, and track your watchlist.",
  },
  robots: { index: true, follow: true },
  metadataBase: new URL("https://anime-explorer-mal.vercel.app"),
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">
        <Script src="https://accounts.google.com/gsi/client" strategy="afterInteractive" />
        <AuthProvider>
          <Navigation />
          <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">{children}</main>
        </AuthProvider>
      </body>
    </html>
  );
}
