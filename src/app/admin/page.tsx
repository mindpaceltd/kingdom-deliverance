import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Users, FileText, Video, Calendar, MessageSquare,
  Heart, Image as ImageIcon, BookOpen, TrendingUp, CheckCircle, AlertCircle,
} from "lucide-react"
import { format, subMonths, startOfMonth, endOfMonth } from "date-fns"
import { ActivityChart } from "@/components/admin/dashboard/activity-chart"
import Link from "next/link"

export default async function AdminDashboard() {
  const supabase = createClient()

  // Fetch all counts and recent data in parallel
  const [
    postsRes, sermonsRes, eventsRes, profilesRes,
    ministriesRes, galleryRes, mediaRes,
    prayerRes, contactRes,
    recentPostsRes, recentSermonsRes, upcomingEventsRes,
    recentPrayerRes, recentContactRes,
  ] = await Promise.all([
    supabase.from("posts").select("id", { count: "exact", head: true }).not("status", "in", '("trash","archived")'),
    supabase.from("sermons").select("id", { count: "exact", head: true }).not("status", "in", '("trash")'),
    supabase.from("events").select("id", { count: "exact", head: true }).eq("status", "upcoming"),
    supabase.from("profiles").select("id", { count: "exact", head: true }),
    supabase.from("ministries").select("id", { count: "exact", head: true }).eq("is_active", true),
    supabase.from("gallery").select("id", { count: "exact", head: true }),
    supabase.from("media").select("id", { count: "exact", head: true }),
    supabase.from("prayer_requests").select("id", { count: "exact", head: true }).eq("is_reviewed", false),
    supabase.from("contact_submissions").select("id", { count: "exact", head: true }).eq("is_read", false),
    supabase.from("posts").select("id, title, status, published_at, type").not("status", "in", '("trash","archived")').order("updated_at", { ascending: false }).limit(5),
    supabase.from("sermons").select("id, title, preacher, date, video_url, status").neq("status", "trash").order("date", { ascending: false }).limit(5),
    supabase.from("events").select("id, title, date, location, status").eq("status", "upcoming").order("date", { ascending: true }).limit(5),
    supabase.from("prayer_requests").select("id, name, request, is_anonymous, created_at").eq("is_reviewed", false).order("created_at", { ascending: false }).limit(3),
    supabase.from("contact_submissions").select("id, name, email, subject, created_at").eq("is_read", false).order("created_at", { ascending: false }).limit(3),
  ])

  // Build 6-month activity chart data
  const now = new Date()
  const monthlyData = await Promise.all(
    Array.from({ length: 6 }, (_, i) => {
      const d = subMonths(now, 5 - i)
      const from = startOfMonth(d).toISOString()
      const to = endOfMonth(d).toISOString()
      const label = format(d, "MMM")
      return Promise.all([
        supabase.from("posts").select("id", { count: "exact", head: true }).gte("created_at", from).lte("created_at", to),
        supabase.from("sermons").select("id", { count: "exact", head: true }).gte("created_at", from).lte("created_at", to),
        supabase.from("events").select("id", { count: "exact", head: true }).gte("created_at", from).lte("created_at", to),
      ]).then(([p, s, e]) => ({
        month: label,
        posts: p.count ?? 0,
        sermons: s.count ?? 0,
        events: e.count ?? 0,
      }))
    })
  )

  const stats = {
    posts: postsRes.count ?? 0,
    sermons: sermonsRes.count ?? 0,
    events: eventsRes.count ?? 0,
    users: profilesRes.count ?? 0,
    ministries: ministriesRes.count ?? 0,
    gallery: galleryRes.count ?? 0,
    media: mediaRes.count ?? 0,
    unreadPrayer: prayerRes.count ?? 0,
    unreadContact: contactRes.count ?? 0,
  }

  const recentPosts = recentPostsRes.data ?? []
  const recentSermons = recentSermonsRes.data ?? []
  const upcomingEvents = upcomingEventsRes.data ?? []
  const recentPrayer = recentPrayerRes.data ?? []
  const recentContact = recentContactRes.data ?? []
  const totalInbox = stats.unreadPrayer + stats.unreadContact

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Command Center</h1>
          <p className="text-sm text-gray-500 mt-1">
            {format(new Date(), "EEEE, MMMM d, yyyy")} · Kingdom Deliverance Centre Uganda
          </p>
        </div>
        {totalInbox > 0 && (
          <Link href="/admin/inbox">
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-100 transition-colors">
              <AlertCircle className="w-4 h-4" />
              {totalInbox} unread message{totalInbox !== 1 ? "s" : ""} in inbox
            </div>
          </Link>
        )}
      </div>

      {/* Primary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard title="Posts & Blogs" value={stats.posts} icon={<FileText className="w-5 h-5" />} color="indigo" href="/admin/posts" />
        <StatCard title="Sermons" value={stats.sermons} icon={<Video className="w-5 h-5" />} color="amber" href="/admin/sermons" />
        <StatCard title="Upcoming Events" value={stats.events} icon={<Calendar className="w-5 h-5" />} color="emerald" href="/admin/events" />
        <StatCard title="Registered Users" value={stats.users} icon={<Users className="w-5 h-5" />} color="purple" href="/admin/users" />
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <MiniStatCard title="Ministries" value={stats.ministries} icon={<BookOpen className="w-4 h-4" />} href="/admin/ministries" />
        <MiniStatCard title="Gallery Items" value={stats.gallery} icon={<ImageIcon className="w-4 h-4" />} href="/admin/gallery" />
        <MiniStatCard title="Media Files" value={stats.media} icon={<TrendingUp className="w-4 h-4" />} href="/admin/media" />
        <MiniStatCard title="Prayer Requests" value={stats.unreadPrayer} icon={<Heart className="w-4 h-4" />} href="/admin/inbox" alert={stats.unreadPrayer > 0} />
        <MiniStatCard title="Unread Messages" value={stats.unreadContact} icon={<MessageSquare className="w-4 h-4" />} href="/admin/inbox" alert={stats.unreadContact > 0} />
      </div>

      {/* Activity Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">Content Activity — Last 6 Months</CardTitle>
        </CardHeader>
        <CardContent>
          <ActivityChart data={monthlyData} />
        </CardContent>
      </Card>

      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Posts */}
        <Card className="lg:col-span-1">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-sm font-semibold">Recent Posts</CardTitle>
            <Link href="/admin/posts" className="text-xs text-indigo-600 hover:underline">View all</Link>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentPosts.length === 0 ? (
              <p className="text-sm text-gray-400">No posts yet.</p>
            ) : recentPosts.map((post) => (
              <div key={post.id} className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{post.title}</p>
                  <p className="text-xs text-gray-400">
                    {post.published_at ? format(new Date(post.published_at), "MMM d, yyyy") : "Draft"}
                  </p>
                </div>
                <StatusPill status={post.status} />
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Recent Sermons */}
        <Card className="lg:col-span-1">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-sm font-semibold">Recent Sermons</CardTitle>
            <Link href="/admin/sermons" className="text-xs text-amber-600 hover:underline">View all</Link>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentSermons.length === 0 ? (
              <p className="text-sm text-gray-400">No sermons yet.</p>
            ) : recentSermons.map((sermon) => (
              <div key={sermon.id} className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{sermon.title}</p>
                  <p className="text-xs text-gray-400">
                    {sermon.preacher} · {format(new Date(sermon.date), "MMM d, yyyy")}
                  </p>
                </div>
                {sermon.video_url && (
                  <span className="shrink-0 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">Video</span>
                )}
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Upcoming Events */}
        <Card className="lg:col-span-1">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-sm font-semibold">Upcoming Events</CardTitle>
            <Link href="/admin/events" className="text-xs text-emerald-600 hover:underline">View all</Link>
          </CardHeader>
          <CardContent className="space-y-3">
            {upcomingEvents.length === 0 ? (
              <p className="text-sm text-gray-400">No upcoming events.</p>
            ) : upcomingEvents.map((event) => (
              <div key={event.id} className="flex items-start gap-3">
                <div className="shrink-0 w-10 text-center">
                  <p className="text-xs text-gray-400">{format(new Date(event.date), "MMM")}</p>
                  <p className="text-lg font-bold text-emerald-600 leading-none">{format(new Date(event.date), "d")}</p>
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{event.title}</p>
                  {event.location && <p className="text-xs text-gray-400 truncate">{event.location}</p>}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Inbox Preview */}
      {(recentPrayer.length > 0 || recentContact.length > 0) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Prayer Requests */}
          {recentPrayer.length > 0 && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Heart className="w-4 h-4 text-red-500" />
                  Unreviewed Prayer Requests
                </CardTitle>
                <Link href="/admin/inbox" className="text-xs text-red-600 hover:underline">View all</Link>
              </CardHeader>
              <CardContent className="space-y-3">
                {recentPrayer.map((p) => (
                  <div key={p.id} className="border-l-2 border-red-200 pl-3">
                    <p className="text-xs font-medium text-gray-600">
                      {p.is_anonymous ? "Anonymous" : (p.name || "Unknown")} · {format(new Date(p.created_at), "MMM d")}
                    </p>
                    <p className="text-sm text-gray-700 line-clamp-2">{p.request}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Contact Messages */}
          {recentContact.length > 0 && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-blue-500" />
                  Unread Contact Messages
                </CardTitle>
                <Link href="/admin/inbox" className="text-xs text-blue-600 hover:underline">View all</Link>
              </CardHeader>
              <CardContent className="space-y-3">
                {recentContact.map((c) => (
                  <div key={c.id} className="border-l-2 border-blue-200 pl-3">
                    <p className="text-xs font-medium text-gray-600">
                      {c.name} · {c.email} · {format(new Date(c.created_at), "MMM d")}
                    </p>
                    <p className="text-sm text-gray-700 truncate">{c.subject || "No subject"}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* System Status */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">System Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <SystemStatus label="Supabase Database" status="operational" />
            <SystemStatus label="Authentication" status="operational" />
            <SystemStatus label="Media Storage" status="operational" />
            <SystemStatus label="Public Website" status="operational" />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function StatCard({ title, value, icon, color, href }: {
  title: string; value: number; icon: React.ReactNode
  color: "indigo" | "amber" | "emerald" | "purple"; href: string
}) {
  const colors = {
    indigo: "bg-indigo-50 text-indigo-600 border-indigo-100",
    amber: "bg-amber-50 text-amber-600 border-amber-100",
    emerald: "bg-emerald-50 text-emerald-600 border-emerald-100",
    purple: "bg-purple-50 text-purple-600 border-purple-100",
  }
  return (
    <Link href={href}>
      <Card className={`border ${colors[color]} hover:shadow-md transition-shadow cursor-pointer`}>
        <CardContent className="pt-5 pb-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">{title}</span>
            <div className={`p-1.5 rounded-lg ${colors[color]}`}>{icon}</div>
          </div>
          <p className="text-3xl font-bold text-gray-900">{value.toLocaleString()}</p>
        </CardContent>
      </Card>
    </Link>
  )
}

function MiniStatCard({ title, value, icon, href, alert }: {
  title: string; value: number; icon: React.ReactNode; href: string; alert?: boolean
}) {
  return (
    <Link href={href}>
      <Card className={`hover:shadow-md transition-shadow cursor-pointer ${alert && value > 0 ? "border-red-200 bg-red-50" : ""}`}>
        <CardContent className="pt-4 pb-3">
          <div className="flex items-center gap-2 mb-1">
            <span className={alert && value > 0 ? "text-red-500" : "text-gray-400"}>{icon}</span>
            <span className="text-xs text-gray-500 truncate">{title}</span>
          </div>
          <p className={`text-2xl font-bold ${alert && value > 0 ? "text-red-600" : "text-gray-900"}`}>
            {value.toLocaleString()}
          </p>
        </CardContent>
      </Card>
    </Link>
  )
}

function StatusPill({ status }: { status: string }) {
  const map: Record<string, string> = {
    published: "bg-green-100 text-green-700",
    draft: "bg-yellow-100 text-yellow-700",
    scheduled: "bg-blue-100 text-blue-700",
    trash: "bg-red-100 text-red-700",
    archived: "bg-gray-100 text-gray-500",
  }
  return (
    <span className={`shrink-0 text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full font-bold ${map[status] ?? "bg-gray-100 text-gray-500"}`}>
      {status}
    </span>
  )
}

function SystemStatus({ label, status }: { label: string; status: "operational" | "degraded" | "down" }) {
  return (
    <div className="flex items-center gap-2">
      <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
      <div>
        <p className="text-xs font-medium text-gray-700">{label}</p>
        <p className="text-xs text-emerald-600 capitalize">{status}</p>
      </div>
    </div>
  )
}
