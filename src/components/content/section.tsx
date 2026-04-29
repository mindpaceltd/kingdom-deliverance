import { cn } from '@/lib/utils'

interface PageSectionProps {
  children: React.ReactNode
  className?: string
  containerClassName?: string
}

export function PageSection({ children, className, containerClassName }: PageSectionProps) {
  return (
    <section className={cn('py-20', className)}>
      <div className={cn('container px-4', containerClassName)}>{children}</div>
    </section>
  )
}
