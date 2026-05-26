'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PasswordInput } from '@/components/ui/password-input'
import { Label } from '@/components/ui/label'
import { createBrowserClient } from '@supabase/ssr'
import { Loader2, Check } from 'lucide-react'

export default function ProfilePage() {
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', phone: '' })
  const [passwordForm, setPasswordForm] = useState({ current: '', new: '', confirm: '' })
  const [error, setError] = useState('')

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setForm({
          name: user.user_metadata?.full_name || '',
          email: user.email || '',
          phone: user.user_metadata?.phone || '',
        })
      }
    })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSaved(false)

    const { error } = await supabase.auth.updateUser({
      data: { full_name: form.name, phone: form.phone },
    })

    if (error) {
      setError(error.message)
    } else {
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    }
    setLoading(false)
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (passwordForm.new !== passwordForm.confirm) {
      setError('Passwords do not match')
      return
    }
    setLoading(true)
    setError('')

    const { error } = await supabase.auth.updateUser({
      password: passwordForm.new,
    })

    if (error) {
      setError(error.message)
    } else {
      setSaved(true)
      setPasswordForm({ current: '', new: '', confirm: '' })
      setTimeout(() => setSaved(false), 3000)
    }
    setLoading(false)
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-black text-gray-900">Profile</h1>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}
      {saved && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-center gap-2">
          <Check className="w-4 h-4 text-green-600" />
          <p className="text-sm text-green-700">Saved successfully!</p>
        </div>
      )}

      <form onSubmit={handleSaveProfile} className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-4">
        <h3 className="font-bold text-sm text-gray-900">Account Details</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-sm font-semibold">Full Name</Label>
            <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm font-semibold">Email</Label>
            <Input value={form.email} disabled className="bg-gray-50" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm font-semibold">Phone</Label>
            <Input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="+256..." />
          </div>
        </div>
        <Button type="submit" disabled={loading} className="bg-[#1e3a5f] hover:bg-[#162d4a]">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Changes'}
        </Button>
      </form>

      <form onSubmit={handleChangePassword} className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-4">
        <h3 className="font-bold text-sm text-gray-900">Change Password</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-sm font-semibold">New Password</Label>
            <PasswordInput
              minLength={6}
              required
              value={passwordForm.new}
              onChange={e => setPasswordForm({ ...passwordForm, new: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm font-semibold">Confirm Password</Label>
            <PasswordInput
              minLength={6}
              required
              value={passwordForm.confirm}
              onChange={e => setPasswordForm({ ...passwordForm, confirm: e.target.value })}
            />
          </div>
        </div>
        <Button type="submit" disabled={loading} variant="outline">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Update Password'}
        </Button>
      </form>
    </div>
  )
}
