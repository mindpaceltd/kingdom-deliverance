"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Menu, X, Search, Heart } from "lucide-react";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { SearchModal } from "@/components/search/search-modal";

const links = [
  { name: "Home", href: "/" },
  { name: "About", href: "/about" },
  { name: "Ministries", href: "/ministries" },
  { name: "Sermons", href: "/sermons" },
  { name: "Events", href: "/events" },
  { name: "Blog", href: "/blog" },
  { name: "Gallery", href: "/gallery" },
  { name: "Live", href: "/live" },
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
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      className={cn(
        "fixed top-0 z-50 w-full transition-all duration-700",
        scrolled
          ? "bg-[#0a121f]/90 backdrop-blur-2xl py-4 shadow-2xl border-b border-white/5"
          : "bg-transparent py-6"
      )}
    >
      <div className="container flex items-center justify-between px-4 max-w-7xl mx-auto">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-4 group shrink-0">
          <div className="relative w-12 h-12 rounded-2xl bg-[#eab308] flex items-center justify-center shadow-2xl shadow-[#eab308]/20 group-hover:scale-110 transition-all duration-500 overflow-hidden">
             <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <span className="text-[#0a121f] font-black text-2xl leading-none relative z-10">K</span>
          </div>
          <div className="flex flex-col leading-[1.1]">
            <span className="font-serif text-xl md:text-2xl font-bold text-white tracking-tight">
              KDC <span className="text-[#eab308]">Uganda</span>
            </span>
            <span className="text-[10px] text-white/40 font-black uppercase tracking-[0.3em]">
              Deliverance Centre
            </span>
          </div>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden xl:flex items-center gap-2 bg-white/5 backdrop-blur-md px-2 py-2 rounded-2xl border border-white/10">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "relative px-4 py-2 text-[10px] font-black uppercase tracking-[0.2em] rounded-xl transition-all duration-300",
                pathname === link.href
                  ? "text-[#eab308] bg-[#eab308]/10"
                  : "text-white/70 hover:text-white hover:bg-white/5"
              )}
            >
              {link.name}
              {pathname === link.href && (
                <motion.span
                  layoutId="nav-indicator"
                  className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-[#eab308] rounded-full"
                />
              )}
            </Link>
          ))}
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-4">
          <button
            className="text-white/70 p-3 rounded-2xl bg-white/5 border border-white/10 hover:bg-[#eab308] hover:text-[#0a121f] transition-all duration-500 group"
            onClick={() => setSearchOpen(true)}
            aria-label="Search"
          >
            <Search className="w-5 h-5 group-hover:scale-110 transition-transform" />
          </button>

          <Button
            asChild
            className="hidden sm:flex bg-[#eab308] hover:bg-white text-[#0a121f] font-black px-8 py-6 text-xs uppercase tracking-widest rounded-2xl shadow-xl shadow-[#eab308]/10 transition-all duration-500"
          >
            <Link href="/donations" className="flex items-center gap-2">
              <Heart className="w-4 h-4 fill-current" />
              Partner
            </Link>
          </Button>

          <button
            className="xl:hidden text-white p-3 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all duration-300"
            onClick={() => setIsOpen(!isOpen)}
            aria-label="Toggle menu"
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 z-[-1] bg-[#0a121f]/60 backdrop-blur-md xl:hidden"
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 z-50 h-full w-[300px] bg-[#0a121f] border-l border-white/5 xl:hidden shadow-2xl"
            >
              <div className="flex flex-col h-full p-8">
                <div className="flex items-center justify-between mb-12">
                   <span className="font-serif text-2xl font-bold text-white">Menu</span>
                   <button onClick={() => setIsOpen(false)} className="p-2 text-white/40 hover:text-white transition-colors">
                     <X className="w-6 h-6" />
                   </button>
                </div>
                
                <div className="space-y-4 flex-1">
                  {links.map((link, i) => (
                    <motion.div
                      key={link.href}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                    >
                      <Link
                        href={link.href}
                        onClick={() => setIsOpen(false)}
                        className={cn(
                          "block py-3 text-sm font-black uppercase tracking-[0.2em] transition-all duration-300",
                          pathname === link.href ? "text-[#eab308]" : "text-white/60 hover:text-white"
                        )}
                      >
                        {link.name}
                      </Link>
                    </motion.div>
                  ))}
                </div>

                <div className="pt-8 mt-8 border-t border-white/5 space-y-4">
                  <Button
                    asChild
                    className="w-full bg-[#eab308] hover:bg-white text-[#0a121f] font-black rounded-2xl py-8 transition-all duration-500"
                  >
                    <Link href="/donations" onClick={() => setIsOpen(false)}>
                      Give Online
                    </Link>
                  </Button>
                  <p className="text-[10px] text-center text-white/20 font-black uppercase tracking-[0.3em]">
                    Kingdom Deliverance Centre
                  </p>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Search modal */}
      <SearchModal open={searchOpen} onClose={() => setSearchOpen(false)} />
    </motion.nav>
  );
}
