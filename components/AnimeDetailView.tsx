"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  ArrowUpRight,
  ExternalLink,
  Film,
  Heart,
  ListTree,
  Sparkles,
  Star,
  Tv,
  Users,
} from "lucide-react";
import { getAnimeDetail, updateAnimeNote } from "@/lib/api";
import type {
  AnimeDetail,
  AnimeRecommendationItem,
  AnimeRelationItem,
} from "@/lib/types";
import { cn, getAnimeDetailHref } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/lib/auth";

const compactNumber = new Intl.NumberFormat("en-US", {
  notation: "compact",
  maximumFractionDigits: 1,
});

const wholeNumber = new Intl.NumberFormat("en-US");

function animeTitle<T extends { title: string; title_english?: string | null }>(anime: T): string {
  return anime.title_english || anime.title;
}

function formatStat(value?: number | null, compact = false): string | null {
  if (value == null || value <= 0) return null;
  return compact ? compactNumber.format(value) : wholeNumber.format(value);
}

function StatTile({
  label,
  value,
  icon: Icon,
  accent = false,
}: {
  label: string;
  value: string;
  icon: typeof Star;
  accent?: boolean;
}) {
  return (
    <div className="rounded-xl border border-border/70 bg-background/30 p-3">
      <div className="mb-2 flex items-center gap-2 text-xs text-muted-foreground">
        <Icon className="h-3.5 w-3.5" />
        <span>{label}</span>
      </div>
      <div className={cn("text-lg font-semibold text-foreground", accent && "text-primary")}>
        {value}
      </div>
    </div>
  );
}

function MetaRow({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value) return null;

  return (
    <div className="flex items-start justify-between gap-3 border-b border-border/50 py-2 last:border-0 last:pb-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-right text-sm text-foreground">{value}</span>
    </div>
  );
}

function TagList({ label, items }: { label: string; items: string[] }) {
  if (items.length === 0) return null;

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-medium text-foreground">{label}</h3>
      <div className="flex flex-wrap gap-2">
        {items.map((item) => (
          <Badge key={`${label}-${item}`} variant="secondary" className="bg-secondary/70">
            {item}
          </Badge>
        ))}
      </div>
    </div>
  );
}

function RelatedTitleLink({
  item,
  relationLabel,
}: {
  item: AnimeRelationItem;
  relationLabel?: string;
}) {
  const title = animeTitle(item);
  const isAnimeRoute = item.url?.includes("/anime/") ?? false;
  const href = getAnimeDetailHref(item.mal_id);
  const className =
    "group flex items-start justify-between gap-3 rounded-xl border border-border/70 bg-background/30 px-3 py-2 transition-colors hover:border-primary/40 hover:bg-accent/40";
  const body = (
    <>
      <div className="min-w-0 space-y-1">
        <div className="truncate text-sm font-medium text-foreground group-hover:text-primary">
          {title}
        </div>
        <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
          {item.type ? <span className="uppercase tracking-[0.12em]">{item.type}</span> : null}
          {item.year ? <span>{item.year}</span> : null}
          {relationLabel ? (
            <Badge variant="outline" className="h-5 px-1.5 text-[10px]">
              {relationLabel}
            </Badge>
          ) : null}
        </div>
      </div>
      <ArrowUpRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-primary" />
    </>
  );

  if (isAnimeRoute) {
    return (
      <Link href={href} className={className}>
        {body}
      </Link>
    );
  }

  return item.url ? (
    <a href={item.url} target="_blank" rel="noopener noreferrer" className={className}>
      {body}
    </a>
  ) : (
    <div className={className}>{body}</div>
  );
}

