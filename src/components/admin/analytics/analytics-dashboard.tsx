"use client"

import * as React from "react"
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Users, MousePointer2, Search, TrendingUp, Settings, MailIcon, MessageCircle, EyeIcon, Loader2, CheckCircleIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"
import { GoogleConnectionCard } from "./google-connection-card"
import { GooglePropertySetup } from "./google-property-setup"

export function AnalyticsDashboard() {
  const [loading, setLoading] = React.useState(true)
  const [userId, setUserId] = React.useState<string | null>(null)
  const [googleUserEmail, setGoogleUserEmail] = React.useState<string | null>(null)
  const [topPosts, setTopPosts] = React.useState<any[]>([])
  const [dbStats, setDbStats] = React.useState({ users: 0, messages: 0, testimonies: 0, totalViews: 0 })
  const [isGoogleConnected, setIsGoogleConnected] = React.useState(false)
  const [gaConfigured, setGaConfigured] = React.useState(false)
  const [scConfigured, setScConfigured] = React.useState(false)
  const [gaData, setGaData] = React.useState<any>(null)
  const [scData, setScData] = React.useState<any>(null)
  const [gaLoading, setGaLoading] = React.useState(false)
  const [scLoading, setScLoading] = React.useState(false)

  React.useEffect(() => {
    async function fetchData() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUserId(user.id)
        setGoogleUserEmail(user.email || null)
      }

      const [
        { data: posts },
        { count: userCount },
        { count: msgCount },
        { count: testCount },
        { data: allPosts },
        { data: googleIntegration },
        { data: analyticsConfig },
        { data: searchConsoleConfig }
      ] = await Promise.all([
        supabase.from('posts').select('title, views, slug').order('views', { ascending: false }).limit(5),
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('contact_submissions').select('*', { count: 'exact', head: true }),
        supabase.from('testimonies').select('*', { count: 'exact', head: true }),
        supabase.from('posts').select('views'),
        user ? supabase.from('users_google_integrations').select('user_id').eq('user_id', user.id).single() : { data: null },
        user ? supabase.from('analytics_config').select('property_id').eq('user_id', user.id).single() : { data: null },
        user ? supabase.from('search_console_config').select('site_url').eq('user_id', user.id).single() : { data: null }
      ])

      if (posts) setTopPosts(posts)
      setDbStats({
        users: userCount || 0,
        messages: msgCount || 0,
        testimonies: testCount || 0,
        totalViews: allPosts?.reduce((a, p) => a + (p.views || 0), 0) || 0
      })
      setIsGoogleConnected(!!googleIntegration)
      setGaConfigured(!!analyticsConfig?.property_id)
      setScConfigured(!!searchConsoleConfig?.site_url)
      setLoading(false)
    }
    fetchData()
  }, [])

  async function fetchGaData() {
    setGaLoading(true)
    const res = await fetch('/api/google/data/analytics')
    const data = await res.json()
    if (!data.error) setGaData(data)
    setGaLoading(false)
  }

  async function fetchScData() {
    setScLoading(true)
    const res = await fetch('/api/google/data/search-console')
    const data = await res.json()
    if (!data.error) setScData(data)
    setScLoading(false)
  }

  async function handleDisconnect() {
    const supabase = createClient()
    if (userId) {
      await supabase.from('users_google_integrations').delete().eq('user_id', userId)
      await supabase.from('analytics_config').delete().eq('user_id', userId)
      await supabase.from('search_console_config').delete().eq('user_id', userId)
    }
    setIsGoogleConnected(false)
    setGaData(null)
    setScData(null)
  }

  // Parse GA4 report rows into chart-friendly format
  const gaChartData = React.useMemo(() => {
    if (!gaData?.report?.rows) return []
    return gaData.report.rows.map((row: any) => ({
      date: row.dimensionValues?.[0]?.value?.replace(/(\d{4})(\d{2})(\d{2})/, '$2/$3'),
      users: parseInt(row.metricValues?.[0]?.value || '0'),
      sessions: parseInt(row.metricValues?.[1]?.value || '0'),
    }))
  }, [gaData])

  const scChartData = React.useMemo(() => {
    if (!scData?.summary?.rows) return []
    return scData.summary.rows.map((row: any) => ({
      date: row.keys?.[0]?.slice(5),
      clicks: row.clicks || 0,
      impressions: row.impressions || 0,
    }))
  }, [scData])

  if (loading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="size-8 animate-spin text-muted-foreground" /></div>
  }

  return (
    <Tabs defaultValue="overview" className="space-y-6">
      <TabsList className="bg-muted/50 p-1 border">
        <TabsTrigger value="overview" className="gap-2 px-4"><TrendingUp className="size-4" /> Overview</TabsTrigger>
        <TabsTrigger value="search-console" className="gap-2 px-4" onClick={fetchScData}><Search className="size-4" /> Search Console</TabsTrigger>
        <TabsTrigger value="google-analytics" className="gap-2 px-4" onClick={fetchGaData}><MousePointer2 className="size-4" /> Analytics</TabsTrigger>
        <TabsTrigger value="settings" className="gap-2 px-4"><Settings className="size-4" /> Settings</TabsTrigger>
      </TabsList>

      {/* OVERVIEW */}
      <TabsContent value="overview" className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard title="Total Content Views" value={dbStats.totalViews.toLocaleString()} icon={<EyeIcon className="size-4 text-muted-foreground" />} />
          <StatCard title="Registered Users" value={dbStats.users.toLocaleString()} icon={<Users className="size-4 text-muted-foreground" />} />
          <StatCard title="Messages & Prayers" value={dbStats.messages.toLocaleString()} icon={<MailIcon className="size-4 text-muted-foreground" />} />
          <StatCard title="Testimonies" value={dbStats.testimonies.toLocaleString()} icon={<MessageCircle className="size-4 text-muted-foreground" />} />
        </div>
        <div className="grid gap-4 lg:grid-cols-7">
          {gaData && gaChartData.length > 0 ? (
            <Card className="lg:col-span-4">
              <CardHeader><CardTitle>Traffic (GA4)</CardTitle><CardDescription>Last 28 days from Google Analytics</CardDescription></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={280}>
                  <AreaChart data={gaChartData}>
                    <defs>
                      <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#eab308" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#eab308" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="date" fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis fontSize={11} tickLine={false} axisLine={false} />
                    <Tooltip />
                    <Legend />
                    <Area type="monotone" dataKey="users" stroke="#eab308" fill="url(#colorUsers)" strokeWidth={2} />
                    <Area type="monotone" dataKey="sessions" stroke="#94a3b8" fill="none" strokeWidth={1.5} strokeDasharray="4 2" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          ) : (
            <Card className="lg:col-span-4 flex flex-col items-center justify-center py-16 text-center text-muted-foreground">
              <TrendingUp className="size-10 opacity-20 mb-3" />
              <p className="font-semibold text-foreground text-sm">No GA4 Data</p>
              <p className="text-xs max-w-[200px] mt-1">Connect Google Analytics in the Settings tab to see live traffic charts here.</p>
            </Card>
          )}
          <Card className="lg:col-span-3">
            <CardHeader><CardTitle>Top Content</CardTitle><CardDescription>Most viewed pages on your site</CardDescription></CardHeader>
            <CardContent className="space-y-5">
              {topPosts.length === 0 ? <p className="text-sm text-muted-foreground">No data yet.</p> : topPosts.map((post) => (
                <div key={post.slug} className="flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium leading-none line-clamp-1">{post.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">/blog/{post.slug}</p>
                  </div>
                  <span className="text-sm font-semibold">{post.views?.toLocaleString() || 0}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </TabsContent>

      {/* SEARCH CONSOLE */}
      <TabsContent value="search-console" className="space-y-6">
        {scLoading ? (
          <div className="flex items-center justify-center h-64"><Loader2 className="size-8 animate-spin text-muted-foreground" /></div>
        ) : !isGoogleConnected ? (
          <EmptyState icon={<Search className="size-10 opacity-20 mb-3" />} title="Google Not Connected" desc="Connect your Google account in the Settings tab to see Search Console data." />
        ) : !scData ? (
          <EmptyState icon={<Search className="size-10 opacity-20 mb-3" />} title="Search Console Not Configured" desc="Go to Settings and select a Search Console property to see data." />
        ) : (
          <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-4">
              {(() => {
                const totals = scData.summary?.rows?.reduce((acc: any, r: any) => ({
                  clicks: acc.clicks + (r.clicks || 0),
                  impressions: acc.impressions + (r.impressions || 0),
                  ctr: acc.ctr + (r.ctr || 0),
                  position: acc.position + (r.position || 0),
                }), { clicks: 0, impressions: 0, ctr: 0, position: 0 }) || {}
                const rowCount = scData.summary?.rows?.length || 1
                return [
                  <StatCard key="clicks" title="Total Clicks" value={totals.clicks?.toLocaleString() || '0'} icon={<MousePointer2 className="size-4 text-muted-foreground" />} />,
                  <StatCard key="impressions" title="Total Impressions" value={totals.impressions?.toLocaleString() || '0'} icon={<EyeIcon className="size-4 text-muted-foreground" />} />,
                  <StatCard key="ctr" title="Avg. CTR" value={`${((totals.ctr / rowCount) * 100).toFixed(1)}%`} icon={<TrendingUp className="size-4 text-muted-foreground" />} />,
                  <StatCard key="pos" title="Avg. Position" value={(totals.position / rowCount).toFixed(1)} icon={<Search className="size-4 text-muted-foreground" />} />,
                ]
              })()}
            </div>
            <Card>
              <CardHeader><CardTitle>Clicks vs Impressions</CardTitle><CardDescription>Last 28 days from Search Console</CardDescription></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={scChartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="date" fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis fontSize={11} tickLine={false} axisLine={false} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="clicks" fill="#eab308" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="impressions" fill="#94a3b8" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader><CardTitle>Top Queries</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  {scData.topQueries?.rows?.map((r: any) => (
                    <div key={r.keys?.[0]} className="flex items-center gap-2">
                      <span className="text-sm flex-1 truncate">{r.keys?.[0]}</span>
                      <span className="text-xs font-medium">{r.clicks} clicks</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle>Top Pages</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  {scData.topPages?.rows?.map((r: any) => (
                    <div key={r.keys?.[0]} className="flex items-center gap-2">
                      <span className="text-sm flex-1 truncate text-muted-foreground">{r.keys?.[0]?.replace('https://kdcuganda.org', '') || '/'}</span>
                      <span className="text-xs font-medium">{r.clicks} clicks</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </TabsContent>

      {/* GOOGLE ANALYTICS */}
      <TabsContent value="google-analytics" className="space-y-6">
        {gaLoading ? (
          <div className="flex items-center justify-center h-64"><Loader2 className="size-8 animate-spin text-muted-foreground" /></div>
        ) : !isGoogleConnected ? (
          <EmptyState icon={<MousePointer2 className="size-10 opacity-20 mb-3" />} title="Google Not Connected" desc="Connect your Google account in the Settings tab." />
        ) : !gaData ? (
          <EmptyState icon={<MousePointer2 className="size-10 opacity-20 mb-3" />} title="Analytics Not Configured" desc="Go to Settings and select a GA4 property to see data." />
        ) : (
          <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-4">
              {(() => {
                const totals = gaData.report?.rows?.reduce((acc: any, r: any) => ({
                  users: acc.users + parseInt(r.metricValues?.[0]?.value || '0'),
                  sessions: acc.sessions + parseInt(r.metricValues?.[1]?.value || '0'),
                }), { users: 0, sessions: 0 }) || {}
                return [
                  <StatCard key="u" title="Total Users" value={totals.users?.toLocaleString() || '0'} icon={<Users className="size-4 text-muted-foreground" />} />,
                  <StatCard key="s" title="Total Sessions" value={totals.sessions?.toLocaleString() || '0'} icon={<TrendingUp className="size-4 text-muted-foreground" />} />,
                ]
              })()}
            </div>
            <Card>
              <CardHeader><CardTitle>Users & Sessions</CardTitle><CardDescription>Last 28 days</CardDescription></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={gaChartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="date" fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis fontSize={11} tickLine={false} axisLine={false} />
                    <Tooltip /><Legend />
                    <Area type="monotone" dataKey="users" stroke="#eab308" fill="#eab30820" strokeWidth={2} />
                    <Area type="monotone" dataKey="sessions" stroke="#94a3b8" fill="#94a3b815" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>Top Pages</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {gaData.topPages?.rows?.map((r: any) => (
                  <div key={r.dimensionValues?.[0]?.value} className="flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm truncate">{r.dimensionValues?.[1]?.value || r.dimensionValues?.[0]?.value}</p>
                      <p className="text-xs text-muted-foreground">{r.dimensionValues?.[0]?.value}</p>
                    </div>
                    <span className="text-sm font-semibold">{parseInt(r.metricValues?.[0]?.value || '0').toLocaleString()} views</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        )}
      </TabsContent>

      {/* SETTINGS */}
      <TabsContent value="settings" className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Google Integration</CardTitle>
            <CardDescription>Connect your Google account to enable Analytics and Search Console data.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <GoogleConnectionCard
              isConnected={isGoogleConnected}
              userEmail={googleUserEmail}
              onDisconnect={handleDisconnect}
            />
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-border p-4">
                <p className="text-xs text-muted-foreground uppercase tracking-[0.2em] mb-2">GA4 Status</p>
                <p className="text-sm font-semibold">{gaConfigured ? 'Property configured' : 'Property not configured'}</p>
              </div>
              <div className="rounded-xl border border-border p-4">
                <p className="text-xs text-muted-foreground uppercase tracking-[0.2em] mb-2">Search Console</p>
                <p className="text-sm font-semibold">{scConfigured ? 'Site configured' : 'Site not configured'}</p>
              </div>
            </div>
            {isGoogleConnected && userId && (
              <GooglePropertySetup
                isConnected={isGoogleConnected}
                userId={userId}
                onConfigSaved={() => { fetchGaData(); fetchScData(); }}
              />
            )}
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  )
}

function StatCard({ title, value, icon }: { title: string; value: string; icon: React.ReactNode }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground mt-1">Last 28 days</p>
      </CardContent>
    </Card>
  )
}

function EmptyState({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <Card className="flex flex-col items-center justify-center py-24 text-center text-muted-foreground">
      {icon}
      <h3 className="font-semibold text-foreground text-sm">{title}</h3>
      <p className="text-xs max-w-sm mt-1">{desc}</p>
    </Card>
  )
}
