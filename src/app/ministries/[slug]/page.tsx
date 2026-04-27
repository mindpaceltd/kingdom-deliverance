import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Users, Clock } from "lucide-react";
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
    <div className="flex flex-col">
      <section className="py-28 bg-primary text-white">
        <div className="container px-4 max-w-4xl mx-auto">
          <Link href="/ministries" className="inline-flex items-center gap-2 text-white/60 hover:text-accent text-sm mb-8 transition-colors">
            <ArrowLeft className="w-4 h-4" /> All Ministries
          </Link>
          <h1 className="font-serif text-4xl md:text-5xl font-bold">{ministry.name}</h1>
          <div className="flex flex-wrap gap-6 mt-6 text-white/70 text-sm">
            {ministry.leader && (
              <span className="flex items-center gap-2"><Users className="w-4 h-4 text-accent" />Led by {ministry.leader}</span>
            )}
            {ministry.meeting_time && (
              <span className="flex items-center gap-2"><Clock className="w-4 h-4 text-accent" />{ministry.meeting_time}</span>
            )}
          </div>
        </div>
      </section>

      <section className="py-16 bg-white">
        <div className="container px-4 max-w-4xl mx-auto space-y-8">
          {ministry.description && (
            <p className="text-xl text-primary/80 leading-relaxed border-l-4 border-accent pl-6">{ministry.description}</p>
          )}
          {ministry.content && (
            <div className="prose prose-purple prose-lg max-w-none" dangerouslySetInnerHTML={{ __html: ministry.content }} />
          )}
          <div className="flex flex-wrap gap-4 pt-4">
            <Button asChild className="bg-accent text-primary hover:bg-accent/90">
              <Link href="/contact">Join This Ministry</Link>
            </Button>
            <Button asChild variant="outline" className="border-primary text-primary">
              <Link href="/ministries">View All Ministries</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
