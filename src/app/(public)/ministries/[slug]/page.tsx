import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Users, Clock, Info, ChevronRight, Share2, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Metadata } from "next";

interface Props { params: { slug: string } }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const supabase = createClient();
  const { data } = await supabase.from("ministries").select("name,description").eq("slug", params.slug).single();
  if (!data) return { title: "Ministry Not Found" };
  return { title: `${data.name} | KDC Uganda Ministries`, description: data.description ?? undefined };
}

export const revalidate = 3600;

export default async function MinistryDetailPage({ params }: Props) {
  const supabase = createClient();
  const { data: ministry } = await supabase.from("ministries").select("*").eq("slug", params.slug).eq("is_active", true).single();
  if (!ministry) notFound();

  return (
    <div className="flex flex-col min-h-screen bg-[#f8fafc]">
      {/* Hero Section */}
      <section className="relative pt-40 pb-24 bg-[#0a121f] overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.15)_1px,transparent_1px)] bg-[length:40px_40px]" />
        </div>
        
        <div className="container relative z-10 px-4 max-w-7xl mx-auto text-white">
          <Link href="/ministries" className="inline-flex items-center gap-2 text-[#eab308] hover:underline text-sm font-semibold mb-8 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to All Ministries
          </Link>
          
          <div className="max-w-4xl space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#eab308]/10 border border-[#eab308]/20 text-[#eab308] text-xs font-bold uppercase tracking-widest">
              Join Our Community
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-7xl font-bold font-serif leading-tight">
              {ministry.name}
            </h1>
            
            <div className="flex flex-wrap items-center gap-8 text-sm text-white/60 pt-4 font-bold uppercase tracking-widest">
              {ministry.leader && (
                <span className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-[#eab308]" /> 
                  Led by {ministry.leader}
                </span>
              )}
              {ministry.meeting_time && (
                <span className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-[#eab308]" /> 
                  {ministry.meeting_time}
                </span>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <main className="container px-4 max-w-7xl mx-auto -mt-10 mb-24 relative z-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          
          {/* Left Column: Description & Content */}
          <div className="lg:col-span-8 space-y-8">
            <div className="bg-white p-8 md:p-12 rounded-3xl shadow-sm border border-gray-100">
              <div className="space-y-10">
                <div className="flex items-center gap-3">
                  <div className="w-1 h-8 bg-[#eab308] rounded-full" />
                  <h2 className="text-3xl font-bold font-serif text-[#0a121f]">About the Ministry</h2>
                </div>
                
                {ministry.description && (
                  <p className="text-2xl text-gray-600 leading-relaxed font-medium">
                    {ministry.description}
                  </p>
                )}

                {ministry.content && (
                  <div 
                    className="prose prose-lg max-w-none prose-headings:text-[#0a121f] prose-p:text-gray-600 prose-a:text-[#eab308] pt-10 border-t border-gray-50" 
                    dangerouslySetInnerHTML={{ __html: ministry.content }} 
                  />
                )}

                <div className="pt-10 flex flex-wrap gap-4">
                  <Button asChild className="bg-[#eab308] hover:bg-[#0a121f] text-[#0a121f] hover:text-white h-14 px-8 rounded-2xl font-black uppercase tracking-widest transition-all duration-300">
                    <Link href="/contact">Join This Ministry</Link>
                  </Button>
                  <Button asChild variant="outline" className="border-gray-100 hover:bg-gray-50 text-gray-400 h-14 px-8 rounded-2xl font-bold transition-all">
                    <Link href="/ministries">View All Ministries</Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Sidebar */}
          <aside className="lg:col-span-4 space-y-8">
            
            {/* Ministry Logistics Card */}
            <div className="bg-[#0a121f] text-white p-8 rounded-3xl shadow-xl shadow-[#0a121f]/10">
              <div className="flex items-center gap-3 mb-8 border-b border-white/10 pb-4">
                <Info className="w-5 h-5 text-[#eab308]" />
                <h3 className="text-xs font-bold uppercase tracking-widest text-white/40">Ministry Details</h3>
              </div>
              
              <div className="space-y-8">
                {ministry.leader && (
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                      <Users className="w-5 h-5 text-[#eab308]" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-1">Ministry Leader</p>
                      <p className="font-bold text-white leading-tight">{ministry.leader}</p>
                    </div>
                  </div>
                )}

                {ministry.meeting_time && (
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                      <Clock className="w-5 h-5 text-[#eab308]" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-1">Meeting Time</p>
                      <p className="font-bold text-white leading-tight">{ministry.meeting_time}</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-10 p-6 bg-white/5 rounded-2xl border border-white/5 group hover:bg-white/10 transition-colors">
                <p className="text-xs text-white/60 leading-relaxed font-medium">
                  Interested in serving or have questions? Get in touch with us to find out how you can contribute to {ministry.name}.
                </p>
                <Link href="/contact" className="inline-flex items-center gap-2 mt-4 text-[#eab308] text-xs font-bold uppercase tracking-widest hover:underline">
                  Send Inquiry <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            </div>

            {/* Share & Support Card */}
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
              <div className="flex items-center gap-3 mb-6">
                <Share2 className="w-5 h-5 text-[#eab308]" />
                <h3 className="text-xs font-bold text-[#0a121f] uppercase tracking-widest">Spread the Word</h3>
              </div>
              <p className="text-sm text-gray-500 mb-8 leading-relaxed font-medium">
                Know someone who would thrive in {ministry.name}? Share this page with them today.
              </p>
              <div className="grid grid-cols-3 gap-4">
                <button className="flex flex-col items-center gap-2 group">
                  <div className="w-12 h-12 rounded-2xl bg-gray-50 text-gray-400 flex items-center justify-center group-hover:bg-[#1877F2] group-hover:text-white transition-all duration-300">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                  </div>
                  <span className="text-[10px] font-bold text-gray-400">Facebook</span>
                </button>
                <button className="flex flex-col items-center gap-2 group">
                  <div className="w-12 h-12 rounded-2xl bg-gray-50 text-gray-400 flex items-center justify-center group-hover:bg-[#1DA1F2] group-hover:text-white transition-all duration-300">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                  </div>
                  <span className="text-[10px] font-bold text-gray-400">Twitter</span>
                </button>
                <button className="flex flex-col items-center gap-2 group">
                  <div className="w-12 h-12 rounded-2xl bg-gray-50 text-gray-400 flex items-center justify-center group-hover:bg-[#D44638] group-hover:text-white transition-all duration-300">
                    <Mail className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-bold text-gray-400">Email</span>
                </button>
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
