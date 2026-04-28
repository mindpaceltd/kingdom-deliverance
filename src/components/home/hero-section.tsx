"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Play, ArrowRight, Sparkles, Heart } from "lucide-react";
import Link from "next/link";

export function HeroSection() {
  return (
    <section className="relative flex min-h-screen items-center justify-center overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 z-0">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat parallax-bg"
          style={{ 
            backgroundImage: "url('https://images.unsplash.com/photo-1438232992991-995b7058bbb3?q=80&w=2073&auto=format&fit=crop')" 
          }}
        />
        <div className="absolute inset-0 gradient-primary opacity-85" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/20 to-primary/60" />
        
        {/* Floating Elements */}
        <div className="absolute top-20 left-10 w-2 h-2 bg-accent/30 rounded-full float-animation" style={{ animationDelay: '0s' }} />
        <div className="absolute top-40 right-20 w-3 h-3 bg-accent/20 rounded-full float-animation" style={{ animationDelay: '2s' }} />
        <div className="absolute bottom-40 left-20 w-1 h-1 bg-accent/40 rounded-full float-animation" style={{ animationDelay: '4s' }} />
      </div>

      <div className="container relative z-10 text-center text-white px-4">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="mx-auto max-w-5xl space-y-8"
        >
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="inline-flex items-center gap-3 rounded-full glass-morphism px-6 py-3 text-sm font-medium uppercase tracking-[0.25em] text-white/90 pulse-glow"
          >
            <Sparkles className="w-4 h-4 text-accent" />
            Welcome to Kingdom Deliverance Centre Uganda
            <Heart className="w-4 h-4 text-accent" />
          </motion.div>

          {/* Main Heading */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.4 }}
            className="font-serif text-5xl font-bold leading-tight md:text-7xl lg:text-8xl"
          >
            Encounter God, <br />
            <span className="text-gradient bg-gradient-to-r from-accent to-yellow-300 bg-clip-text text-transparent">
              Experience Deliverance.
            </span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="mx-auto max-w-3xl text-lg leading-relaxed text-white/90 md:text-xl lg:text-2xl"
          >
            Join us this Sunday as we worship together, grow in faith, and experience the 
            <span className="text-accent font-semibold"> transformative power </span>
            of the Holy Spirit in our lives.
          </motion.p>

          {/* Call to Action Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.8 }}
            className="flex flex-col items-center justify-center gap-6 pt-8 sm:flex-row"
          >
            <Button 
              asChild 
              size="lg" 
              className="group w-full gradient-accent text-primary font-semibold hover:scale-105 hover:shadow-2xl hover:shadow-accent/30 sm:w-auto transition-all duration-300"
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
              className="group w-full glass-morphism border-white/30 text-white hover:scale-105 hover:bg-white/10 hover:border-accent/50 sm:w-auto transition-all duration-300"
            >
              <Link href="/live" className="flex items-center gap-2">
                <Play className="w-4 h-4 group-hover:scale-110 transition-transform duration-300" />
                Watch Live
              </Link>
            </Button>
          </motion.div>

          {/* Service Times */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1 }}
            className="pt-12"
          >
            <div className="glass-morphism rounded-2xl p-6 mx-auto max-w-2xl">
              <h3 className="text-lg font-semibold text-accent mb-4">Join Us This Week</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="text-center">
                  <div className="font-semibold text-white">Sunday Service</div>
                  <div className="text-white/70">9:00 AM - 12:00 PM</div>
                </div>
                <div className="text-center">
                  <div className="font-semibold text-white">Bible Study</div>
                  <div className="text-white/70">Wednesday 6:00 PM</div>
                </div>
                <div className="text-center">
                  <div className="font-semibold text-white">Prayer Meeting</div>
                  <div className="text-white/70">Friday 6:00 PM</div>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>

      {/* Scroll Indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 1.2 }}
        className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
      >
        <div className="w-6 h-10 border-2 border-white/30 rounded-full flex justify-center">
          <div className="w-1 h-3 bg-accent rounded-full mt-2 animate-bounce" />
        </div>
      </motion.div>
    </section>
  );
}
