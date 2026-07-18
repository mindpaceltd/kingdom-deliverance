import { cn } from '@/lib/utils'

export function DmPageHeader({
  title,
  description,
  actions,
}: {
  title: string
  description?: string
  actions?: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          AI Digital Ministry
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          {title}
        </h1>
        {description ? (
          <p className="mt-1.5 max-w-2xl text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </div>
  )
}

export function DmCard({
  className,
  children,
}: {
  className?: string
  children: React.ReactNode
}) {
  return (
    <div
      className={cn(
        'rounded-2xl border border-border/60 bg-card/80 shadow-sm backdrop-blur-sm',
        className
      )}
    >
      {children}
    </div>
  )
}

export function DmKpiCard({
  label,
  value,
  hint,
  accent,
}: {
  label: string
  value: string | number
  hint?: string
  accent?: string
}) {
  return (
    <DmCard className="p-4 sm:p-5">
      <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p className={cn('mt-2 text-2xl font-semibold tabular-nums tracking-tight sm:text-3xl', accent)}>
        {value}
      </p>
      {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
    </DmCard>
  )
}

export function DmModulePlaceholder({
  title,
  description,
  bullets,
  links,
}: {
  title: string
  description: string
  bullets?: string[]
  links?: { href: string; label: string }[]
}) {
  return (
    <div className="space-y-6">
      <DmPageHeader title={title} description={description} />
      <DmCard className="p-6 sm:p-8">
        <p className="text-sm text-muted-foreground">
          This module is scaffolded and ready for API wiring. Core schema, navigation, and
          permissions are live. Features below ship in phased releases without breaking the
          existing KDC site.
        </p>
        {bullets && bullets.length > 0 ? (
          <ul className="mt-4 space-y-2 text-sm text-foreground/90">
            {bullets.map((b) => (
              <li key={b} className="flex gap-2">
                <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-accent" />
                <span>{b}</span>
              </li>
            ))}
          </ul>
        ) : null}
        {links && links.length > 0 ? (
          <div className="mt-6 flex flex-wrap gap-2">
            {links.map((l) => (
              <a
                key={l.href}
                href={l.href}
                className="inline-flex h-9 items-center rounded-lg border border-border bg-background px-3 text-sm font-medium hover:bg-muted"
              >
                {l.label}
              </a>
            ))}
          </div>
        ) : null}
      </DmCard>
    </div>
  )
}

export function DmComingSoonBadge({ children = 'Phase roadmap' }: { children?: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full border border-border bg-muted/50 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
      {children}
    </span>
  )
}
