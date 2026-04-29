import Image from 'next/image'
import Link from 'next/link'
import { Calendar, User } from 'lucide-react'
import { format } from 'date-fns'
import type { Post } from '@/lib/types'

interface PostCardProps {
  post: Post
}

export function PostCard({ post }: PostCardProps) {
  const formattedDate = post.published_at
    ? format(new Date(post.published_at), 'MMM d, yyyy')
    : null

  return (
    <Link
      href={`/blog/${post.slug}`}
      className="group block bg-white rounded-2xl overflow-hidden border border-gray-100 shadow hover:shadow-lg transition-all hover:-translate-y-1"
    >
      {/* Featured image */}
      <div className="relative aspect-video bg-gradient-to-br from-primary/10 to-accent/10 overflow-hidden">
        {post.featured_image ? (
          <Image
            src={post.featured_image}
            alt={post.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-4xl font-serif font-bold text-primary/10">
              {post.title[0]}
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-5 space-y-3">
        <span className="text-xs text-accent font-semibold uppercase tracking-wider">
          {post.type}
        </span>
        <h3 className="font-serif text-lg font-bold text-primary group-hover:text-accent transition-colors line-clamp-2">
          {post.title}
        </h3>
        {post.excerpt && (
          <p className="text-sm text-primary/70 line-clamp-2 leading-relaxed">
            {post.excerpt}
          </p>
        )}
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          {post.profiles?.name && (
            <span className="flex items-center gap-1">
              <User className="w-3 h-3" />
              {post.profiles.name}
            </span>
          )}
          {formattedDate && (
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {formattedDate}
            </span>
          )}
        </div>
      </div>
    </Link>
  )
}
