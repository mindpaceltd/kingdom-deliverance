'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Search, Package, Download, Loader2 } from 'lucide-react'

export default function GuestOrderLookup() {
  const [email, setEmail] = useState('')
  const [orderId, setOrderId] = useState('')
  const [loading, setLoading] = useState(false)
  const [order, setOrder] = useState<any>(null)
  const [downloads, setDownloads] = useState<any[]>([])
  const [error, setError] = useState('')

  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setOrder(null)
    setDownloads([])

    const res = await fetch(`/api/guest-order?email=${encodeURIComponent(email)}&order_id=${encodeURIComponent(orderId)}`)
    const data = await res.json()

    if (data.error) {
      setError(data.error)
    } else {
      setOrder(data.order)
      setDownloads(data.downloads || [])
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-32 pb-20">
      <div className="container px-4 mx-auto max-w-lg">
        <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm">
          <h1 className="text-xl font-black text-gray-900 mb-1">Guest Order Lookup</h1>
          <p className="text-sm text-gray-400 mb-6">Enter your email and order ID to view your order and downloads.</p>

          <form onSubmit={handleLookup} className="space-y-4 mb-6">
            <div className="space-y-1.5">
              <Label className="text-sm font-semibold">Email Address</Label>
              <Input
                type="email"
                required
                placeholder="The email you used at checkout"
                value={email}
                onChange={e => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-semibold">Order ID</Label>
              <Input
                required
                placeholder="From your confirmation email"
                value={orderId}
                onChange={e => setOrderId(e.target.value)}
              />
            </div>
            <Button type="submit" disabled={loading} className="w-full h-11 bg-[#1e3a5f] hover:bg-[#162d4a] font-bold">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Search className="w-4 h-4 mr-2" /> Look Up Order</>}
            </Button>
          </form>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {order && (
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-bold text-sm text-gray-900 flex items-center gap-2">
                    <Package className="w-4 h-4" /> Order #{order.order_number || order.id?.split('-')[0]}
                  </h3>
                  <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                    order.status === 'completed' ? 'bg-green-100 text-green-700' :
                    order.status === 'processing' ? 'bg-blue-100 text-blue-700' :
                    'bg-yellow-100 text-yellow-700'
                  }`}>
                    {order.status}
                  </span>
                </div>
                <p className="text-xs text-gray-500">
                  {new Date(order.created_at).toLocaleDateString()} · {order.currency} {Number(order.total_amount).toLocaleString()}
                </p>
              </div>

              {downloads.length > 0 && (
                <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                  <h3 className="font-bold text-sm text-blue-900 flex items-center gap-2 mb-3">
                    <Download className="w-4 h-4" /> Your Downloads
                  </h3>
                  <div className="space-y-2">
                    {downloads.map((dl: any) => {
                      const expired = new Date(dl.expires_at) < new Date()
                      const limitReached = dl.download_count >= dl.max_downloads
                      return (
                        <div key={dl.id} className="flex items-center justify-between bg-white p-3 rounded-lg border border-blue-200">
                          <p className="text-sm font-semibold text-gray-900">{dl.product?.name}</p>
                          {!expired && !limitReached ? (
                            <a
                              href={`/api/downloads/${dl.token}`}
                              className="text-xs bg-blue-600 text-white px-3 py-1.5 rounded font-bold hover:bg-blue-700"
                            >
                              Download
                            </a>
                          ) : (
                            <span className="text-xs text-red-500">{expired ? 'Expired' : 'Limit reached'}</span>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
