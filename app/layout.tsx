import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";
import Navigation from "@/components/Navigation";
import { AuthProvider } from "@/lib/auth";

export const metadata: Metadata = {
  title: "MAL Explorer",
  description: "Anime discovery, statistics, and watchlist management",
  openGraph: {
    title: "MAL Explorer",
    description: "Discover anime with powerful filters, statistics, and watchlist tracking",
    type: "website",
    url: "https://anime-explorer-mal.vercel.app",
  },
  twitter: {
    card: "summary",
    title: "MAL Explorer",
    description: "Discover anime with powerful filters, statistics, and watchlist tracking",
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-gray-950 text-gray-100 min-h-screen">
        <Script src="https://accounts.google.com/gsi/client" strategy="afterInteractive" />
        <AuthProvider>
          <Navigation />
          <main className="max-w-7xl mx-auto px-4 py-6">{children}</main>
        </AuthProvider>
      </body>
    </html>
  );
}
