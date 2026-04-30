"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Play, ArrowRight, Sparkles, Heart, Clock, ChevronRight } from "lucide-react";
import Link from "next/link";

export function HeroSection() {
  return (
    <section className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#0a121f]">
      {/* Background with subtle patterns */}
      <div className="absolute inset-0 z-0">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-40 mix-blend-overlay"
          style={{
            backgroundImage:
              "url('https://images.unsplash.com/photo-1438232992991-995b7058bbb3?q=80&w=2073&auto=format&fit=crop')",
          }}
        />
        {/* Deep navy gradients */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#0a121f] via-[#0a121f]/90 to-[#0a121f]" />
        
        {/* Animated glowing orbs */}
        <div className="absolute top-1/4 -left-20 w-[500px] h-[500px] bg-[#eab308]/10 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-1/4 -right-20 w-[400px] h-[400px] bg-blue-500/5 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: "2s" }} />
      </div>

      {/* Content Container */}
      <div className="container relative z-10 px-4 pt-32 pb-20 text-center text-white">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          className="mx-auto max-w-5xl space-y-10"
        >
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 backdrop-blur-xl px-6 py-2.5 text-[10px] font-black uppercase tracking-[0.3em] text-[#eab308]"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Kingdom Deliverance Centre Uganda
            <div className="w-1.5 h-1.5 rounded-full bg-[#eab308] animate-pulse" />
          </motion.div>

          {/* Main Heading */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.4 }}
            className="font-serif text-6xl font-bold leading-[1] tracking-tight md:text-8xl lg:text-9xl"
          >
            Encounter God, <br />
            <span className="text-[#eab308] italic">Experience</span> <br className="md:hidden" />
            <span className="relative">
              Deliverance
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: "100%" }}
                transition={{ duration: 1.5, delay: 1 }}
                className="absolute -bottom-2 left-0 h-1.5 bg-gradient-to-r from-[#eab308] to-transparent rounded-full" 
              />
            </span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="mx-auto max-w-2xl text-lg leading-relaxed text-white/60 md:text-2xl font-medium"
          >
            Join a movement of faith and power. Discover your purpose and step into the 
            <span className="text-white border-b border-white/20 ml-1">miraculous life</span> God has planned for you.
          </motion.p>

          {/* Action Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.8 }}
            className="flex flex-col items-center justify-center gap-6 pt-6 sm:flex-row"
          >
            <Button
              asChild
              size="lg"
              className="group w-full sm:w-auto bg-[#eab308] hover:bg-white text-[#0a121f] font-black px-10 py-8 text-sm uppercase tracking-widest rounded-2xl shadow-2xl shadow-[#eab308]/10 transition-all duration-500"
            >
              <Link href="/about" className="flex items-center gap-3">
                Plan Your Visit
                <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>

            <Button
              asChild
              size="lg"
              variant="outline"
              className="group w-full sm:w-auto border-white/10 bg-white/5 backdrop-blur-xl text-white hover:bg-white/10 hover:border-white/20 px-10 py-8 text-sm uppercase tracking-widest rounded-2xl transition-all duration-500"
            >
              <Link href="/live" className="flex items-center gap-3">
                <div className="relative flex items-center justify-center">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75" />
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-red-600" />
                </div>
                Watch Live
              </Link>
            </Button>
          </motion.div>

          {/* Bottom Info Grid */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 1 }}
            className="mx-auto max-w-4xl pt-16"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-1 px-4">
              <div className="bg-white/5 backdrop-blur-2xl p-8 rounded-t-[2.5rem] md:rounded-t-none md:rounded-l-[2.5rem] border border-white/10 text-center space-y-3">
                <Clock className="w-6 h-6 text-[#eab308] mx-auto mb-2" />
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#eab308]">Sunday Encounter</h3>
                <p className="text-white font-bold">9:00 AM – 12:00 PM</p>
              </div>
              <div className="bg-white/[0.07] backdrop-blur-2xl p-8 border-x border-white/10 text-center space-y-3">
                <Sparkles className="w-6 h-6 text-[#eab308] mx-auto mb-2" />
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#eab308]">Mid-Week Power</h3>
                <p className="text-white font-bold">Wednesdays 6:00 PM</p>
              </div>
              <div className="bg-white/5 backdrop-blur-2xl p-8 rounded-b-[2.5rem] md:rounded-b-none md:rounded-r-[2.5rem] border border-white/10 text-center space-y-3">
                <Heart className="w-6 h-6 text-[#eab308] mx-auto mb-2" />
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#eab308]">Prayer Line</h3>
                <p className="text-white font-bold">Fridays 6:00 PM</p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 1.5 }}
        className="absolute bottom-10 left-1/2 -translate-x-1/2 hidden md:block"
      >
        <div className="flex flex-col items-center gap-3">
          <span className="text-white/20 text-[10px] font-black tracking-[0.4em] uppercase">Explore</span>
          <div className="w-px h-12 bg-gradient-to-b from-[#eab308] to-transparent animate-bounce" />
        </div>
      </motion.div>
    </section>
  );
}
