import { getSermons, getSermonFilters } from "@/lib/supabase/queries";
import { SermonsPageClient } from "@/components/content/sermons-page-client";
import type { Metadata } from "next";
import { buildListPageMetadata } from "@/lib/seo/list-page-metadata";

export async function generateMetadata(): Promise<Metadata> {
  return buildListPageMetadata({
    title: "Sermons & Messages",
    description:
      "Watch and listen to powerful sermons from Bishop Climate Wiseman and KDC Uganda. Faith-building messages on healing, deliverance, and the Word of God.",
    path: "/sermons",
    keywords:
      "KDC Uganda sermons, Bishop Climate Wiseman sermons, church sermons Uganda, deliverance messages Kampala, Christian preaching Uganda",
    ogType: "sermon",
  });
}

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
    <div className="flex flex-col">
      {/* Hero */}
      <section className="relative py-20 md:py-40 text-white overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage:
              "url('https://images.unsplash.com/photo-1544427920-c49ccfb85579?q=80&w=2000&auto=format&fit=crop')",
          }}
        />
        <div className="absolute inset-0 bg-black/70" />
        <div className="container relative z-10 text-center px-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 backdrop-blur-md px-5 py-2 text-sm font-semibold text-accent mb-8">
            The Word of God
          </div>
          <h1 className="font-serif text-5xl md:text-6xl font-bold text-white leading-tight">
            Sermons &amp; Messages
          </h1>
          <div className="mx-auto mt-5 h-1 w-20 rounded-full bg-accent" />
          <p className="mt-6 text-white/90 text-lg md:text-xl max-w-xl mx-auto">
            Be transformed by the power of God&apos;s Word. Watch, listen, and
            be blessed.
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
