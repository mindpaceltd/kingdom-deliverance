"use client"

import * as React from "react"
import { Dialog as SheetPrimitive } from "@base-ui/react/dialog"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { XIcon } from "lucide-react"

function Sheet(props: SheetPrimitive.Root.Props) {
  return <SheetPrimitive.Root {...props} />
}

function SheetTrigger({ asChild, children, ...props }: SheetPrimitive.Trigger.Props & { asChild?: boolean }) {
  if (asChild) {
    return (
      <SheetPrimitive.Trigger
        {...props}
        render={children as React.ReactElement}
      />
    )
  }
  return <SheetPrimitive.Trigger {...props}>{children}</SheetPrimitive.Trigger>
}

function SheetClose({ asChild, children, ...props }: SheetPrimitive.Close.Props & { asChild?: boolean }) {
  if (asChild) {
    return (
      <SheetPrimitive.Close
        {...props}
        render={children as React.ReactElement}
      />
    )
  }
  return <SheetPrimitive.Close {...props}>{children}</SheetPrimitive.Close>
}

function SheetPortal(props: SheetPrimitive.Portal.Props) {
  return <SheetPrimitive.Portal {...props} />
}

function SheetOverlay({ className, ...props }: SheetPrimitive.Backdrop.Props) {
  return (
    <SheetPrimitive.Backdrop
      className={cn(
        "fixed inset-0 z-50 bg-black/60 backdrop-blur-sm transition-opacity duration-150 data-[state=closed]:opacity-0 data-[state=open]:opacity-100",
        className
      )}
      {...props}
    />
  )
}

function SheetContent({
  className,
  children,
  side = "right",
  showCloseButton = true,
  ...props
}: SheetPrimitive.Popup.Props & {
  side?: "top" | "right" | "bottom" | "left"
  showCloseButton?: boolean
}) {
  return (
    <SheetPortal>
      <SheetOverlay />
      <SheetPrimitive.Popup
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
          <SheetPrimitive.Close asChild>
            <Button
              variant="ghost"
              className="absolute top-4 right-4 h-8 w-8 p-0 text-white/70 hover:text-white"
            >
              <XIcon className="h-5 w-5" />
              <span className="sr-only">Close</span>
            </Button>
          </SheetPrimitive.Close>
        )}
      </SheetPrimitive.Popup>
    </SheetPortal>
  )
}

function SheetHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn("flex flex-col gap-1.5 p-6", className)}
      {...props}
    />
  )
}

function SheetFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn("mt-auto flex flex-col gap-2 p-6", className)}
      {...props}
    />
  )
}

function SheetTitle({ className, ...props }: SheetPrimitive.Title.Props) {
  return (
    <SheetPrimitive.Title
      className={cn(
        "text-lg font-bold text-white",
        className
      )}
      {...props}
    />
  )
}

function SheetDescription({
  className,
  ...props
}: SheetPrimitive.Description.Props) {
  return (
    <SheetPrimitive.Description
      className={cn("text-sm text-white/60", className)}
      {...props}
    />
  )
}

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
