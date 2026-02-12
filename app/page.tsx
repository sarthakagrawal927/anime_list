import FilterBuilder from "@/components/FilterBuilder";

export default function SearchPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Discover Anime</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Build filters to find anime matching your criteria
        </p>
      </div>
      <FilterBuilder />
    </div>
  );
}
