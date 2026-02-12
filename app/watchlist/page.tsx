import type { Metadata } from "next";
import WatchlistView from "@/components/WatchlistView";

export const metadata: Metadata = {
  title: "Watchlist",
};

export default function WatchlistPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Watchlist</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage your anime watchlist by status
        </p>
      </div>
      <WatchlistView />
    </div>
  );
}
