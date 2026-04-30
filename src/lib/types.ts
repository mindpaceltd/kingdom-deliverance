export type UserRole = 'admin' | 'editor' | 'author' | 'member'

export interface Profile {
  id: string
  name: string | null
  avatar_url: string | null
  role: UserRole
  phone: string | null
  bio: string | null
  created_at: string
  updated_at: string
}

export interface Post {
  id: string
  title: string
  slug: string
  content: string | null
  excerpt: string | null
  featured_image: string | null
  author_id: string | null
  type: 'blog' | 'news'
  // Extended status union
  status: 'draft' | 'published' | 'archived' | 'scheduled' | 'trash'
  published_at: string | null
  created_at: string
  updated_at: string
  // New CMS fields
  meta_title: string | null
  meta_description: string | null
  focus_keyword: string | null
  seo_score: number
  scheduled_at: string | null
  deleted_at: string | null
  views: number
  // Joined relation
  profiles?: Pick<Profile, 'name' | 'avatar_url'>
  tags?: Tag[]
}

export interface Sermon {
  id: string
  title: string
  slug: string
  description: string | null
  content: string | null
  video_url: string | null
  audio_url: string | null
  thumbnail_url: string | null
  featured_image_alt: string | null
  preacher: string
  series: string | null
  series_id: string | null
  date: string
  duration_minutes: number | null
  status: 'draft' | 'published' | 'scheduled' | 'trash' | 'archived'
  meta_title: string | null
  meta_description: string | null
  focus_keyword: string | null
  seo_score: number
  views: number
  published_at: string | null
  scheduled_at: string | null
  deleted_at: string | null
  created_at: string
  updated_at: string
  // Relations
  sermon_series?: SermonSeries
}

export interface SermonSeries {
  id: string
  name: string
  slug: string
  description: string | null
  image_url: string | null
  created_at: string
  updated_at: string
}

export interface Event {
  id: string
  title: string
  slug: string
  description: string | null
  content: string | null
  date: string
  end_date: string | null
  location: string | null
  image_url: string | null
  is_featured: boolean
  registration_url: string | null
  status: 'upcoming' | 'ongoing' | 'past' | 'cancelled'
  created_at: string
  updated_at: string
}

export interface Ministry {
  id: string
  name: string
  slug: string
  description: string | null
  content: string | null
  leader: string | null
  meeting_time: string | null
  image_url: string | null
  icon: string | null
  display_order: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface MediaAsset {
  id: string
  filename: string
  url: string
  type: 'image' | 'video' | 'audio' | 'document'
  mime_type: string | null
  size_bytes: number | null
  alt_text: string | null
  caption: string | null
  uploaded_by: string | null
  bucket: string
  created_at: string
}

export interface SiteSetting {
  key: string
  value: string | null
  updated_at: string
}

export interface CmsPage {
  id: string
  title: string
  slug: string
  content_json: Record<string, unknown>
  status: 'draft' | 'published'
  updated_at: string
  created_at: string
}

export interface GalleryItem {
  id: string
  title: string | null
  description: string | null
  image_url: string
  album: string
  display_order: number
  created_at: string
}

export interface Donation {
  id: string
  donor_name: string | null
  donor_email: string | null
  amount: number
  currency: string
  method: string | null
  reference: string | null
  notes: string | null
  is_anonymous: boolean
  status: string
  created_at: string
}

export interface PrayerRequest {
  id: string
  name: string | null
  email: string | null
  request: string
  is_anonymous: boolean
  is_reviewed: boolean
  created_at: string
}

export interface SermonData {
  title: string
  slug: string
  description?: string
  content?: string
  video_url?: string
  audio_url?: string
  thumbnail_url?: string
  featured_image_alt?: string
  preacher: string
  series?: string
  series_id?: string | null
  date: string
  duration_minutes?: number
  status: 'draft' | 'published' | 'scheduled'
  scheduled_at?: string
  meta_title?: string
  meta_description?: string
  focus_keyword?: string
  seo_score?: number
}

export interface PostData {
  title: string
  slug: string
  content?: string
  excerpt?: string
  featured_image?: string
  type: 'blog' | 'news'
  // Extended status (trash/archived set by dedicated actions only)
  status: 'draft' | 'published' | 'scheduled'
  // New optional SEO + scheduling fields
  meta_title?: string
  meta_description?: string
  focus_keyword?: string
  seo_score?: number
  scheduled_at?: string  // ISO string; only used when status = 'scheduled'
  tag_ids?: string[]     // UUIDs of tags to associate with the post
}


export interface Tag {
  id: string
  name: string
  slug: string
  created_at: string
}

export interface ContactSubmission {
  id: string
  name: string
  email: string
  phone: string | null
  subject: string | null
  message: string
  is_read: boolean
  created_at: string
}
