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
    <div className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-500 hover:-translate-y-2 flex flex-col border border-gray-100">
      {/* Thumbnail Container */}
      <Link href={`/sermons/${sermon.slug}`} className="block relative aspect-video bg-[#0a121f] overflow-hidden">
        {sermon.thumbnail_url ? (
          <Image
            src={sermon.thumbnail_url}
            alt={sermon.title}
            fill
            className="object-cover group-hover:scale-110 transition-transform duration-700 opacity-90 group-hover:opacity-100"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-[#0a121f] to-[#1a2b4b] flex items-center justify-center">
            <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center backdrop-blur-sm group-hover:bg-[#eab308] group-hover:text-[#0a121f] transition-all duration-300">
              <Play className="w-7 h-7 ml-1 fill-current" />
            </div>
          </div>
        )}
        
        {/* Play Icon Overlay (always visible on hover) */}
        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
          <div className="w-14 h-14 bg-[#eab308] text-[#0a121f] rounded-full flex items-center justify-center shadow-xl transform scale-0 group-hover:scale-100 transition-transform duration-500">
            <Play className="w-6 h-6 ml-1 fill-current" />
          </div>
        </div>

        {/* Series badge */}
        {sermon.series && (
          <div className="absolute top-4 left-4 bg-[#eab308] text-[#0a121f] text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded shadow-lg z-10">
            {sermon.series}
          </div>
        )}

        {/* Media indicators */}
        <div className="absolute bottom-4 right-4 flex gap-2 z-10">
          {sermon.video_url && (
            <div className="p-1.5 bg-black/50 backdrop-blur-md rounded-lg text-white" title="Video Available">
              <Play className="w-3.5 h-3.5" />
            </div>
          )}
          {sermon.audio_url && (
            <div className="p-1.5 bg-black/50 backdrop-blur-md rounded-lg text-white" title="Audio Available">
              <Headphones className="w-3.5 h-3.5" />
            </div>
          )}
        </div>
      </Link>

      {/* Content */}
      <div className="p-6 space-y-4 flex flex-col flex-1">
        <div className="space-y-2">
          <Link href={`/sermons/${sermon.slug}`}>
            <h3 className="text-lg font-bold text-[#0a121f] group-hover:text-[#eab308] transition-colors line-clamp-2 leading-tight">
              {sermon.title}
            </h3>
          </Link>
        </div>

        <div className="mt-auto pt-4 border-t border-gray-50 flex flex-wrap items-center justify-between gap-3 text-[11px] font-bold uppercase tracking-widest text-gray-400">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden">
              <User className="w-3 h-3 text-[#eab308]" />
            </div>
            <span>{sermon.preacher}</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {formattedDate}</span>
            {sermon.duration_minutes && (
              <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {sermon.duration_minutes}m</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
