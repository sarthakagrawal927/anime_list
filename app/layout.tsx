import { SaasMakerAnalytics } from '@/components/SaasMakerAnalytics'
import type { Metadata } from "next";
import Script from "next/script";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { Epilogue, Manrope } from "next/font/google";
import "./globals.css";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { AuthProvider } from "@/lib/auth";
import { QueryProvider } from "@/lib/query-provider";
import FeedbackWidgetWrapper from "@/components/FeedbackWidgetWrapper";
import { AnalyticsProvider } from "@/components/posthog-provider";

const epilogue = Epilogue({ subsets: ['latin'], variable: '--font-epilogue' });
const manrope = Manrope({ subsets: ['latin'], variable: '--font-manrope' });

export const metadata: Metadata = {
  title: {
    default: "NEON CURATOR - Discover & Track Anime",
    template: "%s | NEON CURATOR",
  },
  description:
    "Discover anime with powerful filters, explore statistics across 15,000+ titles, and track your watchlist. Built on MyAnimeList data.",
  keywords: [
    "anime", "myanimelist", "anime discovery", "anime tracker",
    "anime statistics", "watchlist", "anime search", "anime filter",
  ],
  authors: [{ name: "Sarthak Agrawal" }],
  openGraph: {
    title: "NEON CURATOR - Discover & Track Anime",
    description:
      "Discover anime with powerful filters, explore statistics across 15,000+ titles, and track your watchlist.",
    type: "website",
    url: "https://anime-explorer-mal.vercel.app",
    siteName: "NEON CURATOR",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "NEON CURATOR - Anime Discovery & Tracking",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "NEON CURATOR - Discover & Track Anime",
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
    <html lang="en" className="dark">
      <body data-analytics="true" className={`min-h-screen antialiased bg-background text-on-surface font-body selection:bg-primary-container selection:text-white ${epilogue.variable} ${manrope.variable} ${manrope.className}`}>
        <AnalyticsProvider>
          <SaasMakerAnalytics />
          <Script src="https://accounts.google.com/gsi/client" strategy="afterInteractive" />
          <Script
            id="structured-data"
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify({
                "@context": "https://schema.org",
                "@type": "WebApplication",
                name: "NEON CURATOR",
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
                <main className="pb-32 pt-20">{children}</main>
                <Footer />
                <FeedbackWidgetWrapper />
              </AuthProvider>
            </QueryProvider>
          </NuqsAdapter>
        </AnalyticsProvider>
      </body>
    </html>
  );
}
