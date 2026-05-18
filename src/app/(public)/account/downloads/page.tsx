import { createClient } from '@/lib/supabase/server'
import { Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function DownloadsPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/account/login')
  }

  const { data: downloads } = await supabase
    .from('download_tokens')
    .select('*, product:products(name, image_url)')
    .eq('email', user.email!)
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-black text-gray-900">My Downloads</h1>

      {downloads && downloads.length > 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="divide-y divide-gray-100">
            {downloads.map((dl: any) => {
              const expired = new Date(dl.expires_at) < new Date()
              const limitReached = dl.download_count >= dl.max_downloads
              const available = !expired && !limitReached
              return (
                <div key={dl.id} className="flex items-center gap-4 px-5 py-4">
                  {dl.product?.image_url && (
                    <img src={dl.product.image_url} alt="" className="w-12 h-12 rounded-lg object-cover border" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-gray-900">{dl.product?.name}</p>
                    <p className="text-[11px] text-gray-400">
                      {dl.download_count}/{dl.max_downloads} downloads · 
                      Expires {new Date(dl.expires_at).toLocaleDateString()}
                    </p>
                  </div>
                  {available ? (
                    <Button size="sm" asChild className="bg-blue-600 hover:bg-blue-700 text-xs">
                      <a href={`/api/downloads/${dl.token}`}>
                        <Download className="w-3 h-3 mr-1" /> Download
                      </a>
                    </Button>
                  ) : (
                    <span className="text-xs text-red-500 font-medium">
                      {expired ? 'Expired' : 'Limit reached'}
                    </span>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center shadow-sm">
          <Download className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-gray-700 mb-1">No downloads</h3>
          <p className="text-sm text-gray-400">Digital products you purchase will appear here.</p>
        </div>
      )}
    </div>
  )
}
