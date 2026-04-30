"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import { X, ChevronLeft, ChevronRight, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SermonCard } from "@/components/content/sermon-card";
import type { Sermon } from "@/lib/types";

const PAGE_SIZE = 12;

export interface SermonsPageClientProps {
  sermons: Sermon[];
  total: number;
  page: number;
  preachers: string[];
  series: string[];
  currentFilters: {
    preacher?: string;
    series?: string;
    from?: string;
    to?: string;
  };
}

export function SermonsPageClient({
  sermons,
  total,
  page,
  preachers,
  series,
  currentFilters,
}: SermonsPageClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const totalPages = Math.ceil(total / PAGE_SIZE);
  const hasFilters =
    !!currentFilters.preacher ||
    !!currentFilters.series ||
    !!currentFilters.from ||
    !!currentFilters.to;

  const buildUrl = useCallback(
    (updates: Record<string, string | undefined>, resetPage = true) => {
      const params = new URLSearchParams(searchParams.toString());

      if (resetPage) params.delete("page");

      for (const [key, value] of Object.entries(updates)) {
        if (value) {
          params.set(key, value);
        } else {
          params.delete(key);
        }
      }

      return `/sermons?${params.toString()}`;
    },
    [searchParams]
  );

  const handlePreacherChange = (value: string | null) => {
    const v = value ?? "__all__";
    router.push(buildUrl({ preacher: v === "__all__" ? undefined : v }));
  };

  const handleSeriesChange = (value: string | null) => {
    const v = value ?? "__all__";
    router.push(buildUrl({ series: v === "__all__" ? undefined : v }));
  };

  const handleFromChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    router.push(buildUrl({ from: e.target.value || undefined }));
  };

  const handleToChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    router.push(buildUrl({ to: e.target.value || undefined }));
  };

  const handleClearFilters = () => {
    router.push("/sermons");
  };

  const handlePageChange = (newPage: number) => {
    router.push(buildUrl({ page: String(newPage) }, false));
  };

  return (
    <section className="py-20 bg-[#f8fafc]">
      <div className="container px-4 max-w-7xl mx-auto">
        {/* Filter bar */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-12 -mt-16 relative z-20">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-end">
            {/* Preacher filter */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-[#0a121f] uppercase tracking-widest">
                Preacher
              </label>
              <Select
                value={currentFilters.preacher ?? "__all__"}
                onValueChange={handlePreacherChange}
              >
                <SelectTrigger className="w-full bg-gray-50 border-gray-100 h-11 rounded-xl focus:ring-[#eab308]">
                  <SelectValue placeholder="All Preachers" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-gray-100">
                  <SelectItem value="__all__">All Preachers</SelectItem>
                  {preachers.map((p) => (
                    <SelectItem key={p} value={p}>
                      {p}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Series filter */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-[#0a121f] uppercase tracking-widest">
                Sermon Series
              </label>
              <Select
                value={currentFilters.series ?? "__all__"}
                onValueChange={handleSeriesChange}
              >
                <SelectTrigger className="w-full bg-gray-50 border-gray-100 h-11 rounded-xl focus:ring-[#eab308]">
                  <SelectValue placeholder="All Series" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-gray-100">
                  <SelectItem value="__all__">All Series</SelectItem>
                  {series.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Date from */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-[#0a121f] uppercase tracking-widest">
                From Date
              </label>
              <input
                type="date"
                value={currentFilters.from ?? ""}
                onChange={handleFromChange}
                className="w-full h-11 rounded-xl border border-gray-100 bg-gray-50 px-4 py-2 text-sm outline-none focus:ring-1 focus:ring-[#eab308] transition-all"
              />
            </div>

            {/* Date to */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-[#0a121f] uppercase tracking-widest">
                To Date
              </label>
              <div className="flex gap-2">
                <input
                  type="date"
                  value={currentFilters.to ?? ""}
                  onChange={handleToChange}
                  className="flex-1 h-11 rounded-xl border border-gray-100 bg-gray-50 px-4 py-2 text-sm outline-none focus:ring-1 focus:ring-[#eab308] transition-all"
                />
                {hasFilters && (
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleClearFilters}
                    className="h-11 w-11 rounded-xl border-gray-100 text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors shrink-0"
                    title="Clear Filters"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Active filter summary */}
          {hasFilters && (
            <div className="mt-6 pt-6 border-t border-gray-50 flex flex-wrap items-center gap-3">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Active:</span>
              <div className="flex flex-wrap gap-2">
                {currentFilters.preacher && (
                  <div className="inline-flex items-center gap-2 bg-[#0a121f] text-white text-[10px] font-bold px-3 py-1.5 rounded-full uppercase tracking-widest">
                    Preacher: {currentFilters.preacher}
                  </div>
                )}
                {currentFilters.series && (
                  <div className="inline-flex items-center gap-2 bg-[#0a121f] text-white text-[10px] font-bold px-3 py-1.5 rounded-full uppercase tracking-widest">
                    Series: {currentFilters.series}
                  </div>
                )}
                {(currentFilters.from || currentFilters.to) && (
                  <div className="inline-flex items-center gap-2 bg-[#0a121f] text-white text-[10px] font-bold px-3 py-1.5 rounded-full uppercase tracking-widest">
                    Date Range Applied
                  </div>
                )}
              </div>
              <span className="ml-auto text-xs font-medium text-gray-400 italic">
                {total} sermon{total !== 1 ? "s" : ""} found
              </span>
            </div>
          )}
        </div>

        {/* Sermon grid */}
        {sermons.length === 0 ? (
          <div className="text-center py-32 bg-white rounded-2xl border border-gray-100">
            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <Play className="w-10 h-10 text-gray-200" />
            </div>
            <h3 className="text-2xl font-bold text-[#0a121f] mb-2">No sermons found</h3>
            <p className="text-gray-500 max-w-md mx-auto">
              {hasFilters
                ? "We couldn't find any sermons matching your current filters. Try adjusting your search criteria."
                : "Check back soon for new messages and spiritual teachings."}
            </p>
            {hasFilters && (
              <Button
                variant="outline"
                onClick={handleClearFilters}
                className="mt-8 rounded-full px-8 h-12 border-[#0a121f] text-[#0a121f] hover:bg-[#0a121f] hover:text-white transition-all font-bold"
              >
                Clear All Filters
              </Button>
            )}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
              {sermons.map((sermon) => (
                <SermonCard key={sermon.id} sermon={sermon} />
              ))}
            </div>

            {/* Pagination */}
            {total > PAGE_SIZE && (
              <div className="mt-20 flex items-center justify-center gap-3">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handlePageChange(page - 1)}
                  disabled={page <= 1}
                  className="w-11 h-11 rounded-xl border-gray-100 hover:border-[#eab308] hover:text-[#eab308] transition-all"
                >
                  <ChevronLeft className="w-5 h-5" />
                </Button>

                <div className="flex items-center gap-2">
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter(
                      (p) =>
                        p === 1 ||
                        p === totalPages ||
                        Math.abs(p - page) <= 1
                    )
                    .reduce<(number | "ellipsis")[]>((acc, p, idx, arr) => {
                      if (idx > 0 && p - (arr[idx - 1] as number) > 1) {
                        acc.push("ellipsis");
                      }
                      acc.push(p);
                      return acc;
                    }, [])
                    .map((item, idx) =>
                      item === "ellipsis" ? (
                        <span
                          key={`ellipsis-${idx}`}
                          className="px-2 text-gray-300"
                        >
                          &bull;&bull;&bull;
                        </span>
                      ) : (
                        <Button
                          key={item}
                          variant={item === page ? "default" : "outline"}
                          onClick={() => handlePageChange(item as number)}
                          className={`w-11 h-11 rounded-xl font-bold text-sm transition-all ${
                            item === page
                              ? "bg-[#eab308] text-[#0a121f] hover:bg-[#eab308]/90 border-[#eab308]"
                              : "border-gray-100 text-gray-500 hover:border-[#eab308] hover:text-[#eab308]"
                          }`}
                        >
                          {item}
                        </Button>
                      )
                    )}
                </div>

                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handlePageChange(page + 1)}
                  disabled={page >= totalPages}
                  className="w-11 h-11 rounded-xl border-gray-100 hover:border-[#eab308] hover:text-[#eab308] transition-all"
                >
                  <ChevronRight className="w-5 h-5" />
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}
