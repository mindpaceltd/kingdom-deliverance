"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export function HeroSection() {
  return (
    <section className="relative h-[90vh] flex items-center justify-center overflow-hidden">
      {/* Background Image */}
      <div 
        className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('https://images.unsplash.com/photo-1438232992991-995b7058bbb3?q=80&w=2073&auto=format&fit=crop')" }}
      >
        <div className="absolute inset-0 bg-primary/70 mix-blend-multiply" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-primary/90" />
      </div>

      <div className="container relative z-10 text-center text-white px-4">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="max-w-4xl mx-auto space-y-6"
        >
          <span className="inline-block py-1 px-3 rounded-full bg-accent/20 border border-accent/50 text-accent font-medium text-sm tracking-wider uppercase mb-4">
            Welcome to Kingdom Deliverance Centre Uganda
          </span>
          <h1 className="text-5xl md:text-7xl font-serif font-bold leading-tight">
            Encounter God, <br/>
            <span className="text-accent">Experience Deliverance.</span>
          </h1>
          <p className="text-lg md:text-xl text-white/80 max-w-2xl mx-auto font-light leading-relaxed">
            Join us this Sunday as we worship together, grow in faith, and experience the transformative power of the Holy Spirit.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-8">
            <Button asChild size="lg" className="bg-accent text-primary hover:bg-accent/90 text-lg w-full sm:w-auto">
              <Link href="/about">Plan a Visit</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="text-white border-white hover:bg-white hover:text-primary text-lg w-full sm:w-auto bg-transparent">
              <Link href="/sermons">Watch Live</Link>
            </Button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
