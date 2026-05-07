"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, Quote, MessageCircle } from "lucide-react";
import Link from "next/link";
import { createClient } from '@/lib/supabase/client';

// Fallback testimonies if DB fetch fails or is empty
const defaultTestimonies = [
  {
    id: "1",
    name: "Sarah K.",
    message: "Ever since I joined Kingdom Deliverance Centre, my life has completely transformed. The teachings on faith and deliverance helped my business grow tremendously!",
  },
  {
    id: "2",
    name: "David M.",
    message: "I was struggling with an illness for years, but after Bishop Climate prayed for me during the Sunday service, I received my total healing. Glory to God!",
  },
  {
    id: "3",
    name: "Grace A.",
    message: "The Wednesday Bible study sessions have opened my eyes to the true power of the Word. My family has experienced so much peace and restoration.",
  },
  {
    id: "4",
    name: "John & Mary",
    message: "We were praying for a financial breakthrough, and God answered us miraculously. We are now debt-free and thriving!",
  }
];

export function TestimoniesSection() {
  const [testimonies, setTestimonies] = useState<any[]>(defaultTestimonies);

  useEffect(() => {
    async function fetchTestimonies() {
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from("testimonies")
          .select("*")
          .eq("status", "approved")
          .order("created_at", { ascending: false })
          .limit(6);
          
        if (data && data.length > 0) {
          setTestimonies(data);
        }
      } catch (err) {
        console.error("Testimonies fetch error (table might not exist yet):", err);
      }
    }
    fetchTestimonies();
  }, []);

  return (
    <section className="py-24 bg-accent/5 overflow-hidden relative">
      <div className="container px-4 text-center space-y-4 mb-16 relative z-10">
        <div className="inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-5 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-accent">
          <MessageCircle className="h-3.5 w-3.5" />
          Testimonies
        </div>
        <h2 className="text-4xl font-bold md:text-5xl font-serif text-primary">
          Lives Transformed
        </h2>
        <p className="text-base text-primary/60 max-w-xl mx-auto md:text-lg">
          Read what God is doing in the lives of our church members.
        </p>
      </div>

      {/* Auto-scrolling Carousel container */}
      <div className="relative flex overflow-x-hidden group pb-10">
        <div className="flex w-max animate-marquee gap-6 px-3">
          {[...testimonies, ...testimonies, ...testimonies, ...testimonies].map((testimony, i) => (
            <Card key={`card-${testimony.id}-${i}`} className="w-80 md:w-96 shrink-0 bg-white border-none shadow-md hover:shadow-xl transition-shadow duration-300">
              <CardContent className="p-8 space-y-6">
                <Quote className="w-10 h-10 text-accent/20" />
                <p className="text-primary/75 leading-relaxed text-sm italic line-clamp-4">
                  "{testimony.testimony || testimony.message}"
                </p>
                <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
                  <p className="font-bold font-serif text-primary">{testimony.name}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* CSS Animation injected safely */}
      <style dangerouslySetInnerHTML={{__html: `
        .animate-marquee {
          animation: marquee 15s linear infinite;
        }
        .group:hover .animate-marquee {
          animation-play-state: paused;
        }
        @keyframes marquee {
          0% { transform: translateX(0%); }
          100% { transform: translateX(-50%); }
        }
      `}} />

      <div className="container px-4 text-center mt-12 relative z-10">
        <div className="p-8 bg-white rounded-2xl border shadow-lg max-w-3xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="text-left space-y-2">
             <h3 className="text-2xl font-bold font-serif text-primary">Have a testimony?</h3>
             <p className="text-sm text-primary/60">Share what God has done in your life to encourage others.</p>
          </div>
          <Button asChild className="bg-accent text-primary hover:bg-accent/90 font-bold rounded-full px-8 py-6 shadow-xl shrink-0">
            <Link href="/testimonies" className="flex items-center gap-2">
              Submit Your Testimony
              <ArrowRight className="w-4 h-4" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
