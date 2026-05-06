'use client'

import * as React from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import { FireServiceForm } from '@/components/prayer/fire-service-form'
import { Flame, Calendar, Clock, MapPin, ChevronRight, AlertCircle, Quote } from 'lucide-react'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Fire Service - Kingdom Deliverance Centre Uganda',
  description: 'Submit your Fire List and connect with a prophetic Fire Seed. Tonight, your case will be carried into the Fire Altar.',
}

export default function FireServicePage() {
  const { scrollYProgress } = useScroll()
  const opacity = useTransform(scrollYProgress, [0, 0.2], [1, 0])
  const scale = useTransform(scrollYProgress, [0, 0.2], [1, 0.95])

  return (
    <div className="bg-[#050810] min-h-screen text-white selection:bg-accent selection:text-white overflow-hidden">
      {/* Immersive Background Effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-accent/20 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[150px] animate-pulse" style={{ animationDelay: '2s' }} />
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-[0.03]" />
      </div>

      {/* Hero Section */}
      <motion.section 
        style={{ opacity, scale }}
        className="relative h-[90vh] flex items-center justify-center overflow-hidden border-b border-white/5"
      >
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#050810]/50 to-[#050810]" />
        
        {/* Animated Fire Particles Placeholder */}
        <div className="absolute inset-0 z-0">
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute h-1 w-1 bg-accent rounded-full"
              initial={{ 
                x: Math.random() * 100 + '%', 
                y: '100%', 
                opacity: 0 
              }}
              animate={{ 
                y: '-10%', 
                opacity: [0, 1, 0],
                scale: [1, 1.5, 0]
              }}
              transition={{ 
                duration: Math.random() * 3 + 2, 
                repeat: Infinity, 
                delay: Math.random() * 5 
              }}
            />
          ))}
        </div>

        <div className="container relative z-10 px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-accent text-sm font-medium mb-8 backdrop-blur-md"
          >
            <Flame className="h-4 w-4 animate-bounce" />
            A Prophetic All-Night Encounter
          </motion.div>
          
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-6xl md:text-8xl font-black tracking-tighter mb-6 bg-clip-text text-transparent bg-gradient-to-b from-white via-white to-white/40"
          >
            THE FIRE <br />
            <span className="text-accent">SERVICE</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="text-xl text-gray-400 max-w-2xl mx-auto mb-10 font-light leading-relaxed"
          >
            Submit your Fire List. Connect with a Prophetic Seed. 
            Tonight, your case will be carried into the Holy Fire Altar.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
          >
            <button 
              onClick={() => document.getElementById('prayer-form')?.scrollIntoView({ behavior: 'smooth' })}
              className="px-8 py-4 bg-accent text-white font-bold rounded-full hover:bg-accent/90 transition-all hover:scale-105 active:scale-95 shadow-[0_0_40px_-10px_rgba(255,77,0,0.5)]"
            >
              Submit Your Fire List
            </button>
          </motion.div>
        </div>
      </motion.section>

      <div className="container max-w-4xl px-4 py-24 relative">
        {/* The Prophetic Letter Section */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="relative"
        >
          {/* Decorative Quote Mark */}
          <div className="absolute -top-12 -left-12 opacity-5">
            <Quote size={160} className="text-accent" />
          </div>

          <article className="relative space-y-12 text-lg md:text-xl leading-relaxed text-gray-300 font-light">
            <div className="space-y-6">
              <p className="text-accent font-bold text-2xl font-serif italic mb-8">Dear Child Of God,</p>
              
              <div className="space-y-6 first-letter:text-5xl first-letter:font-bold first-letter:text-accent first-letter:mr-3 first-letter:float-left">
                <p>I am not writing to you casually. I am writing because the Spirit of God has been speaking, and I cannot ignore what I am seeing.</p>
                <p>There is something troubling your life. It may look small on the surface… but the effect is not small. It has been causing delay, confusion, loss, and frustration in ways you cannot fully explain.</p>
              </div>
            </div>

            {/* Biblical Parallel Card */}
            <div className="p-8 md:p-12 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-xl relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-accent/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative z-10 space-y-6">
                <h3 className="text-2xl font-bold text-white flex items-center gap-3">
                  <AlertCircle className="text-accent" />
                  The Mystery of Achan
                </h3>
                <p>After the victory of Jericho, Israel faced a small battle — and they were defeated. God revealed the cause: <span className="text-accent font-bold">Achan — the troubler.</span></p>
                <p className="italic text-white">One hidden issue. One concealed matter. One thing that was not exposed.</p>
                
                <div className="pt-6 border-t border-white/10 mt-6">
                  <p className="text-2xl md:text-3xl font-serif italic text-white text-center leading-snug">
                    “There is an <span className="text-accent">Achan</span> in their life.”
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-8">
              <h2 className="text-3xl md:text-4xl font-black text-white tracking-tight flex items-center gap-4">
                <span className="h-10 w-2 bg-accent rounded-full" />
                Why You Have Been Struggling
              </h2>
              <p>You have been praying. You have been believing. But there are battles that will not respond until they are brought into the place of fire.</p>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {['Identified', 'Brought Forward', 'Judged', 'Consumed'].map((step, i) => (
                  <div key={step} className="p-4 rounded-2xl bg-white/5 border border-white/10 text-center">
                    <span className="text-accent font-bold text-lg block mb-1">0{i+1}</span>
                    <span className="text-sm font-medium uppercase tracking-widest">{step}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Event Details Callout */}
            <div className="p-10 rounded-3xl bg-accent text-white relative overflow-hidden shadow-2xl shadow-accent/20">
              <div className="absolute right-0 top-0 -mr-20 -mt-20 h-64 w-64 bg-white/20 rounded-full blur-3xl" />
              <h3 className="text-2xl font-black mb-8 flex items-center gap-3">
                <Flame className="fill-white" />
                YOUR MOMENT OF EXPOSURE
              </h3>
              
              <div className="grid md:grid-cols-3 gap-8">
                <div className="flex items-start gap-4">
                  <Calendar className="shrink-0 h-6 w-6 opacity-80" />
                  <div>
                    <p className="text-sm opacity-70 uppercase tracking-widest font-bold">Date</p>
                    <p className="text-xl font-bold">April 24, 2026</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <Clock className="shrink-0 h-6 w-6 opacity-80" />
                  <div>
                    <p className="text-sm opacity-70 uppercase tracking-widest font-bold">Time</p>
                    <p className="text-xl font-bold">10PM — ALL NIGHT</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <MapPin className="shrink-0 h-6 w-6 opacity-80" />
                  <div>
                    <p className="text-sm opacity-70 uppercase tracking-widest font-bold">Location</p>
                    <p className="text-xl font-bold">KDC Centre</p>
                    <p className="text-xs opacity-80">Kosovo–Lungujja, Kampala</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-12">
              <div className="text-center space-y-4">
                <h2 className="text-4xl md:text-5xl font-black text-white italic">
                  “This matter <span className="text-accent underline decoration-4 underline-offset-8">must</span> end.”
                </h2>
              </div>

              <div className="grid md:grid-cols-3 gap-6">
                {[
                  { title: "Write Your List", desc: "Be specific. Be honest. Be direct.", icon: "✍️" },
                  { title: "Submit Now", desc: "Before the fire is raised at the altar.", icon: "🔥" },
                  { title: "Connect Seed", desc: "Prophetic alignment for breakthrough.", icon: "💎" }
                ].map((item, i) => (
                  <div key={i} className="p-8 rounded-3xl bg-white/5 border border-white/10 hover:border-accent/50 transition-colors group">
                    <span className="text-4xl mb-4 block group-hover:scale-110 transition-transform">{item.icon}</span>
                    <h4 className="text-xl font-bold text-white mb-2">{item.title}</h4>
                    <p className="text-sm text-gray-400 font-light leading-relaxed">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-16 border-t border-white/10 text-center space-y-8">
              <div className="space-y-4">
                <p className="text-2xl text-accent font-black tracking-widest uppercase">The Altar is Waiting</p>
                <p className="italic text-gray-500">— Master Prophet Climate</p>
              </div>
              
              <motion.div
                animate={{ y: [0, 10, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="text-white/20"
              >
                <ChevronRight className="rotate-90 h-10 w-10 mx-auto" />
              </motion.div>
            </div>
          </article>
        </motion.div>

        {/* The Form Component */}
        <div id="prayer-form" className="mt-16 scroll-mt-24 relative">
          <div className="absolute inset-0 bg-accent/5 blur-[100px] rounded-full pointer-events-none" />
          <div className="relative z-10">
            <React.Suspense fallback={
              <div className="h-[600px] w-full bg-white/5 animate-pulse rounded-3xl border border-white/10 backdrop-blur-xl" />
            }>
              <FireServiceForm />
            </React.Suspense>
          </div>
      </div>
    </div>
  </div>
)
}
