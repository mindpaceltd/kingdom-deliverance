'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createBrowserClient } from '@supabase/ssr'
import { User, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function AccountLoginPage() {
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [form, setForm] = useState({ email: '', password: '', name: '' })
  const router = useRouter()

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error } = await supabase.auth.signInWithPassword({
      email: form.email,
      password: form.password,
    })

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      router.push('/account')
      router.refresh()
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        data: { full_name: form.name },
      },
    })

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      setSuccess('Account created! Check your email to confirm, then log in.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-32 pb-20">
      <div className="container px-4 mx-auto max-w-md">
        <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm">
          <div className="flex items-center justify-center mb-6">
            <div className="w-12 h-12 rounded-full bg-[#1e3a5f]/10 flex items-center justify-center">
              <User className="w-6 h-6 text-[#1e3a5f]" />
            </div>
          </div>

          <h1 className="text-xl font-black text-gray-900 text-center mb-1">
            {mode === 'login' ? 'Sign In' : 'Create Account'}
          </h1>
          <p className="text-sm text-gray-400 text-center mb-6">
            {mode === 'login' ? 'Access your orders and downloads' : 'Track orders and manage downloads'}
          </p>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}
          {success && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
              <p className="text-sm text-green-700">{success}</p>
            </div>
          )}

          <form onSubmit={mode === 'login' ? handleLogin : handleRegister} className="space-y-4">
            {mode === 'register' && (
              <div className="space-y-1.5">
                <Label className="text-sm font-semibold">Full Name</Label>
                <Input
                  required
                  placeholder="John Doe"
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                />
              </div>
            )}
            <div className="space-y-1.5">
              <Label className="text-sm font-semibold">Email</Label>
              <Input
                type="email"
                required
                placeholder="you@example.com"
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-semibold">Password</Label>
              <Input
                type="password"
                required
                minLength={6}
                placeholder="••••••••"
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
              />
            </div>

            <Button type="submit" disabled={loading} className="w-full h-11 bg-[#1e3a5f] hover:bg-[#162d4a] font-bold">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : mode === 'login' ? 'Sign In' : 'Create Account'}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); setSuccess('') }}
              className="text-sm text-[#1e3a5f] hover:underline font-medium"
            >
              {mode === 'login' ? "Don't have an account? Create one" : 'Already have an account? Sign in'}
            </button>
          </div>

          <div className="mt-4 pt-4 border-t border-gray-100 text-center">
            <a href="/account/guest" className="text-xs text-gray-400 hover:text-gray-600">
              Looking up a guest order? Click here
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
