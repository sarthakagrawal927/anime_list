import WatchlistView from "@/components/WatchlistView";

export default function WatchlistPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-100">Watchlist</h1>
        <p className="text-sm text-gray-400 mt-1">
          Manage your anime watchlist by status
        </p>
      </div>
      <WatchlistView />
    </div>
  );
}