function RelationBucket({
  title,
  description,
  items,
  emptyLabel,
}: {
  title: string;
  description: string;
  items: AnimeRelationItem[];
  emptyLabel: string;
}) {
  return (
    <div className="rounded-2xl border border-border/70 bg-card/70 p-4">
      <div className="mb-3 space-y-1">
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>

      {items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border/70 px-3 py-5 text-sm text-muted-foreground">
          {emptyLabel}
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((item) => (
            <RelatedTitleLink
              key={`${title}-${item.relation}-${item.mal_id}`}
              item={item}
              relationLabel={title === "Franchise Guide" ? item.relation : undefined}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-9 w-32 rounded-md bg-muted" />
      <div className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
        <div className="aspect-[2/3] rounded-3xl bg-muted" />
        <div className="space-y-4 rounded-3xl border border-border/60 bg-card/60 p-6">
          <div className="space-y-2">
            <div className="h-4 w-28 rounded bg-muted" />
            <div className="h-8 w-2/3 rounded bg-muted" />
            <div className="h-4 w-1/2 rounded bg-muted" />
          </div>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="h-20 rounded-xl bg-muted" />
            ))}
          </div>
          <div className="space-y-2">
            <div className="h-4 w-full rounded bg-muted" />
            <div className="h-4 w-full rounded bg-muted" />
            <div className="h-4 w-4/5 rounded bg-muted" />
          </div>
        </div>
      </div>
      <div className="grid gap-6 xl:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="h-56 rounded-3xl bg-muted" />
        ))}
      </div>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="h-36 rounded-2xl bg-muted" />
        ))}
      </div>
    </div>
  );
}

