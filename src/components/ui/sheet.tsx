"use client"

import * as React from "react"
import { Dialog as SheetPrimitive } from "@base-ui/react/dialog"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { XIcon } from "lucide-react"

const Sheet = SheetPrimitive.Root

const SheetTrigger = React.forwardRef<
  HTMLButtonElement,
  SheetPrimitive.Trigger.Props & { asChild?: boolean }
>(({ asChild, children, ...props }, ref) => {
  if (asChild) {
    return (
      <SheetPrimitive.Trigger
        {...props}
        render={children as React.ReactElement}
        ref={ref}
      />
    )
  }
  return (
    <SheetPrimitive.Trigger {...props} ref={ref}>
      {children}
    </SheetPrimitive.Trigger>
  )
})
SheetTrigger.displayName = "SheetTrigger"

const SheetClose = React.forwardRef<
  HTMLButtonElement,
  SheetPrimitive.Close.Props & { asChild?: boolean }
>(({ asChild, children, ...props }, ref) => {
  if (asChild) {
    return (
      <SheetPrimitive.Close
        {...props}
        render={children as React.ReactElement}
        ref={ref}
      />
    )
  }
  return (
    <SheetPrimitive.Close {...props} ref={ref}>
      {children}
    </SheetPrimitive.Close>
  )
})
SheetClose.displayName = "SheetClose"

const SheetPortal = SheetPrimitive.Portal

const SheetOverlay = React.forwardRef<
  HTMLDivElement,
  SheetPrimitive.Backdrop.Props
>(({ className, ...props }, ref) => (
  <SheetPrimitive.Backdrop
    ref={ref}
    className={cn(
      "fixed inset-0 z-50 bg-black/60 backdrop-blur-sm transition-opacity duration-150 data-[state=closed]:opacity-0 data-[state=open]:opacity-100",
      className
    )}
    {...props}
  />
))
SheetOverlay.displayName = "SheetOverlay"

const SheetContent = React.forwardRef<
  HTMLDivElement,
  SheetPrimitive.Popup.Props & {
    side?: "top" | "right" | "bottom" | "left"
    showCloseButton?: boolean
  }
>(({ className, children, side = "right", showCloseButton = true, ...props }, ref) => (
  <SheetPortal>
    <SheetOverlay />
    <SheetPrimitive.Popup
      ref={ref}
      className={cn(
        "fixed z-50 flex flex-col gap-4 bg-[#0d1b3e] text-white shadow-xl transition duration-300 ease-in-out",
        side === "right" && "inset-y-0 right-0 h-full w-full sm:max-w-md border-l border-white/10",
        side === "left" && "inset-y-0 left-0 h-full w-full sm:max-w-md border-r border-white/10",
        side === "top" && "inset-x-0 top-0 h-auto w-full border-b border-white/10",
        side === "bottom" && "inset-x-0 bottom-0 h-auto w-full border-t border-white/10",
        className
      )}
      {...props}
    >
      {children}
      {showCloseButton && (
        <SheetClose asChild>
          <Button
            variant="ghost"
            className="absolute top-4 right-4 h-8 w-8 p-0 text-white/70 hover:text-white"
          >
            <XIcon className="h-5 w-5" />
            <span className="sr-only">Close</span>
          </Button>
        </SheetClose>
      )}
    </SheetPrimitive.Popup>
  </SheetPortal>
))
SheetContent.displayName = "SheetContent"

const SheetHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn("flex flex-col gap-1.5 p-6", className)}
    {...props}
  />
)
SheetHeader.displayName = "SheetHeader"

const SheetFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn("mt-auto flex flex-col gap-2 p-6", className)}
    {...props}
  />
)
SheetFooter.displayName = "SheetFooter"

const SheetTitle = React.forwardRef<
  HTMLHeadingElement,
  SheetPrimitive.Title.Props
>(({ className, ...props }, ref) => (
  <SheetPrimitive.Title
    ref={ref}
    className={cn("text-lg font-bold text-white", className)}
    {...props}
  />
))
SheetTitle.displayName = "SheetTitle"

const SheetDescription = React.forwardRef<
  HTMLParagraphElement,
  SheetPrimitive.Description.Props
>(({ className, ...props }, ref) => (
  <SheetPrimitive.Description
    ref={ref}
    className={cn("text-sm text-white/60", className)}
    {...props}
  />
))
SheetDescription.displayName = "SheetDescription"

export {
  Sheet,
  SheetTrigger,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetFooter,
  SheetTitle,
  SheetDescription,
}
