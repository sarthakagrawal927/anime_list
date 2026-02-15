import type { Metadata } from "next";
import Script from "next/script";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import "./globals.css";
import Navigation from "@/components/Navigation";
import { AuthProvider } from "@/lib/auth";
import { QueryProvider } from "@/lib/query-provider";

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
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "MAL Explorer - Anime Discovery & Tracking",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "MAL Explorer - Discover & Track Anime",
    description:
      "Discover anime with powerful filters, explore statistics across 15,000+ titles, and track your watchlist.",
    images: ["/og-image.png"],
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
        <Script
          id="structured-data"
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebApplication",
              name: "MAL Explorer",
              description:
                "Discover anime with powerful filters, explore statistics across 15,000+ titles, and track your watchlist.",
              url: "https://anime-explorer-mal.vercel.app",
              applicationCategory: "EntertainmentApplication",
              operatingSystem: "Web",
              offers: {
                "@type": "Offer",
                price: "0",
                priceCurrency: "USD",
              },
            }),
          }}
        />
        <NuqsAdapter>
          <QueryProvider>
            <AuthProvider>
              <Navigation />
              <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">{children}</main>
            </AuthProvider>
          </QueryProvider>
        </NuqsAdapter>
      </body>
    </html>
  );
}
