import { Response } from "express";
import { AuthRequest } from "../middleware/auth";
import { getAnimeByMalId } from "../db/animeData";
import {
  getAnimeWatchlistEntry,
  updateAnimeWatchlistNote,
} from "../db/watchlist";
import {
  AnimeDetailNoteBody,
  AnimeMalIdParams,
} from "../validators/animeDetail";
import { getAnimeDetailSupplementalData } from "./animeDetailService";
import type { AnimeDetailResponse } from "../types/animeDetail";
import { animeStore } from "../store/animeStore";

const toDetailAnime = (
  anime: NonNullable<Awaited<ReturnType<typeof getAnimeByMalId>>>,
) => ({
  mal_id: anime.mal_id,
  url: anime.url,
  title: anime.title,
  title_english: anime.title_english,
  type: anime.type,
  episodes: anime.episodes,
  score: anime.score,
  scored_by: anime.scored_by,
  rank: anime.rank,
  status: anime.status,
  popularity: anime.popularity,
  members: anime.members,
  favorites: anime.favorites,
  synopsis: anime.synopsis,
  year: anime.year,
  season: anime.season,
  image: anime.image,
  genres: Object.keys(anime.genres ?? {}),
  themes: Object.keys(anime.themes ?? {}),
  demographics: Object.keys(anime.demographics ?? {}),
});

export const getAnimeDetailByMalId = async (
  req: AuthRequest & { params: AnimeMalIdParams },
  res: Response,
) => {
  const malId = req.params.malId;
  const anime = await getAnimeByMalId(malId);

  if (!anime) {
    res.status(404).json({ error: "Anime not found" });
    return;
  }

  const [supplemental, watchlistEntry, animeList] = await Promise.all([
    getAnimeDetailSupplementalData(malId),
    req.user ? getAnimeWatchlistEntry(String(malId), req.user.userId) : Promise.resolve(null),
    animeStore.getAnimeList(),
  ]);
  const animeMap = new Map(animeList.map((item) => [item.mal_id, item] as const));

  const response: AnimeDetailResponse = {
    anime: toDetailAnime(anime),
    relations: supplemental.relations.flatMap((group) =>
      group.entries.map((entry) => {
        const relatedAnime = animeMap.get(entry.mal_id);
        return {
          mal_id: entry.mal_id,
          relation: group.relation,
          title: relatedAnime?.title || entry.name,
          title_english: relatedAnime?.title_english,
          image: relatedAnime?.image,
          type: relatedAnime?.type || entry.type,
          status: relatedAnime?.status,
          episodes: relatedAnime?.episodes,
          year: relatedAnime?.year,
          url: relatedAnime?.url || entry.url,
        };
      }),
    ),
    recommendations: supplemental.recommendations.map((recommendation) => {
      const recommendedAnime = animeMap.get(recommendation.entry.mal_id);
      return {
        mal_id: recommendation.entry.mal_id,
        title: recommendedAnime?.title || recommendation.entry.title,
        title_english: recommendedAnime?.title_english,
        image: recommendedAnime?.image || recommendation.entry.image,
        type: recommendedAnime?.type,
        status: recommendedAnime?.status,
        episodes: recommendedAnime?.episodes,
        year: recommendedAnime?.year,
        url: recommendedAnime?.url || recommendation.entry.url,
        votes: recommendation.votes ?? 0,
      };
    }),
    watchlistEntry: watchlistEntry
      ? {
          status: watchlistEntry.status,
          note: watchlistEntry.note || null,
        }
      : null,
  };

  res.json(response);
};

export const updateAnimeWatchlistNoteHandler = async (
  req: AuthRequest & { params: AnimeMalIdParams; body: AnimeDetailNoteBody },
  res: Response,
) => {
  const userId = req.user!.userId;
  const malId = String(req.params.malId);
  const normalizedNote = req.body.note.trim();
  const updated = await updateAnimeWatchlistNote(
    malId,
    normalizedNote.length > 0 ? normalizedNote : null,
    userId,
  );

  if (!updated) {
    res.status(404).json({ error: "Anime is not in the watchlist" });
    return;
  }

  res.json({ success: true, message: "Watchlist note updated" });
};
