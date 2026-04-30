import Image from "next/image";
import Link from "next/link";
import { Play, Headphones, User, Calendar, Clock } from "lucide-react";
import { format } from "date-fns";
import type { Sermon } from "@/lib/types";

interface SermonCardProps {
  sermon: Sermon;
}

export function SermonCard({ sermon }: SermonCardProps) {
  const formattedDate = (() => {
    try {
      return format(new Date(sermon.date), "MMM d, yyyy");
    } catch {
      return sermon.date;
    }
  })();

  return (
    <div className="group bg-white rounded-2xl overflow-hidden shadow hover:shadow-lg transition-all hover:-translate-y-1 flex flex-col">
      {/* Thumbnail */}
      <Link href={`/sermons/${sermon.slug}`} className="block relative aspect-video bg-gradient-to-br from-primary/20 to-primary/40 overflow-hidden">
        {sermon.thumbnail_url ? (
          <Image
            src={sermon.thumbnail_url}
            alt={sermon.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center group-hover:bg-accent transition-colors">
              <Play className="w-6 h-6 text-white ml-0.5" fill="currentColor" />
            </div>
          </div>
        )}
        {/* Series badge */}
        {sermon.series && (
          <span className="absolute top-3 left-3 text-xs bg-accent text-primary font-semibold px-2 py-0.5 rounded-full z-10">
            {sermon.series}
          </span>
        )}
        {/* Media availability overlay */}
        <div className="absolute bottom-3 right-3 flex gap-1.5 z-10">
          {sermon.video_url && (
            <span className="flex items-center gap-1 text-xs bg-black/60 text-white font-medium px-2 py-0.5 rounded-full backdrop-blur-sm">
              <Play className="w-3 h-3" /> Video
            </span>
          )}
          {sermon.audio_url && (
            <span className="flex items-center gap-1 text-xs bg-black/60 text-white font-medium px-2 py-0.5 rounded-full backdrop-blur-sm">
              <Headphones className="w-3 h-3" /> Audio
            </span>
          )}
        </div>
      </Link>

      {/* Content */}
      <div className="p-5 space-y-3 flex flex-col flex-1">
        <Link href={`/sermons/${sermon.slug}`}>
          <h3 className="font-serif text-lg font-bold text-primary group-hover:text-accent transition-colors line-clamp-2 leading-snug">
            {sermon.title}
          </h3>
        </Link>

        <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <User className="w-3 h-3 text-accent" />
            {sermon.preacher}
          </span>
          <span className="flex items-center gap-1">
            <Calendar className="w-3 h-3 text-accent" />
            {formattedDate}
          </span>
          {sermon.duration_minutes && (
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3 text-accent" />
              {sermon.duration_minutes} min
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
