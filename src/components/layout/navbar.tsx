"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import { useState } from "react";

const links = [
  { name: "Home", href: "/" },
  { name: "About Us", href: "/about" },
  { name: "Ministries", href: "/ministries" },
  { name: "Sermons", href: "/sermons" },
  { name: "Events", href: "/events" },
  { name: "Blog", href: "/blog" },
];

export function Navbar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-white/10 bg-primary/95 backdrop-blur supports-[backdrop-filter]:bg-primary/80">
      <div className="container flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center space-x-2">
          <span className="font-serif text-xl font-bold text-white tracking-wider">
            Kingdom Deliverance
          </span>
        </Link>
        <div className="hidden md:flex items-center space-x-6 text-sm font-medium">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "transition-colors hover:text-accent",
                pathname === link.href ? "text-accent" : "text-white/80"
              )}
            >
              {link.name}
            </Link>
          ))}
          <Button asChild variant="secondary" className="bg-accent text-primary font-semibold hover:bg-accent/90">
            <Link href="/donations">Donate</Link>
          </Button>
        </div>
        <button
          className="md:hidden text-white"
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? <X /> : <Menu />}
        </button>
      </div>
      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden border-t border-white/10 bg-primary px-4 py-6 space-y-4">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setIsOpen(false)}
              className={cn(
                "block text-lg transition-colors hover:text-accent",
                pathname === link.href ? "text-accent" : "text-white/80"
              )}
            >
              {link.name}
            </Link>
          ))}
          <Button asChild variant="secondary" className="w-full bg-accent text-primary font-semibold hover:bg-accent/90">
            <Link href="/donations" onClick={() => setIsOpen(false)}>Donate</Link>
          </Button>
        </div>
      )}
    </nav>
  );
}