export default function AnimeDetailView({ malId }: { malId: number }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [noteDraft, setNoteDraft] = useState("");
  const detailQuery = useQuery({
    queryKey: ["anime", "detail", malId],
    queryFn: () => getAnimeDetail(malId),
  });
  const noteMutation = useMutation({
    mutationFn: (note: string) => updateAnimeNote(malId, note),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["anime", "detail", malId] });
      queryClient.invalidateQueries({ queryKey: ["watchlist"] });
    },
  });

  const groupedRelations = useMemo(() => {
    if (!detailQuery.data) return [];

    const groups = new Map<string, AnimeRelationItem[]>();
    for (const item of detailQuery.data.relations) {
      const bucket = groups.get(item.relation) ?? [];
      bucket.push(item);
      groups.set(item.relation, bucket);
    }

    return Array.from(groups.entries()).map(([relation, items]) => ({
      relation,
      items: items.sort((left, right) => animeTitle(left).localeCompare(animeTitle(right))),
    }));
  }, [detailQuery.data]);

  const recommendations = useMemo(() => {
    if (!detailQuery.data) return [];

    const deduped = new Map<number, AnimeRecommendationItem>();

    for (const item of [...detailQuery.data.recommendations].sort((a, b) => b.votes - a.votes)) {
      if (item.mal_id === malId) continue;
      if (!deduped.has(item.mal_id)) {
        deduped.set(item.mal_id, item);
      }
    }

    return Array.from(deduped.values()).slice(0, 12);
  }, [detailQuery.data, malId]);

  useEffect(() => {
    setNoteDraft(detailQuery.data?.watchlistEntry?.note ?? "");
  }, [detailQuery.data?.watchlistEntry?.note]);

  if (detailQuery.isLoading) {
    return <LoadingSkeleton />;
  }

  if (detailQuery.error || !detailQuery.data) {
    return (
      <div className="space-y-4">
        <Button asChild variant="ghost" size="sm">
          <Link href="/">
            <ArrowLeft />
            Back to Discover
          </Link>
        </Button>
        <Card className="border-destructive/30 bg-destructive/5">
          <CardHeader>
            <CardTitle>Unable to load anime details</CardTitle>
            <CardDescription>
              {detailQuery.error instanceof Error
                ? detailQuery.error.message
                : "The anime detail page could not be loaded right now."}
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const { anime, relations, watchlistEntry } = detailQuery.data;
  const title = animeTitle(anime);
  const secondaryTitle = anime.title !== title ? anime.title : null;
  const score = formatStat(anime.score);
  const scoredBy = formatStat(anime.scored_by, true);
  const members = formatStat(anime.members, true);
  const favorites = formatStat(anime.favorites, true);
  const synopsis = anime.synopsis?.trim();
  const prequels = relations.filter((item) => item.relation.toLowerCase() === "prequel");
  const sequels = relations.filter((item) => item.relation.toLowerCase() === "sequel");
  const franchiseGuide = relations.filter((item) => {
    const relation = item.relation.toLowerCase();
    return relation !== "prequel" && relation !== "sequel";
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button asChild variant="ghost" size="sm">
          <Link href="/">
            <ArrowLeft />
            Back to Discover
          </Link>
        </Button>

        <Button asChild variant="outline" size="sm">
          <a href={anime.url} target="_blank" rel="noopener noreferrer">
            <ExternalLink />
            Open on MAL
          </a>
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
        <Card className="overflow-hidden p-0">
          <div className="relative aspect-[2/3] bg-muted">
            {anime.image ? (
              <Image
                src={anime.image}
                alt={title}
                fill
                priority
                className="object-cover"
                sizes="(max-width: 1024px) 80vw, 280px"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-sm text-muted-foreground">
                No image available
              </div>
            )}
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent p-4">
              <div className="flex flex-wrap gap-2">
                {anime.type ? <Badge>{anime.type}</Badge> : null}
                {anime.status ? <Badge variant="secondary">{anime.status}</Badge> : null}
                {anime.year ? <Badge variant="outline">{anime.year}</Badge> : null}
              </div>
            </div>
          </div>
        </Card>

        <Card className="overflow-hidden border-primary/15 bg-card/85">
          <CardHeader className="space-y-4">
            <div className="space-y-3">
              <div className="flex flex-wrap gap-2">
                {anime.season ? (
                  <Badge variant="outline" className="uppercase tracking-[0.16em]">
                    {anime.season}
                  </Badge>
                ) : null}
                {watchlistEntry ? <Badge variant="secondary">{watchlistEntry.status}</Badge> : null}
              </div>
              <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tight text-foreground">{title}</h1>
                {secondaryTitle ? (
                  <p className="text-sm text-muted-foreground">{secondaryTitle}</p>
                ) : null}
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {score ? <StatTile label="Score" value={score} icon={Star} accent /> : null}
              {members ? <StatTile label="Members" value={members} icon={Users} /> : null}
              {favorites ? <StatTile label="Favorites" value={favorites} icon={Heart} /> : null}
              {anime.episodes ? (
                <StatTile label="Episodes" value={wholeNumber.format(anime.episodes)} icon={Film} />
              ) : null}
            </div>
          </CardHeader>

          <CardContent className="space-y-5">
            {synopsis ? (
              <div className="space-y-2">
                <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  Synopsis
                </h2>
                <p className="text-sm leading-7 text-foreground/90">{synopsis}</p>
              </div>
            ) : null}

            {watchlistEntry ? (
              <div className="rounded-2xl border border-primary/15 bg-background/30 p-4">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-medium text-foreground">Private note</h3>
                    <p className="text-xs text-muted-foreground">
                      Only visible to you while this anime stays in your watchlist.
                    </p>
                  </div>
                  <Badge variant="secondary">{watchlistEntry.status}</Badge>
                </div>
                <textarea
                  value={noteDraft}
                  onChange={(event) => setNoteDraft(event.target.value)}
                  rows={4}
                  maxLength={2000}
                  className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                  placeholder="Add a private note about this anime..."
                />
                <div className="mt-3 flex items-center justify-between gap-3">
                  <span className="text-xs text-muted-foreground">
                    {noteDraft.trim().length}/2000
                  </span>
                  <Button
                    size="sm"
                    onClick={() => noteMutation.mutate(noteDraft)}
                    disabled={
                      noteMutation.isPending ||
                      noteDraft.trim() === (watchlistEntry.note ?? "").trim()
                    }
                  >
                    {noteMutation.isPending ? "Saving..." : "Save note"}
                  </Button>
                </div>
              </div>
            ) : user ? (
              <div className="rounded-2xl border border-dashed border-border/70 px-4 py-4 text-sm text-muted-foreground">
                Add this anime to a watchlist first if you want to keep a private note.
              </div>
            ) : null}

            <div className="grid gap-5 lg:grid-cols-[minmax(0,1.4fr)_minmax(280px,0.9fr)]">
              <div className="space-y-4">
                <TagList label="Genres" items={anime.genres} />
                <TagList label="Themes" items={anime.themes} />
                <TagList label="Demographics" items={anime.demographics} />
              </div>

              <div className="rounded-2xl border border-border/60 bg-background/30 p-4">
                <div className="mb-3 flex items-center gap-2 text-sm font-medium text-foreground">
                  <Tv className="h-4 w-4 text-primary" />
                  Base Info
                </div>
                <MetaRow label="Type" value={anime.type ?? null} />
                <MetaRow label="Status" value={anime.status ?? null} />
                <MetaRow label="Season" value={anime.season ?? null} />
                <MetaRow label="Year" value={anime.year ? String(anime.year) : null} />
                <MetaRow label="Rank" value={anime.rank ? `#${wholeNumber.format(anime.rank)}` : null} />
                <MetaRow
                  label="Popularity"
                  value={anime.popularity ? `#${wholeNumber.format(anime.popularity)}` : null}
                />
                <MetaRow label="Scored By" value={scoredBy ? `${scoredBy} users` : null} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="overflow-hidden">
        <CardHeader>
          <div className="flex items-center gap-2">
            <ListTree className="h-4 w-4 text-primary" />
            <CardTitle>Relations</CardTitle>
          </div>
          <CardDescription>
            Follow direct sequels and prequels first, then use the franchise guide for spin-offs,
            side stories, and other connected titles.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid gap-4 xl:grid-cols-3">
            <RelationBucket
              title="Prequel"
              description="What to watch before this entry."
              items={prequels}
              emptyLabel="No direct prequel is listed for this title."
            />
            <RelationBucket
              title="Sequel"
              description="What continues the story from here."
              items={sequels}
              emptyLabel="No direct sequel is listed for this title."
            />
            <RelationBucket
              title="Franchise Guide"
              description="Broader franchise context beyond the main watch order."
              items={franchiseGuide}
              emptyLabel="No additional franchise connections are listed."
            />
          </div>

          <div className="space-y-3">
            <div className="text-sm font-medium text-foreground">All Relation Groups</div>

            {groupedRelations.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border/70 px-4 py-8 text-center text-sm text-muted-foreground">
                No related titles are available for this anime.
              </div>
            ) : (
              <div className="grid gap-4 lg:grid-cols-2">
                {groupedRelations.map((group) => (
                  <div
                    key={group.relation}
                    className="rounded-2xl border border-border/60 bg-background/30 p-4"
                  >
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <h3 className="text-sm font-semibold text-foreground">{group.relation}</h3>
                      <Badge variant="outline">{group.items.length}</Badge>
                    </div>
                    <div className="space-y-2">
                      {group.items.map((item) => (
                        <RelatedTitleLink
                          key={`${group.relation}-${item.mal_id}`}
                          item={item}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="overflow-hidden">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <CardTitle>Recommendations</CardTitle>
          </div>
          <CardDescription>
            Community suggestions for where to go next after this title.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {recommendations.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border/70 px-4 py-8 text-center text-sm text-muted-foreground">
              No recommendations were returned for this anime.
            </div>
          ) : (
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {recommendations.map((item) => {
                const title = animeTitle(item);
                return (
                  <Card
                    key={item.mal_id}
                    className="overflow-hidden border-border/70 bg-background/30 p-0 transition-colors hover:border-primary/40"
                  >
                    <div className="flex h-full">
                      <Link
                        href={getAnimeDetailHref(item.mal_id)}
                        className="relative block w-[92px] shrink-0 bg-muted"
                      >
                        {item.image ? (
                          <Image
                            src={item.image}
                            alt={title}
                            fill
                            className="object-cover"
                            sizes="92px"
                          />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center text-xs text-muted-foreground">
                            No image
                          </div>
                        )}
                      </Link>

                      <div className="flex flex-1 flex-col gap-3 p-4">
                        <div className="space-y-2">
                          <Link
                            href={getAnimeDetailHref(item.mal_id)}
                            className="line-clamp-2 text-sm font-semibold text-foreground transition-colors hover:text-primary"
                          >
                            {title}
                          </Link>
                          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                            <span className="inline-flex items-center gap-1">
                              <Users className="h-3 w-3" />
                              {wholeNumber.format(item.votes)} votes
                            </span>
                            {item.type ? <span>{item.type}</span> : null}
                            {item.year ? <span>{item.year}</span> : null}
                          </div>
                        </div>

                        <div className="mt-auto flex items-center gap-2">
                          <Button asChild size="xs">
                            <Link href={getAnimeDetailHref(item.mal_id)}>
                              View details
                            </Link>
                          </Button>
                          {item.url ? (
                            <Button asChild variant="ghost" size="xs">
                              <a href={item.url} target="_blank" rel="noopener noreferrer">
                                MAL
                              </a>
                            </Button>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
