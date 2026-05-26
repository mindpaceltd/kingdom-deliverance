'use client'

import * as React from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { updateProfile, updatePassword, saveAvatarUrl, uploadAvatarAction } from '@/lib/actions/profile'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PasswordInput } from '@/components/ui/password-input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import {
  CameraIcon,
  SaveIcon,
  KeyIcon,
  LoaderIcon,
  CheckCircleIcon,
  AlertCircleIcon,
  UserIcon,
} from 'lucide-react'
import type { Profile } from '@/lib/types'

interface ProfileFormProps {
  profile: Profile
  email: string
}

export function ProfileForm({ profile, email }: ProfileFormProps) {
  const router = useRouter()

  // Profile fields
  const [name, setName] = React.useState(profile.name ?? '')
  const [phone, setPhone] = React.useState(profile.phone ?? '')
  const [bio, setBio] = React.useState(profile.bio ?? '')
  const [avatarUrl, setAvatarUrl] = React.useState(profile.avatar_url ?? '')

  // UI state
  const [profileSaving, setProfileSaving] = React.useState(false)
  const [profileMsg, setProfileMsg] = React.useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Password fields
  const [newPassword, setNewPassword] = React.useState('')
  const [confirmPassword, setConfirmPassword] = React.useState('')
  const [passwordSaving, setPasswordSaving] = React.useState(false)
  const [passwordMsg, setPasswordMsg] = React.useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Avatar upload
  const [avatarUploading, setAvatarUploading] = React.useState(false)
  const avatarInputRef = React.useRef<HTMLInputElement>(null)

  // ---------------------------------------------------------------------------
  // Avatar upload
  // ---------------------------------------------------------------------------

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setAvatarUploading(true)
    setProfileMsg(null)

    const formData = new FormData()
    formData.append('file', file)

    const result = await uploadAvatarAction(formData)
    if ('error' in result) {
      setProfileMsg({ type: 'error', text: result.error })
    } else {
      setAvatarUrl(result.url)
      setProfileMsg({ type: 'success', text: 'Avatar updated successfully.' })
      router.refresh()
    }

    setAvatarUploading(false)
    e.target.value = ''
  }

  // ---------------------------------------------------------------------------
  // Save profile
  // ---------------------------------------------------------------------------

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault()
    setProfileMsg(null)
    setProfileSaving(true)

    const result = await updateProfile({ name, phone, bio, avatar_url: avatarUrl })
    setProfileSaving(false)

    if ('error' in result) {
      setProfileMsg({ type: 'error', text: result.error })
    } else {
      setProfileMsg({ type: 'success', text: 'Profile saved successfully.' })
      router.refresh()
    }
  }

  // ---------------------------------------------------------------------------
  // Change password
  // ---------------------------------------------------------------------------

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault()
    setPasswordMsg(null)

    if (newPassword.length < 8) {
      setPasswordMsg({ type: 'error', text: 'Password must be at least 8 characters.' })
      return
    }
    if (newPassword !== confirmPassword) {
      setPasswordMsg({ type: 'error', text: 'Passwords do not match.' })
      return
    }

    setPasswordSaving(true)
    const result = await updatePassword(newPassword)
    setPasswordSaving(false)

    if ('error' in result) {
      setPasswordMsg({ type: 'error', text: result.error })
    } else {
      setPasswordMsg({ type: 'success', text: 'Password changed successfully.' })
      setNewPassword('')
      setConfirmPassword('')
    }
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  const initials = (name || email)
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  return (
    <div className="space-y-8 max-w-2xl">

      {/* ------------------------------------------------------------------ */}
      {/* Avatar + basic info                                                  */}
      {/* ------------------------------------------------------------------ */}
      <div className="rounded-xl border border-border bg-card p-6 space-y-6">
        <h2 className="text-base font-semibold">Profile Information</h2>

        {/* Avatar */}
        <div className="flex items-center gap-5">
          <div className="relative">
            <div className="size-20 rounded-full overflow-hidden border-2 border-border bg-muted flex items-center justify-center">
              {avatarUrl ? (
                <Image
                  src={avatarUrl}
                  alt={name || 'Avatar'}
                  fill
                  sizes="80px"
                  className="object-cover"
                  unoptimized
                />
              ) : (
                <span className="text-xl font-semibold text-muted-foreground">{initials}</span>
              )}
            </div>
            {/* Upload overlay */}
            <button
              type="button"
              onClick={() => avatarInputRef.current?.click()}
              disabled={avatarUploading}
              className="absolute -bottom-1 -right-1 size-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-md hover:bg-primary/90 transition-colors disabled:opacity-50"
              title="Change avatar"
            >
              {avatarUploading ? (
                <LoaderIcon className="size-3.5 animate-spin" />
              ) : (
                <CameraIcon className="size-3.5" />
              )}
            </button>
            <input
              ref={avatarInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="sr-only"
              onChange={handleAvatarChange}
            />
          </div>
          <div>
            <p className="text-sm font-medium">{name || 'No name set'}</p>
            <p className="text-xs text-muted-foreground">{email}</p>
            <p className="text-xs text-muted-foreground capitalize mt-0.5">
              Role: <span className="font-medium text-foreground">{profile.role}</span>
            </p>
          </div>
        </div>

        {/* Profile form */}
        <form onSubmit={handleSaveProfile} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="profile-name">Full Name</Label>
              <Input
                id="profile-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your full name"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="profile-phone">Phone</Label>
              <Input
                id="profile-phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+256 700 000 000"
                type="tel"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="profile-email">Email</Label>
            <Input
              id="profile-email"
              value={email}
              disabled
              className="bg-muted/50 cursor-not-allowed"
            />
            <p className="text-xs text-muted-foreground">Email cannot be changed here.</p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="profile-bio">Bio</Label>
            <Textarea
              id="profile-bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="A short bio about yourself…"
              rows={3}
              className="resize-none"
            />
          </div>

          {/* Status message */}
          {profileMsg && (
            <div className={cn(
              'flex items-center gap-2 rounded-md px-3 py-2 text-sm',
              profileMsg.type === 'success'
                ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400'
                : 'bg-destructive/10 text-destructive'
            )}>
              {profileMsg.type === 'success'
                ? <CheckCircleIcon className="size-4 shrink-0" />
                : <AlertCircleIcon className="size-4 shrink-0" />}
              {profileMsg.text}
            </div>
          )}

          <Button type="submit" disabled={profileSaving} className="gap-1.5">
            {profileSaving ? <LoaderIcon className="size-4 animate-spin" /> : <SaveIcon className="size-4" />}
            {profileSaving ? 'Saving…' : 'Save Profile'}
          </Button>
        </form>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Change password                                                      */}
      {/* ------------------------------------------------------------------ */}
      <div className="rounded-xl border border-border bg-card p-6 space-y-4">
        <div className="flex items-center gap-2">
          <KeyIcon className="size-4 text-muted-foreground" />
          <h2 className="text-base font-semibold">Change Password</h2>
        </div>

        <form onSubmit={handleChangePassword} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="new-password">New Password</Label>
              <PasswordInput
                id="new-password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Min. 8 characters"
                autoComplete="new-password"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="confirm-password">Confirm Password</Label>
              <PasswordInput
                id="confirm-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repeat new password"
                autoComplete="new-password"
              />
            </div>
          </div>

          {passwordMsg && (
            <div className={cn(
              'flex items-center gap-2 rounded-md px-3 py-2 text-sm',
              passwordMsg.type === 'success'
                ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400'
                : 'bg-destructive/10 text-destructive'
            )}>
              {passwordMsg.type === 'success'
                ? <CheckCircleIcon className="size-4 shrink-0" />
                : <AlertCircleIcon className="size-4 shrink-0" />}
              {passwordMsg.text}
            </div>
          )}

          <Button type="submit" variant="outline" disabled={passwordSaving} className="gap-1.5">
            {passwordSaving ? <LoaderIcon className="size-4 animate-spin" /> : <KeyIcon className="size-4" />}
            {passwordSaving ? 'Updating…' : 'Update Password'}
          </Button>
        </form>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Account info                                                         */}
      {/* ------------------------------------------------------------------ */}
      <div className="rounded-xl border border-border bg-card p-6 space-y-3">
        <div className="flex items-center gap-2">
          <UserIcon className="size-4 text-muted-foreground" />
          <h2 className="text-base font-semibold">Account</h2>
        </div>
        <div className="text-sm text-muted-foreground space-y-1">
          <p>User ID: <span className="font-mono text-xs">{profile.id}</span></p>
          <p>Member since: {new Date(profile.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
        </div>
      </div>
    </div>
  )
}
