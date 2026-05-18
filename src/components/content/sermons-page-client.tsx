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
    <section className="py-20 bg-muted">
      <div className="container px-4">
        {/* Filter bar */}
        <div className="bg-white rounded-2xl shadow-sm p-5 mb-10">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:flex lg:flex-wrap gap-4 items-end">
            {/* Preacher filter */}
            <div className="flex flex-col gap-1.5 w-full lg:w-48 lg:min-w-[180px]">
              <label className="text-xs font-medium text-muted-foreground">
                Preacher
              </label>
              <Select
                value={currentFilters.preacher ?? "__all__"}
                onValueChange={handlePreacherChange}
              >
                <SelectTrigger className="w-full h-10 lg:h-9 bg-white">
                  <SelectValue placeholder="All Preachers" />
                </SelectTrigger>
                <SelectContent>
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
            <div className="flex flex-col gap-1.5 w-full lg:w-48 lg:min-w-[180px]">
              <label className="text-xs font-medium text-muted-foreground">
                Series
              </label>
              <Select
                value={currentFilters.series ?? "__all__"}
                onValueChange={handleSeriesChange}
              >
                <SelectTrigger className="w-full h-10 lg:h-9 bg-white">
                  <SelectValue placeholder="All Series" />
                </SelectTrigger>
                <SelectContent>
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
            <div className="flex flex-col gap-1.5 w-full lg:w-40">
              <label className="text-xs font-medium text-muted-foreground">
                From Date
              </label>
              <input
                type="date"
                value={currentFilters.from ?? ""}
                onChange={handleFromChange}
                className="w-full h-10 lg:h-9 rounded-lg border border-input bg-white px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-accent/20 transition-all duration-300"
              />
            </div>

            {/* Date to */}
            <div className="flex flex-col gap-1.5 w-full lg:w-40">
              <label className="text-xs font-medium text-muted-foreground">
                To Date
              </label>
              <input
                type="date"
                value={currentFilters.to ?? ""}
                onChange={handleToChange}
                className="w-full h-10 lg:h-9 rounded-lg border border-input bg-white px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-accent/20 transition-all duration-300"
              />
            </div>

            {/* Clear filters */}
            {hasFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearFilters}
                className="flex items-center gap-1.5 text-muted-foreground hover:text-destructive h-10 lg:h-9 px-4 lg:px-3 hover:bg-destructive/5 rounded-lg w-full sm:w-auto self-end lg:ml-2"
              >
                <X className="w-4 h-4" />
                Clear filters
              </Button>
            )}
          </div>

          {/* Active filter summary */}
          {hasFilters && (
            <div className="mt-3 pt-3 border-t border-border flex flex-wrap gap-2 text-xs text-muted-foreground">
              <span className="font-medium">Active filters:</span>
              {currentFilters.preacher && (
                <span className="bg-accent/10 text-accent px-2 py-0.5 rounded-full font-medium">
                  Preacher: {currentFilters.preacher}
                </span>
              )}
              {currentFilters.series && (
                <span className="bg-accent/10 text-accent px-2 py-0.5 rounded-full font-medium">
                  Series: {currentFilters.series}
                </span>
              )}
              {currentFilters.from && (
                <span className="bg-accent/10 text-accent px-2 py-0.5 rounded-full font-medium">
                  From: {currentFilters.from}
                </span>
              )}
              {currentFilters.to && (
                <span className="bg-accent/10 text-accent px-2 py-0.5 rounded-full font-medium">
                  To: {currentFilters.to}
                </span>
              )}
              <span className="ml-auto">
                {total} sermon{total !== 1 ? "s" : ""} found
              </span>
            </div>
          )}
        </div>

        {/* Sermon grid */}
        {sermons.length === 0 ? (
          <div className="text-center py-24 text-muted-foreground">
            <Play className="w-16 h-16 mx-auto mb-4 opacity-20" />
            <p className="text-xl font-medium">No sermons found</p>
            <p className="text-sm mt-2">
              {hasFilters
                ? "Try adjusting or clearing your filters."
                : "Check back soon for new messages."}
            </p>
            {hasFilters && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleClearFilters}
                className="mt-4"
              >
                Clear filters
              </Button>
            )}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {sermons.map((sermon) => (
                <SermonCard key={sermon.id} sermon={sermon} />
              ))}
            </div>

            {/* Pagination */}
            {total > PAGE_SIZE && (
              <div className="mt-12 flex items-center justify-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handlePageChange(page - 1)}
                  disabled={page <= 1}
                  aria-label="Previous page"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>

                {/* Page numbers */}
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter(
                    (p) =>
                      p === 1 ||
                      p === totalPages ||
                      Math.abs(p - page) <= 2
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
                        className="px-1 text-muted-foreground text-sm"
                      >
                        …
                      </span>
                    ) : (
                      <Button
                        key={item}
                        variant={item === page ? "default" : "outline"}
                        size="icon"
                        onClick={() => handlePageChange(item as number)}
                        aria-label={`Page ${item}`}
                        aria-current={item === page ? "page" : undefined}
                        className={
                          item === page
                            ? "bg-accent text-primary hover:bg-accent/90 border-accent"
                            : ""
                        }
                      >
                        {item}
                      </Button>
                    )
                  )}

                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handlePageChange(page + 1)}
                  disabled={page >= totalPages}
                  aria-label="Next page"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}
