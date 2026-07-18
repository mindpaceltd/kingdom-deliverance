import { notFound } from 'next/navigation'
import { PlatformAccountDetail } from '@/components/admin/digital-ministry/platform-account-detail'
import type { DmPlatform } from '@/lib/digital-ministry/types'

const ALLOWED: DmPlatform[] = [
  'threads',
  'pinterest',
  'whatsapp',
  'telegram',
  'rss',
  'website',
  'email',
  'google_business',
]

export default function Page({ params }: { params: { platform: string } }) {
  const platform = params.platform as DmPlatform
  if (!ALLOWED.includes(platform)) notFound()
  return <PlatformAccountDetail platform={platform} />
}
