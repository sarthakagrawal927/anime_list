"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

export default function GenreRandomPage() {
  const params = useParams<{ genre: string }>();
  const [msg, setMsg] = useState("Picking a random anime in this genre…");

  useEffect(() => {
    const genre = params?.genre;
    if (!genre) {
      setMsg("Missing genre.");
      return;
    }
    let aborted = false;
    fetch(`/api/anime?genre=${encodeURIComponent(genre)}&random=1&limit=1`, {
      cache: "no-store",
    })
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((data: unknown) => {
        if (aborted) return;
        const list =
          data && typeof data === "object" && "results" in data &&
          Array.isArray((data as { results: unknown }).results)
            ? ((data as { results: Array<{ mal_id?: number | string; id?: number | string }> }).results)
            : [];
        const pick = list[0];
        const id = pick?.mal_id ?? pick?.id;
        if (id != null) {
          window.location.replace(`/anime/${id}`);
        } else {
          setMsg(`No anime found for genre "${genre}".`);
        }
      })
      .catch(() => {
        if (!aborted) setMsg("Could not reach the catalog. Try again.");
      });
    return () => {
      aborted = true;
    };
  }, [params]);

  return (
    <main className="flex min-h-screen items-center justify-center p-8">
      <p className="font-mono text-sm text-muted-foreground">{msg}</p>
    </main>
  );
}
