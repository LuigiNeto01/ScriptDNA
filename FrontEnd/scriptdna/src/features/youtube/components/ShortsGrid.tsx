import { ShortCard } from "./ShortCard";
import type { YouTubeShort } from "@/types/api";

export function ShortsGrid({ shorts }: { shorts: YouTubeShort[] }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {shorts.map((short) => (
        <ShortCard key={short.id} short={short} />
      ))}
    </div>
  );
}
