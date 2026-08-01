export default function BlogLoading() {
  return (
    <div className="min-h-[50vh] animate-pulse bg-[#f8fafc]">
      <div className="h-[320px] bg-[#0d1b3e]/20 md:h-[450px]" />
      <div className="container mx-auto max-w-7xl px-4 py-12">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          <div className="space-y-6 lg:col-span-8">
            <div className="h-64 rounded-2xl bg-white" />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="h-72 rounded-xl bg-white" />
              <div className="h-72 rounded-xl bg-white" />
            </div>
          </div>
          <div className="hidden space-y-6 lg:col-span-4 lg:block">
            <div className="h-40 rounded-xl bg-white" />
            <div className="h-56 rounded-xl bg-white" />
          </div>
        </div>
      </div>
    </div>
  )
}
