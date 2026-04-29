import { cn } from '@/lib/utils'

type Status =
  | 'draft'
  | 'published'
  | 'archived'
  | 'upcoming'
  | 'ongoing'
  | 'past'
  | 'cancelled'

interface StatusBadgeProps {
  status: Status | string
  className?: string
}

const statusConfig: Record<
  Status,
  { label: string; className: string }
> = {
  draft: {
    label: 'Draft',
    className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  },
  published: {
    label: 'Published',
    className: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  },
  archived: {
    label: 'Archived',
    className: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
  },
  upcoming: {
    label: 'Upcoming',
    className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  },
  ongoing: {
    label: 'Ongoing',
    className: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
  },
  past: {
    label: 'Past',
    className: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
  },
  cancelled: {
    label: 'Cancelled',
    className: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  },
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status as Status]

  if (!config) {
    // Fallback for unknown statuses
    return (
      <span
        className={cn(
          'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize',
          'bg-muted text-muted-foreground',
          className
        )}
      >
        {status}
      </span>
    )
  }

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
        config.className,
        className
      )}
    >
      {config.label}
    </span>
  )
}
