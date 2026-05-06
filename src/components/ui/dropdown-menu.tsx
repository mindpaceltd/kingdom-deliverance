"use client"

import * as React from "react"
import { Menu as MenuPrimitive } from "@base-ui/react/menu"
import { cn } from "@/lib/utils"
import { ChevronRightIcon, CheckIcon } from "lucide-react"

const DropdownMenu = MenuPrimitive.Root

const DropdownMenuPortal = MenuPrimitive.Portal

const DropdownMenuTrigger = React.forwardRef<
  HTMLButtonElement,
  MenuPrimitive.Trigger.Props & { asChild?: boolean }
>(({ asChild, children, ...props }, ref) => {
  if (asChild) {
    return (
      <MenuPrimitive.Trigger
        {...props}
        render={children as React.ReactElement}
        ref={ref}
      />
    )
  }
  return (
    <MenuPrimitive.Trigger {...props} ref={ref}>
      {children}
    </MenuPrimitive.Trigger>
  )
})
DropdownMenuTrigger.displayName = "DropdownMenuTrigger"

const DropdownMenuContent = React.forwardRef<
  HTMLDivElement,
  MenuPrimitive.Popup.Props & {
    align?: "start" | "center" | "end"
    alignOffset?: number
    side?: "top" | "right" | "bottom" | "left"
    sideOffset?: number
  }
>(({ align = "start", alignOffset = 0, side = "bottom", sideOffset = 4, className, ...props }, ref) => {
  return (
    <MenuPrimitive.Portal>
      <MenuPrimitive.Positioner
        align={align}
        alignOffset={alignOffset}
        side={side}
        sideOffset={sideOffset}
      >
        <MenuPrimitive.Popup
          ref={ref}
          data-slot="dropdown-menu-content"
          className={cn(
            "z-50 min-w-32 overflow-hidden rounded-lg bg-[#0d1b3e] p-1 text-white shadow-xl ring-1 ring-white/10 duration-100 outline-none data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95",
            className
          )}
          {...props}
        />
      </MenuPrimitive.Positioner>
    </MenuPrimitive.Portal>
  )
})
DropdownMenuContent.displayName = "DropdownMenuContent"

const DropdownMenuGroup = MenuPrimitive.Group

const DropdownMenuLabel = React.forwardRef<
  HTMLDivElement,
  MenuPrimitive.GroupLabel.Props
>(({ className, ...props }, ref) => (
  <MenuPrimitive.GroupLabel
    ref={ref}
    className={cn("px-2 py-1.5 text-xs font-bold text-white/50 uppercase tracking-wider", className)}
    {...props}
  />
))
DropdownMenuLabel.displayName = "DropdownMenuLabel"

const DropdownMenuItem = React.forwardRef<
  HTMLDivElement,
  MenuPrimitive.Item.Props & { variant?: "default" | "destructive" }
>(({ className, variant = "default", ...props }, ref) => (
  <MenuPrimitive.Item
    ref={ref}
    className={cn(
      "relative flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm outline-none select-none focus:bg-white/10 data-disabled:pointer-events-none data-disabled:opacity-50",
      variant === "destructive" && "text-red-500 focus:bg-red-500/10",
      className
    )}
    {...props}
  />
))
DropdownMenuItem.displayName = "DropdownMenuItem"

const DropdownMenuSub = MenuPrimitive.SubmenuRoot

const DropdownMenuSubTrigger = React.forwardRef<
  HTMLDivElement,
  MenuPrimitive.SubmenuTrigger.Props
>(({ className, children, ...props }, ref) => (
  <MenuPrimitive.SubmenuTrigger
    ref={ref}
    className={cn(
      "flex cursor-default items-center gap-2 rounded-md px-2 py-1.5 text-sm outline-none select-none focus:bg-white/10",
      className
    )}
    {...props}
  >
    {children}
    <ChevronRightIcon className="ml-auto h-4 w-4" />
  </MenuPrimitive.SubmenuTrigger>
))
DropdownMenuSubTrigger.displayName = "DropdownMenuSubTrigger"

const DropdownMenuSubContent = React.forwardRef<
  HTMLDivElement,
  MenuPrimitive.Popup.Props
>((props, ref) => (
  <DropdownMenuContent
    ref={ref}
    className={cn("min-w-[8rem]")}
    {...props}
  />
))
DropdownMenuSubContent.displayName = "DropdownMenuSubContent"

const DropdownMenuSeparator = React.forwardRef<
  HTMLDivElement,
  MenuPrimitive.Separator.Props
>(({ className, ...props }, ref) => (
  <MenuPrimitive.Separator
    ref={ref}
    className={cn("-mx-1 my-1 h-px bg-white/10", className)}
    {...props}
  />
))
DropdownMenuSeparator.displayName = "DropdownMenuSeparator"

export {
  DropdownMenu,
  DropdownMenuPortal,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
}
