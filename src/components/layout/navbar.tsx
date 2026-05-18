"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Menu, X, ChevronDown } from "lucide-react";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CartSheet } from "@/components/shop/cart-sheet";
import { UserNav } from "./user-nav";

const navigation = [
  { name: "Home", href: "/" },
  {
    name: "About Us",
    children: [
      { name: "Our Story", href: "/about" },
      { name: "Gallery", href: "/gallery" },
      { name: "Contact Us", href: "/contact" },
    ],
  },
  { name: "Sermons", href: "/sermons" },
  { name: "Fire Service 🔥", href: "/fire-service" },
  {
    name: "Connect",
    children: [
      { name: "Events", href: "/events" },
      { name: "Ministries", href: "/ministries" },
      { name: "Live Broadcast", href: "/live" },
      { name: "Prayer Request", href: "/prayer" },
    ],
  },
  { name: "Shop", href: "/shop" },
  {
    name: "More",
    children: [
      { name: "Blog", href: "/blog" },
      { name: "Partner With Us", href: "/donations" },
    ],
  },
];

export function Navbar({ logo }: { logo?: string }) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 30);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  return (
    <motion.nav
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className={cn(
        "fixed top-0 z-50 w-full transition-all duration-500",
        (scrolled || pathname !== "/")
          ? "bg-[#0d1b3e]/95 backdrop-blur-xl shadow-2xl border-b border-white/10"
          : "bg-transparent"
      )}
    >
      <div className="container flex h-18 items-center justify-between px-4 py-4">

        {/* ── Logo ── */}
        <Link href="/" className="flex items-center gap-2 group min-w-0 mr-4 shrink-0">
          <div className="relative w-9 h-9 rounded-full bg-gradient-to-br from-accent to-yellow-400 flex items-center justify-center shadow-lg shadow-accent/30 overflow-hidden shrink-0">
            {logo ? (
              <img src={logo} alt="Logo" className="w-full h-full object-cover" />
            ) : (
              <span className="text-primary font-bold text-base leading-none">K</span>
            )}
          </div>
          <div className="flex flex-col leading-tight min-w-0">
            <span className="font-serif text-sm sm:text-base md:text-lg font-bold text-white tracking-wide group-hover:text-accent transition-colors truncate">
              Kingdom Deliverance
            </span>
            <span className="text-[8px] sm:text-[10px] text-white/60 font-medium tracking-[0.2em] uppercase truncate">
              Centre Uganda
            </span>
          </div>
        </Link>

        {/* ── Desktop Nav ── */}
        <div className="hidden lg:flex items-center gap-0.5 flex-1 justify-center">
          {navigation.map((item) =>
            item.name === "Home" ? null : item.children ? (
              <div
                key={item.name}
                onMouseEnter={() => setActiveDropdown(item.name)}
                onMouseLeave={() => setActiveDropdown(null)}
                className="relative py-2"
              >
                <button
                  className={cn(
                    "flex items-center gap-1 px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 outline-none",
                    item.children.some(
                      (c) => pathname === c.href || (c.href !== "/" && pathname.startsWith(c.href))
                    )
                      ? "text-accent bg-white/8 font-semibold"
                      : "text-white/85 hover:text-accent hover:bg-white/8"
                  )}
                >
                  {item.name}
                  <ChevronDown
                    className={cn(
                      "w-3 h-3 opacity-50 transition-transform duration-200",
                      activeDropdown === item.name && "rotate-180"
                    )}
                  />
                </button>

                <AnimatePresence>
                  {activeDropdown === item.name && (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 8 }}
                      transition={{ duration: 0.15 }}
                      className="absolute left-0 top-full z-50 min-w-[185px] bg-[#0d1b3e]/95 backdrop-blur-xl border border-white/10 text-white p-2 rounded-xl shadow-2xl before:content-[''] before:absolute before:-top-3 before:left-0 before:right-0 before:h-3"
                    >
                      {item.children.map((child) => {
                        const active =
                          pathname === child.href ||
                          (child.href !== "/" && pathname.startsWith(child.href));
                        return (
                          <Link
                            key={child.href}
                            href={child.href}
                            onClick={() => setActiveDropdown(null)}
                            className={cn(
                              "block px-3 py-2 text-sm rounded-lg cursor-pointer transition-colors duration-150",
                              active
                                ? "text-accent bg-white/8 font-semibold"
                                : "text-white/85 hover:text-accent hover:bg-white/8"
                            )}
                          >
                            {child.name}
                          </Link>
                        );
                      })}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 hover:text-accent hover:bg-white/8",
                  pathname === item.href ||
                    (item.href !== "/" && pathname.startsWith(item.href))
                    ? "text-accent bg-white/8 font-semibold"
                    : "text-white/85"
                )}
              >
                {item.name}
              </Link>
            )
          )}
        </div>

        {/* ── Right Actions ── */}
        <div className="flex items-center gap-2 shrink-0">
          <CartSheet />

          {/* User account / login */}
          <div className="hidden lg:block">
            <UserNav />
          </div>

          {/* Donate */}
          <Button
            asChild
            size="sm"
            className="hidden lg:flex bg-accent hover:bg-accent/90 text-primary font-bold rounded-full px-5 shadow-md shadow-accent/25 hover:scale-105 transition-all duration-300"
          >
            <Link href="/donations">Donate</Link>
          </Button>

          {/* Mobile hamburger */}
          <button
            className="lg:hidden text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors shrink-0 flex items-center justify-center w-9 h-9"
            onClick={() => setIsOpen(!isOpen)}
            aria-label="Toggle menu"
          >
            <div className="relative w-6 h-6">
              <Menu className={cn("absolute inset-0 w-6 h-6 transition-all duration-300", isOpen ? "scale-0 rotate-90 opacity-0" : "scale-100 rotate-0 opacity-100")} />
              <X className={cn("absolute inset-0 w-6 h-6 transition-all duration-300", isOpen ? "scale-100 rotate-0 opacity-100" : "scale-0 -rotate-90 opacity-0")} />
            </div>
          </button>
        </div>
      </div>

      {/* ── Mobile Menu ── */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden bg-[#0d1b3e]/98 backdrop-blur-xl border-t border-white/10 overflow-y-auto max-h-[calc(100vh-4.5rem)]"
          >
            <div className="w-full px-4 py-5 space-y-1">

              {/* Account + Donate row */}
              <div className="flex items-center justify-between px-2 pb-4 mb-2 border-b border-white/10">
                <UserNav />
                <Button asChild size="sm" className="bg-accent text-primary font-bold rounded-full px-5">
                  <Link href="/donations" onClick={() => setIsOpen(false)}>Donate</Link>
                </Button>
              </div>

              {navigation.map((item) => (
                <div key={item.name}>
                  {item.children ? (
                    <div className="space-y-0.5">
                      <p className="px-4 pt-3 pb-1 text-[10px] font-bold text-accent/60 uppercase tracking-widest">
                        {item.name}
                      </p>
                      {item.children.map((child) => (
                        <Link
                          key={child.href}
                          href={child.href}
                          onClick={() => setIsOpen(false)}
                          className={cn(
                            "block px-4 py-2.5 rounded-xl text-sm transition-all duration-200",
                            pathname === child.href ||
                              (child.href !== "/" && pathname.startsWith(child.href))
                              ? "text-accent bg-white/8 font-semibold"
                              : "text-white/70 hover:text-white hover:bg-white/5"
                          )}
                        >
                          {child.name}
                        </Link>
                      ))}
                    </div>
                  ) : item.name !== "Home" ? (
                    <Link
                      href={item.href}
                      onClick={() => setIsOpen(false)}
                      className={cn(
                        "block px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
                        pathname === item.href ||
                          (item.href !== "/" && pathname.startsWith(item.href))
                          ? "text-accent bg-white/8 font-semibold"
                          : "text-white/85 hover:text-white hover:bg-white/5"
                      )}
                    >
                      {item.name}
                    </Link>
                  ) : null}
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
}
