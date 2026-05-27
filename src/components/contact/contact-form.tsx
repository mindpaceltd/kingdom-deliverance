'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { CheckCircle, Loader2 } from 'lucide-react'
import type { ResolvedContactPage } from '@/lib/cms/contact-page-data'

type ContactFormProps = Pick<
  ResolvedContactPage,
  'formTitle' | 'formSuccessTitle' | 'formSuccessMessage' | 'submitButtonLabel'
>

export function ContactForm({
  formTitle,
  formSuccessTitle,
  formSuccessMessage,
  submitButtonLabel,
}: ContactFormProps) {
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
  })
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { submitContactForm } = await import('@/lib/actions/forms')
    const result = await submitContactForm(form)

    if (result.error) {
      setError(result.error)
    } else {
      setSuccess(true)
      setForm({ name: '', email: '', phone: '', subject: '', message: '' })
    }
    setLoading(false)
  }

  return (
    <div>
      <h2 className="font-serif text-3xl font-bold text-primary mb-6">{formTitle}</h2>
      {success ? (
        <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
          <CheckCircle className="w-16 h-16 text-green-500" />
          <h3 className="font-serif text-2xl font-bold text-primary">{formSuccessTitle}</h3>
          <p className="text-primary/70">{formSuccessMessage}</p>
          <Button
            onClick={() => setSuccess(false)}
            variant="outline"
            className="border-primary text-primary mt-4"
          >
            Send Another Message
          </Button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="space-y-2">
              <Label htmlFor="contact-name">Full Name *</Label>
              <Input
                id="contact-name"
                placeholder="John Doe"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contact-email">Email *</Label>
              <Input
                id="contact-email"
                type="email"
                placeholder="john@example.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="contact-phone">Phone (optional)</Label>
            <Input
              id="contact-phone"
              placeholder="+256 700 000 000"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="contact-subject">Subject *</Label>
            <Input
              id="contact-subject"
              placeholder="How can we help?"
              value={form.subject}
              onChange={(e) => setForm({ ...form, subject: e.target.value })}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="contact-message">Message *</Label>
            <Textarea
              id="contact-message"
              placeholder="Write your message here..."
              rows={6}
              value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
              required
            />
          </div>
          {error && (
            <div className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg px-4 py-3">
              {error}
            </div>
          )}
          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-accent text-primary hover:bg-accent/90 h-12 font-semibold text-base"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Sending...
              </>
            ) : (
              submitButtonLabel
            )}
          </Button>
        </form>
      )}
    </div>
  )
}
