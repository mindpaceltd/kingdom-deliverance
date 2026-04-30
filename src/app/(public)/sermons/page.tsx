import { getSermons, getSermonFilters } from "@/lib/supabase/queries";
import { SermonsPageClient } from "@/components/content/sermons-page-client";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sermons | Kingdom Deliverance Centre Uganda",
  description:
    "Watch and listen to powerful messages from Bishop Climate Wiseman and the KDC Uganda leadership team.",
};

export const revalidate = 3600;

interface SermonsPageProps {
  searchParams: {
    preacher?: string;
    series?: string;
    from?: string;
    to?: string;
    page?: string;
  };
}

export default async function SermonsPage({ searchParams }: SermonsPageProps) {
  const { preacher, series, from, to, page: pageParam } = searchParams;
  const page = Number(pageParam) || 1;

  const [{ data: sermons, count }, filters] = await Promise.all([
    getSermons({
      preacher: preacher || undefined,
      series: series || undefined,
      from: from || undefined,
      to: to || undefined,
      page,
      pageSize: 12,
    }),
    getSermonFilters(),
  ]);

  return (
    <div className="flex flex-col min-h-screen bg-[#f8fafc]">
      {/* Hero */}
      <section className="relative pt-40 pb-24 text-white overflow-hidden bg-[#0a121f]">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.15)_1px,transparent_1px)] bg-[length:40px_40px]" />
        </div>
        
        <div className="container relative z-10 text-center px-4 max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 rounded-full bg-[#eab308]/10 border border-[#eab308]/20 px-5 py-2 text-xs font-bold uppercase tracking-[0.2em] text-[#eab308] mb-8">
            The Word of God
          </div>
          <h1 className="font-serif text-5xl md:text-6xl lg:text-7xl font-bold text-white leading-tight">
            Sermons & <span className="text-[#eab308]">Messages</span>
          </h1>
          <div className="mx-auto mt-8 h-1 w-20 rounded-full bg-gradient-to-r from-[#eab308] to-yellow-500" />
          <p className="mt-8 text-white/70 text-lg md:text-xl leading-relaxed max-w-2xl mx-auto">
            Be transformed by the power of God&apos;s Word. Watch, listen, and experience the message of salvation and deliverance.
          </p>
        </div>
      </section>

      {/* Sermons list with filters */}
      <SermonsPageClient
        sermons={sermons}
        total={count}
        page={page}
        preachers={filters.preachers}
        series={filters.series}
        currentFilters={{
          preacher: preacher || undefined,
          series: series || undefined,
          from: from || undefined,
          to: to || undefined,
        }}
      />
    </div>
  );
}
