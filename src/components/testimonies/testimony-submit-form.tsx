'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { CheckCircle2, Loader2, UploadCloud, Video } from 'lucide-react'

export function TestimonySubmitForm() {
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    message: '',
  })
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) setFile(e.target.files[0])
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const supabase = createClient()
      let mediaUrl: string | null = null

      if (file) {
        const { uploadFileViaApi } = await import('@/lib/storage/client-upload')
        const result = await uploadFileViaApi(file, { isTestimony: true })
        mediaUrl = result.publicUrl
      }

      const { error: dbError } = await supabase.from('testimonies').insert({
        name: form.name,
        email: form.email || null,
        phone: form.phone,
        location: form.address || null,
        testimony: form.message,
        media_url: mediaUrl,
        media_type: file?.type || null,
        status: 'pending',
      })

      if (dbError) throw new Error(dbError.message)

      setSuccess(true)
      setForm({ name: '', email: '', phone: '', address: '', message: '' })
      setFile(null)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'An unexpected error occurred.'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="py-12 text-center">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-green-100 text-green-600">
          <CheckCircle2 className="h-10 w-10" />
        </div>
        <h3 className="mb-4 font-serif text-3xl font-bold text-primary">Testimony Submitted!</h3>
        <p className="mx-auto mb-8 max-w-md text-primary/70">
          Thank you for sharing your story. It has been received and will be reviewed by our team
          before being published on the website.
        </p>
        <Button
          onClick={() => setSuccess(false)}
          className="bg-accent text-primary hover:bg-accent/90"
        >
          Submit Another Testimony
        </Button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="t-name">Full Name *</Label>
          <Input
            id="t-name"
            placeholder="e.g. Jane Doe"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="t-email">Email Address</Label>
          <Input
            id="t-email"
            type="email"
            placeholder="email@example.com"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="t-phone">Phone Number *</Label>
          <Input
            id="t-phone"
            placeholder="+256..."
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="t-address">Address / Location</Label>
          <Input
            id="t-address"
            placeholder="e.g. Kampala, Uganda"
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="t-message">Your Testimony *</Label>
        <Textarea
          id="t-message"
          placeholder="Share the details of what God has done..."
          rows={8}
          className="resize-y"
          value={form.message}
          onChange={(e) => setForm({ ...form, message: e.target.value })}
          required
        />
      </div>

      <div className="space-y-2 rounded-xl border-2 border-dashed bg-muted/30 p-6 transition-colors hover:bg-muted/50">
        <Label className="mb-2 flex items-center gap-2">
          <Video className="h-4 w-4 text-accent" />
          Upload Image or Video (Optional)
        </Label>
        <p className="mb-4 text-xs text-muted-foreground">
          Attach a short video or picture relating to your testimony. Max size 10MB.
        </p>
        <div className="flex items-center gap-4">
          <Button type="button" variant="outline" className="relative cursor-pointer">
            <UploadCloud className="mr-2 h-4 w-4" />
            {file ? 'Change File' : 'Choose File'}
            <input
              type="file"
              accept="image/*,video/*"
              className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
              onChange={handleFileChange}
            />
          </Button>
          {file && (
            <span className="max-w-[200px] truncate text-sm font-medium text-primary">
              {file.name}
            </span>
          )}
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">
          {error}
        </div>
      )}

      <Button
        type="submit"
        disabled={loading}
        className="mt-4 h-14 w-full bg-accent text-lg font-bold text-primary shadow-lg shadow-accent/20 hover:bg-accent/90"
      >
        {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Submit Testimony'}
      </Button>
    </form>
  )
}
