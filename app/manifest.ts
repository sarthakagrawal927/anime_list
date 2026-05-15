import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "MAL Explorer",
    short_name: "MAL Explorer",
    description: "Anime / manga discovery + watchlist on top of MAL and AniList data.",
    start_url: "/",
    display: "standalone",
    background_color: "#0f172a",
    theme_color: "#60a5fa",
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml" },
    ],
  };
}
