"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Menu, X, Search, ChevronDown } from "lucide-react";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { SearchModal } from "@/components/search/search-modal";
import { CartSheet } from "@/components/shop/cart-sheet";
import { CreditWallet } from "./credit-wallet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const navigation = [
  { name: "Home", href: "/" },
  { 
    name: "About Us", 
    children: [
      { name: "Our Story", href: "/about" },
      { name: "Gallery", href: "/gallery" },
      { name: "Contact Us", href: "/contact" },
    ]
  },
  { name: "Sermons", href: "/sermons" },
  { name: "Fire Service 🔥", href: "/fire-service" },
  { name: "Events", href: "/events" },
  { name: "Ministries", href: "/ministries" },
  { name: "Shop", href: "/shop" },
  { 
    name: "More", 
    children: [
      { name: "Live Broadcast", href: "/live" },
      { name: "Blog", href: "/blog" },
      { name: "Prayer Request", href: "/prayer" },
      { name: "Partner With Us", href: "/donations" },
    ]
  },
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
        (scrolled || pathname !== '/')
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
          {navigation.map((item) => (
            item.name === "Home" ? null :
            item.children ? (
              <DropdownMenu key={item.name}>
                <DropdownMenuTrigger className={cn(
                  "flex items-center gap-1 px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 outline-none",
                  item.children.some(child => pathname === child.href || (child.href !== "/" && pathname.startsWith(child.href)))
                    ? "text-accent bg-white/8"
                    : "text-white/85 hover:text-accent hover:bg-white/8"
                )}>
                  {item.name}
                  <ChevronDown className="w-3 h-3 opacity-50" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="bg-[#0d1b3e] border-white/10 text-white min-w-[180px] p-2 rounded-xl backdrop-blur-xl">
                  {item.children.map((child) => (
                    <DropdownMenuItem key={child.href} asChild className="focus:bg-white/10 focus:text-accent rounded-lg cursor-pointer">
                      <Link href={child.href} className="w-full px-3 py-2 text-sm">
                        {child.name}
                      </Link>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "relative px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 hover:text-accent hover:bg-white/8",
                  pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href)) ? "text-accent bg-white/8" : "text-white/85"
                )}
              >
                {item.name}
              </Link>
            )
          ))}
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-3">
          <button
            className="text-white p-2 rounded-lg hover:bg-white/10 transition-colors duration-200"
            onClick={() => setSearchOpen(true)}
            aria-label="Search"
          >
            <Search className="w-5 h-5" />
          </button>

          <CartSheet />

          <div className="hidden lg:block">
            <CreditWallet />
          </div>

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
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
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
            className="lg:hidden bg-[#0d1b3e]/98 backdrop-blur-xl border-t border-white/10 overflow-hidden"
          >
            <div className="container px-4 py-6 space-y-4">
              <div className="flex items-center justify-between px-4">
                <CreditWallet />
              </div>
              {navigation.map((item) => (
                <div key={item.name} className="space-y-2">
                  {item.children ? (
                    <>
                      <div className="px-4 text-[10px] font-bold text-accent uppercase tracking-widest opacity-50">
                        {item.name}
                      </div>
                      <div className="space-y-1">
                        {item.children.map((child) => (
                          <Link
                            key={child.href}
                            href={child.href}
                            onClick={() => setIsOpen(false)}
                            className={cn(
                              "block px-4 py-2 rounded-lg text-sm transition-all duration-200",
                              pathname === child.href || (child.href !== "/" && pathname.startsWith(child.href)) ? "text-accent bg-white/8" : "text-white/70 hover:text-white"
                            )}
                          >
                            {child.name}
                          </Link>
                        ))}
                      </div>
                    </>
                  ) : (
                    <Link
                      href={item.href}
                      onClick={() => setIsOpen(false)}
                      className={cn(
                        "block px-4 py-3 rounded-xl text-base font-medium transition-all duration-200",
                        pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href)) ? "text-accent bg-white/8" : "text-white/85"
                      )}
                    >
                      {item.name}
                    </Link>
                  )}
                </div>
              ))}
              <div className="pt-4">
                <Button asChild className="w-full bg-accent text-primary font-bold rounded-full py-6">
                  <Link href="/donations" onClick={() => setIsOpen(false)}>Donate</Link>
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <SearchModal open={searchOpen} onClose={() => setSearchOpen(false)} />
    </motion.nav>
  );
}
