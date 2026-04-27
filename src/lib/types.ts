export type UserRole = 'admin' | 'editor' | 'author' | 'member';

export interface UserProfile {
  id: string;
  name: string | null;
  email: string;
  role: UserRole;
  created_at: string;
}

export interface Post {
  id: string;
  title: string;
  slug: string;
  content: string;
  author_id: string;
  type: 'blog' | 'news';
  status: 'draft' | 'published' | 'archived';
  featured_image: string | null;
  created_at: string;
  updated_at: string;
  users?: { name: string | null };
}

export interface Sermon {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  video_url: string | null;
  audio_url: string | null;
  preacher: string;
  date: string;
  created_at: string;
}

export interface Event {
  id: string;
  title: string;
  description: string | null;
  date: string;
  end_date: string | null;
  location: string | null;
  image_url: string | null;
  created_at: string;
}

export interface Ministry {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  leader: string | null;
  image_url: string | null;
  created_at: string;
}
