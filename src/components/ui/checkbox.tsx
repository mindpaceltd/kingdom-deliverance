'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

export interface CheckboxProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  /** Indeterminate state (e.g. "select all" when only some rows are selected) */
  indeterminate?: boolean
}

/**
 * A simple accessible checkbox built on a native <input type="checkbox">.
 * Styled to match the shadcn/ui design system.
 */
const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, indeterminate, ...props }, ref) => {
    const innerRef = React.useRef<HTMLInputElement>(null)

    // Merge forwarded ref with inner ref
    React.useImperativeHandle(ref, () => innerRef.current as HTMLInputElement)

    // Apply indeterminate state imperatively (not a standard HTML attribute)
    React.useEffect(() => {
      if (innerRef.current) {
        innerRef.current.indeterminate = indeterminate ?? false
      }
    }, [indeterminate])

    return (
      <input
        type="checkbox"
        ref={innerRef}
        className={cn(
          'h-4 w-4 shrink-0 cursor-pointer rounded-sm border border-input',
          'accent-primary focus-visible:outline-none focus-visible:ring-2',
          'focus-visible:ring-ring focus-visible:ring-offset-2',
          'disabled:cursor-not-allowed disabled:opacity-50',
          className
        )}
        {...props}
      />
    )
  }
)
Checkbox.displayName = 'Checkbox'

export { Checkbox }
