import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, FileText, Video, Calendar } from "lucide-react";
import { format } from "date-fns";

export default async function AdminDashboard() {
  const supabase = createClient();

  // Fetch live counts in parallel
  const [postsRes, sermonsRes, eventsRes, profilesRes, recentPostsRes, recentSermonsRes] =
    await Promise.all([
      supabase
        .from("posts")
        .select("id", { count: "exact", head: true })
        .neq("status", "archived"),
      supabase
        .from("sermons")
        .select("id", { count: "exact", head: true }),
      supabase
        .from("events")
        .select("id", { count: "exact", head: true })
        .eq("status", "upcoming"),
      supabase
        .from("profiles")
        .select("id", { count: "exact", head: true }),
      supabase
        .from("posts")
        .select("id, title, status, published_at")
        .neq("status", "archived")
        .order("updated_at", { ascending: false })
        .limit(3),
      supabase
        .from("sermons")
        .select("id, title, preacher, date, video_url")
        .order("date", { ascending: false })
        .limit(3),
    ]);

  const postCount = postsRes.count ?? 0;
  const sermonCount = sermonsRes.count ?? 0;
  const eventCount = eventsRes.count ?? 0;
  const profileCount = profilesRes.count ?? 0;
  const recentPosts = recentPostsRes.data ?? [];
  const recentSermons = recentSermonsRes.data ?? [];

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-serif font-bold text-primary">Overview</h1>
        <p className="text-muted-foreground">Welcome back. Here is what is happening today.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Posts"
          value={postCount.toLocaleString()}
          icon={<FileText className="w-5 h-5 text-accent" />}
        />
        <StatCard
          title="Total Sermons"
          value={sermonCount.toLocaleString()}
          icon={<Video className="w-5 h-5 text-accent" />}
        />
        <StatCard
          title="Upcoming Events"
          value={eventCount.toLocaleString()}
          icon={<Calendar className="w-5 h-5 text-accent" />}
        />
        <StatCard
          title="Registered Users"
          value={profileCount.toLocaleString()}
          icon={<Users className="w-5 h-5 text-accent" />}
        />
      </div>

      {/* Recent content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Recent Posts</CardTitle>
          </CardHeader>
          <CardContent>
            {recentPosts.length === 0 ? (
              <p className="text-sm text-muted-foreground">No posts yet.</p>
            ) : (
              <div className="space-y-4">
                {recentPosts.map((post) => (
                  <div
                    key={post.id}
                    className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0"
                  >
                    <div>
                      <p className="font-medium text-primary line-clamp-1">{post.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {post.published_at
                          ? `Published ${format(new Date(post.published_at), "MMM d, yyyy")}`
                          : "Draft"}
                      </p>
                    </div>
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        post.status === "published"
                          ? "bg-green-100 text-green-800"
                          : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {post.status === "published" ? "Published" : "Draft"}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Sermons</CardTitle>
          </CardHeader>
          <CardContent>
            {recentSermons.length === 0 ? (
              <p className="text-sm text-muted-foreground">No sermons yet.</p>
            ) : (
              <div className="space-y-4">
                {recentSermons.map((sermon) => (
                  <div
                    key={sermon.id}
                    className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0"
                  >
                    <div>
                      <p className="font-medium text-primary line-clamp-1">{sermon.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {sermon.preacher} · {format(new Date(sermon.date), "MMM d, yyyy")}
                      </p>
                    </div>
                    {sermon.video_url && (
                      <span className="px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800">
                        Video
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  icon,
}: {
  title: string;
  value: string;
  icon: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold text-primary">{value}</div>
      </CardContent>
    </Card>
  );
}
