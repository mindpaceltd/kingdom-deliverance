import Link from 'next/link'
import type { Metadata } from 'next'
import { searchContent } from '@/lib/supabase/queries'

export const metadata: Metadata = {
  title: 'Search',
  description: 'Search sermons, posts, and events at Kingdom Deliverance Centre Uganda.',
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: { q?: string }
}) {
  const q = searchParams.q?.trim() ?? ''
  const results = q.length >= 2 ? await searchContent(q) : { posts: [], sermons: [], events: [] }
  const total = results.posts.length + results.sermons.length + results.events.length

  return (
    <div className="container px-4 py-16">
      <h1 className="font-serif text-4xl font-bold text-primary">Search</h1>
      <form className="mt-6">
        <input
          name="q"
          defaultValue={q}
          placeholder="Search sermons, posts, events..."
          className="h-11 w-full max-w-2xl rounded-md border px-3 text-sm"
        />
      </form>

      {q.length < 2 ? (
        <p className="mt-6 text-sm text-muted-foreground">Type at least 2 characters to search.</p>
      ) : total === 0 ? (
        <p className="mt-6 text-sm text-muted-foreground">No results found for &quot;{q}&quot;.</p>
      ) : (
        <div className="mt-8 space-y-8">
          <ResultSection title="Sermons" items={results.sermons.map((s) => ({ id: s.id, title: s.title, href: `/sermons/${s.slug}` }))} />
          <ResultSection title="Posts" items={results.posts.map((p) => ({ id: p.id, title: p.title, href: `/blog/${p.slug}` }))} />
          <ResultSection title="Events" items={results.events.map((e) => ({ id: e.id, title: e.title, href: `/events/${e.slug}` }))} />
        </div>
      )}
    </div>
  )
}

function ResultSection({
  title,
  items,
}: {
  title: string
  items: { id: string; title: string; href: string }[]
}) {
  if (items.length === 0) return null
  return (
    <section>
      <h2 className="mb-3 text-lg font-semibold">{title}</h2>
      <ul className="space-y-2">
        {items.map((item) => (
          <li key={item.id}>
            <Link href={item.href} className="text-sm text-primary hover:underline">
              {item.title}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}
