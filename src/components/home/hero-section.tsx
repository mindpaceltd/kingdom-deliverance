"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Play, ArrowRight, Sparkles, Heart, Clock } from "lucide-react";
import Link from "next/link";

export function HeroSection() {
  return (
    <section className="relative flex min-h-screen items-center justify-center overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 z-0">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage:
              "url('https://images.unsplash.com/photo-1438232992991-995b7058bbb3?q=80&w=2073&auto=format&fit=crop')",
          }}
        />
        {/* Dark overlay for readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#0d1b3e]/90 via-[#0d1b3e]/80 to-[#0d1b3e]/95" />

        {/* Subtle floating orbs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-accent/10 rounded-full blur-3xl float-animation" style={{ animationDelay: "0s" }} />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl float-animation" style={{ animationDelay: "3s" }} />
      </div>

      {/* Content */}
      <div className="container relative z-10 px-4 py-32 text-center text-white">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, ease: "easeOut" }}
          className="mx-auto max-w-4xl space-y-8"
        >
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 backdrop-blur-md px-5 py-2.5 text-xs font-semibold uppercase tracking-[0.2em] text-white/90"
          >
            <Sparkles className="w-3.5 h-3.5 text-accent" />
            Welcome to Kingdom Deliverance Centre Uganda
            <Heart className="w-3.5 h-3.5 text-accent" />
          </motion.div>

          {/* Heading */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.35 }}
            className="font-serif text-5xl font-bold leading-[1.1] tracking-tight md:text-6xl lg:text-7xl drop-shadow-sm"
          >
            <span className="text-accent">Encounter God,</span>{" "}
            <br className="hidden sm:block" />
            <span className="bg-gradient-to-r from-accent via-yellow-300 to-accent bg-clip-text text-transparent">
              Experience Deliverance.
            </span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="mx-auto max-w-2xl text-base leading-relaxed text-white/80 md:text-lg lg:text-xl"
          >
            Join us this Sunday as we worship together, grow in faith, and experience the{" "}
            <span className="font-semibold text-accent">transformative power</span>{" "}
            of the Holy Spirit in our lives.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.65 }}
            className="flex flex-col items-center justify-center gap-4 sm:flex-row"
          >
            <Button
              asChild
              size="lg"
              className="group w-full sm:w-auto bg-accent hover:bg-accent/90 text-primary font-bold px-8 py-6 text-base rounded-full shadow-lg shadow-accent/30 hover:shadow-accent/50 hover:scale-105 transition-all duration-300"
            >
              <Link href="/about" className="flex items-center gap-2">
                Plan a Visit
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
              </Link>
            </Button>

            <Button
              asChild
              size="lg"
              variant="outline"
              className="group w-full sm:w-auto border-white/30 bg-white/10 backdrop-blur-md text-white hover:bg-white/20 hover:border-white/50 hover:scale-105 px-8 py-6 text-base rounded-full transition-all duration-300"
            >
              <Link href="/live" className="flex items-center gap-2">
                <Play className="w-4 h-4 fill-current" />
                Watch Live
              </Link>
            </Button>
          </motion.div>

          {/* Service Times */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.8 }}
            className="mx-auto max-w-2xl"
          >
            <div className="rounded-2xl border border-white/15 bg-white/8 backdrop-blur-md p-6">
              <div className="flex items-center justify-center gap-2 mb-5">
                <Clock className="w-4 h-4 text-accent" />
                <span className="text-sm font-semibold uppercase tracking-widest text-accent">
                  Join Us This Week
                </span>
              </div>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div className="text-center space-y-1">
                  <div className="font-semibold text-white">Sunday Service</div>
                  <div className="text-white/60 text-[10px]">10:00 AM (EAT)</div>
                </div>
                <div className="relative text-center space-y-1">
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-px h-8 bg-white/15" />
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 w-px h-8 bg-white/15" />
                  <div className="font-semibold text-white">Bible Study</div>
                  <div className="text-white/60 text-[10px]">Wed 6:00 PM (EAT)</div>
                </div>
                <div className="text-center space-y-1">
                  <div className="font-semibold text-white">Prayer Meeting</div>
                  <div className="text-white/60 text-[10px]">Fri 6:00 PM (EAT)</div>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 1.2 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
      >
        <div className="flex flex-col items-center gap-1">
          <span className="text-white/40 text-xs tracking-widest uppercase">Scroll</span>
          <div className="w-5 h-8 border border-white/25 rounded-full flex justify-center pt-1.5">
            <div className="w-0.5 h-2 bg-accent rounded-full animate-bounce" />
          </div>
        </div>
      </motion.div>
    </section>
  );
}
