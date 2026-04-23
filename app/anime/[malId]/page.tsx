import type { Metadata } from "next";
import { notFound } from "next/navigation";
import AnimeDetailView from "@/components/AnimeDetailView";

type AnimeDetailPageProps = {
  params: Promise<{
    malId: string;
  }>;
};

export async function generateMetadata({
  params,
}: AnimeDetailPageProps): Promise<Metadata> {
  const { malId } = await params;

  return {
    title: `Anime ${malId}`,
  };
}

export default async function AnimeDetailPage({
  params,
}: AnimeDetailPageProps) {
  const { malId } = await params;
  const numericMalId = Number(malId);

  if (!Number.isInteger(numericMalId) || numericMalId <= 0) {
    notFound();
  }

  return <AnimeDetailView malId={numericMalId} />;
}
