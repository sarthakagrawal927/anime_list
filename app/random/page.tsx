"use client";

import { useEffect, useState } from "react";

/**
 * /random — picks a random anime from the public catalog and bounces
 * the visitor there. Pure client-side: hits /api/anime/random which
 * already exists for the "Surprise me" button on the homepage; if that
 * endpoint isn't available it falls back to /.
 */
export default function RandomAnime() {
  const [msg, setMsg] = useState("Picking a random anime…");

  useEffect(() => {
    let aborted = false;
    fetch("/api/anime?random=1&limit=1", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((data: unknown) => {
        if (aborted) return;
        const list =
          data && typeof data === "object" && "results" in data && Array.isArray((data as { results: unknown }).results)
            ? ((data as { results: Array<{ mal_id?: number | string; id?: number | string }> }).results)
            : [];
        const pick = list[0];
        const id = pick?.mal_id ?? pick?.id;
        if (id != null) {
          window.location.replace(`/anime/${id}`);
        } else {
          setMsg("No anime available right now.");
        }
      })
      .catch(() => {
        if (!aborted) setMsg("Could not reach the catalog. Try again.");
      });
    return () => {
      aborted = true;
    };
  }, []);

  return (
    <main className="flex min-h-screen items-center justify-center p-8">
      <p className="font-mono text-sm text-muted-foreground">{msg}</p>
    </main>
  );
}
