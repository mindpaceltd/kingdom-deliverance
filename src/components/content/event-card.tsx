import Image from 'next/image'
import Link from 'next/link'
import { Calendar, MapPin } from 'lucide-react'
import { format } from 'date-fns'
import { StatusBadge } from '@/components/admin/status-badge'
import type { Event } from '@/lib/types'

interface EventCardProps {
  event: Event
}

export function EventCard({ event }: EventCardProps) {
  const formattedDate = format(new Date(event.date), 'EEE, MMM d, yyyy')

  return (
    <Link
      href={`/events/${event.slug}`}
      className="group block bg-white rounded-2xl overflow-hidden border border-gray-100 shadow hover:shadow-lg transition-all hover:-translate-y-1"
    >
      {/* Image */}
      <div className="relative aspect-video bg-gradient-to-br from-primary/10 to-accent/10 overflow-hidden">
        {event.image_url ? (
          <Image
            src={event.image_url}
            alt={event.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <Calendar className="w-12 h-12 text-primary/20" />
          </div>
        )}
        <div className="absolute top-3 left-3">
          <StatusBadge status={event.status} />
        </div>
      </div>

      {/* Content */}
      <div className="p-5 space-y-3">
        <h3 className="font-serif text-lg font-bold text-primary group-hover:text-accent transition-colors line-clamp-2">
          {event.title}
        </h3>
        <div className="flex flex-col gap-1.5 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-accent" />
            {formattedDate}
          </span>
          {event.location && (
            <span className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-accent" />
              {event.location}
            </span>
          )}
        </div>
      </div>
    </Link>
  )
}
