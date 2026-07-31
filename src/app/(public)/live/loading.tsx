export default function LiveLoading() {
  return (
    <div className="flex flex-col">
      <section className="relative overflow-hidden bg-primary py-20 text-white md:py-40">
        <div className="absolute inset-0 bg-black/75" />
        <div className="container relative z-10 animate-pulse px-4 text-center">
          <div className="mx-auto mb-6 h-4 w-32 rounded bg-white/20" />
          <div className="mx-auto h-12 w-64 rounded bg-white/20" />
          <div className="mx-auto mt-5 h-1 w-20 rounded bg-accent/40" />
        </div>
      </section>
      <section className="bg-black py-12">
        <div className="container mx-auto max-w-5xl px-4">
          <div className="aspect-video animate-pulse rounded-2xl bg-white/10" />
        </div>
      </section>
    </div>
  )
}
