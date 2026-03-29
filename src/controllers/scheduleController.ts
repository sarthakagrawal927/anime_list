import { Response } from "express";
import { AuthRequest } from "../middleware/auth";
import {
  getSchedule,
  upsertScheduleItems,
  updateScheduleItem as dbUpdateScheduleItem,
  removeScheduleItems,
  reorderSchedule as dbReorderSchedule,
} from "../db/schedule";
import { getAnimeWatchlist } from "../db/watchlist";
import { animeStore } from "../store/animeStore";
import type { ScheduleRow } from "../db/schedule";

interface EnrichedScheduleItem {
  mal_id: string;
  episodes_per_day: number;
  sort_order: number;
  title: string;
  image?: string;
  episodes?: number;
  type?: string;
  score?: number;
  url?: string;
  watchStatus: string;
}

interface TimelineEntry {
  mal_id: string;
  title: string;
  image?: string;
  episodes_today: number;
  episode_range: [number, number];
  is_final_day: boolean;
}

interface TimelineDay {
  day: number;
  date: string;
  entries: TimelineEntry[];
}

export function computeTimeline(
  items: EnrichedScheduleItem[],
  startDate: Date = new Date(),
): { timeline: TimelineDay[]; stats: { total_episodes: number; total_days: number; start_date: string; finish_date: string } } {
  const timeline: TimelineDay[] = [];
  let currentDay = 0;
  let totalEpisodes = 0;

  for (const item of items) {
    const totalEps = item.episodes ?? 0;
    if (totalEps === 0) continue;
    totalEpisodes += totalEps;
    const epd = item.episodes_per_day;
    const days = Math.ceil(totalEps / epd);

    for (let d = 0; d < days; d++) {
      const episodesThisDay = Math.min(epd, totalEps - d * epd);
      const startEp = d * epd + 1;
      const endEp = startEp + episodesThisDay - 1;
      const date = new Date(startDate);
      date.setDate(date.getDate() + currentDay);

      let dayEntry = timeline.find((t) => t.day === currentDay);
      if (!dayEntry) {
        dayEntry = {
          day: currentDay,
          date: date.toISOString().split("T")[0],
          entries: [],
        };
        timeline.push(dayEntry);
      }

      dayEntry.entries.push({
        mal_id: item.mal_id,
        title: item.title,
        image: item.image,
        episodes_today: episodesThisDay,
        episode_range: [startEp, endEp],
        is_final_day: d === days - 1,
      });

      currentDay++;
    }
  }

  const startDateStr = startDate.toISOString().split("T")[0];
  const finishDate = new Date(startDate);
  finishDate.setDate(finishDate.getDate() + Math.max(0, currentDay - 1));

  return {
    timeline,
    stats: {
      total_episodes: totalEpisodes,
      total_days: currentDay,
      start_date: startDateStr,
      finish_date: finishDate.toISOString().split("T")[0],
    },
  };
}

async function enrichScheduleItems(
  userId: string,
  scheduleRows: ScheduleRow[],
): Promise<EnrichedScheduleItem[]> {
  const watchlist = await getAnimeWatchlist(userId);
  const allAnime = await animeStore.getAnimeList();
  const animeMap = new Map(allAnime.map((a) => [a.mal_id.toString(), a]));

  return scheduleRows.map((row) => {
    const anime = animeMap.get(row.mal_id);
    const watched = watchlist?.anime[row.mal_id];
    return {
      mal_id: row.mal_id,
      episodes_per_day: row.episodes_per_day,
      sort_order: row.sort_order,
      title: anime?.title_english || anime?.title || (watched?.title as string | undefined) || `ID: ${row.mal_id}`,
      image: anime?.image,
      episodes: anime?.episodes,
      type: anime?.type,
      score: anime?.score,
      url: anime?.url,
      watchStatus: watched?.status || "",
    };
  });
}

export const getScheduleTimeline = async (req: AuthRequest, res: Response) => {
  const userId = req.user!.userId;
  const scheduleRows = await getSchedule(userId);
  const items = await enrichScheduleItems(userId, scheduleRows);
  const { timeline, stats } = computeTimeline(items);
  res.json({ items, timeline, stats });
};

export const addToScheduleHandler = async (req: AuthRequest, res: Response) => {
  const userId = req.user!.userId;
  const { mal_ids, episodes_per_day } = req.body;
  await upsertScheduleItems(
    userId,
    mal_ids.map((id: string) => ({ malId: id, episodesPerDay: episodes_per_day })),
  );
  res.json({ success: true, message: "Added to schedule" });
};

export const updateScheduleEntry = async (req: AuthRequest, res: Response) => {
  const userId = req.user!.userId;
  const malId = req.params.malId;
  await dbUpdateScheduleItem(userId, malId, {
    episodesPerDay: req.body.episodes_per_day,
  });
  res.json({ success: true, message: "Schedule item updated" });
};

export const removeFromScheduleHandler = async (req: AuthRequest, res: Response) => {
  const userId = req.user!.userId;
  await removeScheduleItems(userId, req.body.mal_ids);
  res.json({ success: true, message: "Removed from schedule" });
};

export const reorderScheduleHandler = async (req: AuthRequest, res: Response) => {
  const userId = req.user!.userId;
  await dbReorderSchedule(userId, req.body.mal_ids);
  res.json({ success: true, message: "Schedule reordered" });
};
