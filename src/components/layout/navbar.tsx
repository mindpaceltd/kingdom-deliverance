"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Menu, X, Search } from "lucide-react";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { SearchModal } from "@/components/search/search-modal";

const links = [
  { name: "Home", href: "/" },
  { name: "About Us", href: "/about" },
  { name: "Ministries", href: "/ministries" },
  { name: "Sermons", href: "/sermons" },
  { name: "Events", href: "/events" },
  { name: "Blog", href: "/blog" },
  { name: "Gallery", href: "/gallery" },
  { name: "Live", href: "/live" },
  { name: "Prayer", href: "/prayer" },
  { name: "Contact", href: "/contact" },
];

export function Navbar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 30);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <motion.nav
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className={cn(
        "fixed top-0 z-50 w-full transition-all duration-500",
        scrolled
          ? "bg-[#0d1b3e]/95 backdrop-blur-xl shadow-2xl border-b border-white/10"
          : "bg-transparent"
      )}
    >
      <div className="container flex h-18 items-center justify-between px-4 py-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 group shrink-0">
          <div className="relative w-10 h-10 rounded-full bg-gradient-to-br from-accent to-yellow-400 flex items-center justify-center shadow-lg shadow-accent/30 group-hover:shadow-accent/50 transition-all duration-300">
            <span className="text-primary font-bold text-lg leading-none">K</span>
          </div>
          <div className="flex flex-col leading-tight">
            <span className="font-serif text-lg font-bold text-white tracking-wide group-hover:text-accent transition-colors duration-300 md:text-xl">
              Kingdom Deliverance
            </span>
            <span className="text-[10px] text-white/60 font-medium tracking-[0.2em] uppercase">
              Centre Uganda
            </span>
          </div>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden lg:flex items-center gap-1">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "relative px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 hover:text-accent hover:bg-white/8",
                (pathname === link.href || (link.href !== '/' && pathname.startsWith(link.href)))
                  ? "text-accent bg-white/8"
                  : "text-white/85"
              )}
            >
              {link.name}
              {pathname === link.href && (
                <motion.span
                  layoutId="nav-indicator"
                  className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-0.5 bg-accent rounded-full"
                />
              )}
            </Link>
          ))}
        </div>

        {/* Donate Button + Search + Mobile Toggle */}
        <div className="flex items-center gap-3">
          {/* Search button */}
          <button
            className="text-white p-2 rounded-lg hover:bg-white/10 transition-colors duration-200"
            onClick={() => setSearchOpen(true)}
            aria-label="Search"
          >
            <Search className="w-5 h-5" />
          </button>

          <Button
            asChild
            className="hidden lg:flex bg-accent hover:bg-accent/90 text-primary font-bold rounded-full px-6 shadow-md shadow-accent/25 hover:shadow-accent/40 hover:scale-105 transition-all duration-300"
          >
            <Link href="/donations">Donate</Link>
          </Button>

          <button
            className="lg:hidden text-white p-2 rounded-lg hover:bg-white/10 transition-colors duration-200"
            onClick={() => setIsOpen(!isOpen)}
            aria-label="Toggle menu"
          >
            <AnimatePresence mode="wait">
              {isOpen ? (
                <motion.div key="close" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.15 }}>
                  <X className="w-6 h-6" />
                </motion.div>
              ) : (
                <motion.div key="menu" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.15 }}>
                  <Menu className="w-6 h-6" />
                </motion.div>
              )}
            </AnimatePresence>
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="lg:hidden bg-[#0d1b3e]/98 backdrop-blur-xl border-t border-white/10 overflow-hidden"
          >
            <div className="container px-4 py-6 space-y-1">
              {links.map((link, i) => (
                <motion.div
                  key={link.href}
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.2, delay: i * 0.04 }}
                >
                  <Link
                    href={link.href}
                    onClick={() => setIsOpen(false)}
                    className={cn(
                      "block px-4 py-3 rounded-xl text-base font-medium transition-all duration-200 hover:text-accent hover:bg-white/8",
                      (pathname === link.href || (link.href !== '/' && pathname.startsWith(link.href)))
                        ? "text-accent bg-white/8"
                        : "text-white/85"
                    )}
                  >
                    {link.name}
                  </Link>
                </motion.div>
              ))}
              <div className="pt-4">
                <Button
                  asChild
                  className="w-full bg-accent hover:bg-accent/90 text-primary font-bold rounded-full py-6 transition-all duration-300"
                >
                  <Link href="/donations" onClick={() => setIsOpen(false)}>
                    Donate
                  </Link>
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Search modal */}
      <SearchModal open={searchOpen} onClose={() => setSearchOpen(false)} />
    </motion.nav>
  );
}
