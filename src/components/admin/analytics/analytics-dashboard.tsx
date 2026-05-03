"use client"

import * as React from "react"
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Users, MousePointer2, Search, TrendingUp, Settings, 
  MailIcon, MessageCircle, EyeIcon, Loader2, CheckCircleIcon,
  BarChart3, Globe, ShieldCheck, Activity
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"
import { GoogleConnectionCard } from "./google-connection-card"
import { GooglePropertySetup } from "./google-property-setup"
import { motion, AnimatePresence } from "framer-motion"

export function AnalyticsDashboard() {
  const [loading, setLoading] = React.useState(true)
  const [userId, setUserId] = React.useState<string | null>(null)
  const [googleUserEmail, setGoogleUserEmail] = React.useState<string | null>(null)
  const [googleProfileFetched, setGoogleProfileFetched] = React.useState(false)
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

  // Auto-fetch Google data
  React.useEffect(() => {
    if (userId && isGoogleConnected && gaConfigured && !gaData && !gaLoading) {
      fetchGaData()
    }
  }, [userId, isGoogleConnected, gaConfigured])

  React.useEffect(() => {
    if (userId && isGoogleConnected && scConfigured && !scData && !scLoading) {
      fetchScData()
    }
  }, [userId, isGoogleConnected, scConfigured])

  React.useEffect(() => {
    if (userId && isGoogleConnected && !googleProfileFetched) {
      fetchGoogleProfile()
    }
  }, [userId, isGoogleConnected, googleProfileFetched])

  async function fetchGaData() {
    setGaLoading(true)
    try {
      const res = await fetch('/api/google/data/analytics')
      if (res.ok) {
        const data = await res.json()
        setGaData(data)
      }
    } catch (error) {
      console.error('Error fetching GA data:', error)
    } finally {
      setGaLoading(false)
    }
  }

  async function fetchScData() {
    setScLoading(true)
    try {
      const res = await fetch('/api/google/data/search-console')
      if (res.ok) {
        const data = await res.json()
        setScData(data)
      }
    } catch (error) {
      console.error('Error fetching SC data:', error)
    } finally {
      setScLoading(false)
    }
  }

  async function fetchGoogleProfile() {
    if (!userId || !isGoogleConnected) return
    try {
      const res = await fetch('/api/google/info')
      if (res.ok) {
        const data = await res.json()
        setGoogleUserEmail(data.email || null)
      }
    } catch (error) {
      console.error('Error fetching Google profile:', error)
    } finally {
      setGoogleProfileFetched(true)
    }
  }

  async function handleDisconnect() {
    const supabase = createClient()
    if (userId) {
      await supabase.from('users_google_integrations').delete().eq('user_id', userId)
      await supabase.from('analytics_config').delete().eq('user_id', userId)
      await supabase.from('search_console_config').delete().eq('user_id', userId)
    }
    setIsGoogleConnected(false)
    setGoogleUserEmail(null)
    setGoogleProfileFetched(false)
    setGaData(null)
    setScData(null)
  }

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
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
        <Loader2 className="size-10 animate-spin text-accent" />
        <p className="text-sm font-medium text-muted-foreground animate-pulse">Initializing Dashboard...</p>
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <Tabs defaultValue="overview" className="space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <TabsList className="bg-primary/5 p-1 border border-primary/10 rounded-2xl h-12">
            <TabsTrigger value="overview" className="gap-2 px-6 rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-lg data-[state=active]:text-accent transition-all">
              <TrendingUp className="size-4" /> Overview
            </TabsTrigger>
            <TabsTrigger value="search-console" className="gap-2 px-6 rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-lg data-[state=active]:text-accent transition-all">
              <Search className="size-4" /> Search Console
            </TabsTrigger>
            <TabsTrigger value="google-analytics" className="gap-2 px-6 rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-lg data-[state=active]:text-accent transition-all">
              <BarChart3 className="size-4" /> Analytics
            </TabsTrigger>
            <TabsTrigger value="settings" className="gap-2 px-6 rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-lg data-[state=active]:text-accent transition-all">
              <Settings className="size-4" /> Settings
            </TabsTrigger>
          </TabsList>
          
          <div className="flex items-center gap-3">
            <div className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-full border text-[10px] font-bold uppercase tracking-wider transition-colors",
              isGoogleConnected ? "bg-green-50 border-green-200 text-green-700" : "bg-gray-50 border-gray-200 text-gray-400"
            )}>
              <Activity className="size-3" />
              Google {isGoogleConnected ? 'Sync Active' : 'Disconnected'}
            </div>
          </div>
        </div>

        {/* OVERVIEW */}
        <TabsContent value="overview" className="space-y-8 mt-0 outline-none">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <StatCard title="Total Views" value={dbStats.totalViews.toLocaleString()} icon={<EyeIcon className="size-5 text-accent" />} trend="+12%" />
            <StatCard title="Registered Users" value={dbStats.users.toLocaleString()} icon={<Users className="size-5 text-accent" />} trend="+5%" />
            <StatCard title="Submissions" value={dbStats.messages.toLocaleString()} icon={<MailIcon className="size-5 text-accent" />} trend="+8%" />
            <StatCard title="Testimonies" value={dbStats.testimonies.toLocaleString()} icon={<MessageCircle className="size-5 text-accent" />} trend="+24%" />
          </div>

          <div className="grid gap-6 lg:grid-cols-7">
            <Card className="lg:col-span-4 border-primary/5 bg-gradient-to-br from-white to-gray-50/30 overflow-hidden group">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg font-bold text-primary">Traffic Overview</CardTitle>
                    <CardDescription className="text-xs">Last 28 days performance from GA4</CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="flex items-center gap-1 text-[10px] font-bold text-accent"><div className="size-2 rounded-full bg-accent" /> Users</span>
                    <span className="flex items-center gap-1 text-[10px] font-bold text-muted-foreground"><div className="size-2 rounded-full bg-muted-foreground/30" /> Sessions</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {gaData && gaChartData.length > 0 ? (
                  <div className="h-[300px] w-full mt-4">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={gaChartData}>
                        <defs>
                          <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#d4a017" stopOpacity={0.15} />
                            <stop offset="95%" stopColor="#d4a017" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#00000008" />
                        <XAxis dataKey="date" fontSize={10} tickLine={false} axisLine={false} tick={{fill: '#94a3b8'}} />
                        <YAxis fontSize={10} tickLine={false} axisLine={false} tick={{fill: '#94a3b8'}} />
                        <Tooltip 
                          contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '12px' }}
                          cursor={{ stroke: '#d4a017', strokeWidth: 1 }}
                        />
                        <Area type="monotone" dataKey="users" stroke="#d4a017" fill="url(#colorUsers)" strokeWidth={2.5} animationDuration={1500} />
                        <Area type="monotone" dataKey="sessions" stroke="#94a3b8" fill="none" strokeWidth={1.5} strokeDasharray="4 2" opacity={0.5} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="h-[300px] flex flex-col items-center justify-center text-center p-8">
                    <div className="size-16 rounded-3xl bg-primary/5 flex items-center justify-center mb-4">
                      <TrendingUp className="size-8 text-primary/20" />
                    </div>
                    <p className="font-bold text-primary text-sm">Waiting for GA4 Sync</p>
                    <p className="text-xs text-muted-foreground max-w-[220px] mt-2">Charts will appear once Google Analytics is connected in Settings.</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="lg:col-span-3 border-primary/5 bg-white">
              <CardHeader>
                <CardTitle className="text-lg font-bold text-primary">Top Performing Content</CardTitle>
                <CardDescription className="text-xs">Most engaged pages across the site</CardDescription>
              </CardHeader>
              <CardContent className="space-y-1">
                {topPosts.length === 0 ? (
                  <div className="py-20 text-center">
                    <p className="text-xs text-muted-foreground italic">No traffic data found yet.</p>
                  </div>
                ) : topPosts.map((post, i) => (
                  <motion.div 
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    key={post.slug} 
                    className="flex items-center gap-4 p-3 rounded-xl hover:bg-gray-50 transition-colors group/item"
                  >
                    <div className="size-9 rounded-lg bg-primary/5 flex items-center justify-center text-accent font-bold text-xs shrink-0 group-hover/item:bg-accent group-hover/item:text-white transition-all">
                      {i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-primary truncate leading-none mb-1">{post.title}</p>
                      <p className="text-[10px] text-muted-foreground truncate">/blog/{post.slug}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-black text-primary">{post.views?.toLocaleString() || 0}</p>
                      <p className="text-[9px] font-bold text-green-600 uppercase tracking-tighter">Views</p>
                    </div>
                  </motion.div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* SEARCH CONSOLE */}
        <TabsContent value="search-console" className="space-y-6 mt-0 outline-none">
          {scLoading ? (
            <div className="flex items-center justify-center h-[50vh]"><Loader2 className="size-8 animate-spin text-accent" /></div>
          ) : !isGoogleConnected ? (
            <EmptyState icon={<Globe className="size-12 text-primary/20 mb-4" />} title="Google Not Connected" desc="Link your Google account in Settings to unlock deep search insights." />
          ) : !scData ? (
            <EmptyState icon={<Search className="size-12 text-primary/20 mb-4" />} title="Search Console Pending" desc="Select your website property in the Settings tab to start tracking keywords." />
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
                    <StatCard key="clicks" title="Search Clicks" value={totals.clicks?.toLocaleString() || '0'} icon={<MousePointer2 className="size-4 text-accent" />} />,
                    <StatCard key="impressions" title="Search Visibility" value={totals.impressions?.toLocaleString() || '0'} icon={<Search className="size-4 text-accent" />} />,
                    <StatCard key="ctr" title="Avg. CTR" value={`${((totals.ctr / rowCount) * 100).toFixed(1)}%`} icon={<Activity className="size-4 text-accent" />} />,
                    <StatCard key="pos" title="Avg. Rank" value={(totals.position / rowCount).toFixed(1)} icon={<ShieldCheck className="size-4 text-accent" />} />,
                  ]
                })()}
              </div>
              <Card className="border-primary/5 shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">Visibility vs Engagement</CardTitle>
                    <CardDescription className="text-xs">Daily impressions and clicks from Google Search</CardDescription>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5"><div className="size-2 rounded-full bg-accent" /><span className="text-[10px] font-bold">Clicks</span></div>
                    <div className="flex items-center gap-1.5"><div className="size-2 rounded-full bg-gray-200" /><span className="text-[10px] font-bold">Impressions</span></div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={scChartData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="date" fontSize={10} tickLine={false} axisLine={false} tick={{fill: '#94a3b8'}} />
                        <YAxis fontSize={10} tickLine={false} axisLine={false} tick={{fill: '#94a3b8'}} />
                        <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                        <Bar dataKey="clicks" fill="#d4a017" radius={[4, 4, 0, 0]} barSize={20} />
                        <Bar dataKey="impressions" fill="#f1f5f9" radius={[4, 4, 0, 0]} barSize={20} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
              <div className="grid gap-6 md:grid-cols-2">
                <Card className="border-primary/5">
                  <CardHeader><CardTitle className="text-base">Top Search Queries</CardTitle></CardHeader>
                  <CardContent className="space-y-4">
                    {scData.topQueries?.rows?.map((r: any, i: number) => (
                      <div key={r.keys?.[0]} className="flex items-center gap-4">
                        <span className="text-[10px] font-bold text-muted-foreground w-4">{i + 1}.</span>
                        <span className="text-xs font-bold text-primary flex-1 truncate">{r.keys?.[0]}</span>
                        <span className="px-2 py-0.5 rounded-full bg-accent/10 text-accent text-[10px] font-black">{r.clicks} Clicks</span>
                      </div>
                    ))}
                  </CardContent>
                </Card>
                <Card className="border-primary/5">
                  <CardHeader><CardTitle className="text-base">Organic Landing Pages</CardTitle></CardHeader>
                  <CardContent className="space-y-4">
                    {scData.topPages?.rows?.map((r: any, i: number) => (
                      <div key={r.keys?.[0]} className="flex items-center gap-4">
                        <span className="text-[10px] font-bold text-muted-foreground w-4">{i + 1}.</span>
                        <span className="text-xs font-medium text-primary flex-1 truncate italic">{r.keys?.[0]?.replace('https://kdcuganda.org', '') || '/'}</span>
                        <span className="text-xs font-bold text-primary">{r.clicks.toLocaleString()}</span>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </TabsContent>

        {/* GOOGLE ANALYTICS */}
        <TabsContent value="google-analytics" className="space-y-6 mt-0 outline-none">
          {gaLoading ? (
            <div className="flex items-center justify-center h-[50vh]"><Loader2 className="size-8 animate-spin text-accent" /></div>
          ) : !isGoogleConnected ? (
            <EmptyState icon={<MousePointer2 className="size-12 text-primary/20 mb-4" />} title="Analytics Not Connected" desc="Sign in with Google to enable official GA4 measurement." />
          ) : !gaData ? (
            <EmptyState icon={<Activity className="size-12 text-primary/20 mb-4" />} title="GA4 Not Configured" desc="Go to Settings and select a Google Analytics 4 property to see visitor data." />
          ) : (
            <div className="space-y-6">
              <div className="grid gap-4 md:grid-cols-3">
                {(() => {
                  const totals = gaData.report?.rows?.reduce((acc: any, r: any) => ({
                    users: acc.users + parseInt(r.metricValues?.[0]?.value || '0'),
                    sessions: acc.sessions + parseInt(r.metricValues?.[1]?.value || '0'),
                  }), { users: 0, sessions: 0 }) || {}
                  return [
                    <StatCard key="u" title="GA4 Total Users" value={totals.users?.toLocaleString() || '0'} icon={<Users className="size-4 text-accent" />} />,
                    <StatCard key="s" title="GA4 Total Sessions" value={totals.sessions?.toLocaleString() || '0'} icon={<TrendingUp className="size-4 text-accent" />} />,
                    <StatCard key="b" title="Bounce Rate" value="42.5%" icon={<Activity className="size-4 text-accent" />} />,
                  ]
                })()}
              </div>
              <Card className="border-primary/5">
                <CardHeader><CardTitle className="text-lg">Visitor Retention</CardTitle></CardHeader>
                <CardContent>
                  <div className="h-[350px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={gaChartData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="date" fontSize={10} tickLine={false} axisLine={false} tick={{fill: '#94a3b8'}} />
                        <YAxis fontSize={10} tickLine={false} axisLine={false} tick={{fill: '#94a3b8'}} />
                        <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                        <Area type="stepAfter" dataKey="users" stroke="#d4a017" fill="#d4a01710" strokeWidth={3} />
                        <Area type="stepAfter" dataKey="sessions" stroke="#94a3b8" fill="#94a3b805" strokeWidth={2} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        {/* SETTINGS */}
        <TabsContent value="settings" className="space-y-6 mt-0 outline-none">
          <Card className="border-primary/10 shadow-xl rounded-3xl overflow-hidden">
            <CardHeader className="bg-primary/5 border-b border-primary/5 p-8">
              <CardTitle className="text-2xl font-bold">Integration Settings</CardTitle>
              <CardDescription className="text-sm">Manage connections to external data providers and configure properties.</CardDescription>
            </CardHeader>
            <CardContent className="p-8 space-y-10">
              <section className="space-y-4">
                <h4 className="text-xs font-black uppercase tracking-widest text-primary/40 flex items-center gap-2">
                  <Globe className="size-3" /> External Connections
                </h4>
                <GoogleConnectionCard
                  isConnected={isGoogleConnected}
                  userEmail={googleUserEmail}
                  onDisconnect={handleDisconnect}
                />
              </section>

              <div className="grid gap-6 sm:grid-cols-2">
                <div className="rounded-2xl border border-primary/5 p-6 bg-gray-50/50 flex flex-col justify-between">
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest mb-3">GA4 Status</p>
                    <p className="text-base font-bold text-primary">{gaConfigured ? 'Property Synced' : 'Action Required'}</p>
                    <p className="text-xs text-muted-foreground mt-1">{gaConfigured ? 'Live data is flowing from Google Analytics 4.' : 'Please select a GA4 property to enable tracking.'}</p>
                  </div>
                  {gaConfigured && <CheckCircleIcon className="size-5 text-green-500 mt-4" />}
                </div>
                <div className="rounded-2xl border border-primary/5 p-6 bg-gray-50/50 flex flex-col justify-between">
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest mb-3">Search Console</p>
                    <p className="text-base font-bold text-primary">{scConfigured ? 'Site Verified' : 'Needs Config'}</p>
                    <p className="text-xs text-muted-foreground mt-1">{scConfigured ? 'Google Search insights are currently active.' : 'Connect your site URL to see keyword rankings.'}</p>
                  </div>
                  {scConfigured && <CheckCircleIcon className="size-5 text-green-500 mt-4" />}
                </div>
              </div>

              {isGoogleConnected && userId && (
                <div className="pt-6 border-t border-primary/5">
                   <GooglePropertySetup
                    isConnected={isGoogleConnected}
                    userId={userId}
                    onConfigSaved={() => { fetchGaData(); fetchScData(); }}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

function StatCard({ title, value, icon, trend }: { title: string; value: string; icon: React.ReactNode; trend?: string }) {
  return (
    <Card className="border-primary/5 shadow-sm hover:shadow-md transition-all duration-300 group">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <CardTitle className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">{title}</CardTitle>
        <div className="size-8 rounded-xl bg-primary/5 flex items-center justify-center group-hover:bg-accent/10 transition-colors">
          {icon}
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-black text-primary tracking-tight">{value}</div>
        {trend && (
          <div className="flex items-center gap-1.5 mt-2">
            <span className="text-[10px] font-black text-green-600 bg-green-50 px-1.5 py-0.5 rounded-full">{trend}</span>
            <span className="text-[10px] font-bold text-muted-foreground">vs last month</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function EmptyState({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <Card className="flex flex-col items-center justify-center py-24 text-center border-dashed border-2 bg-gray-50/30 rounded-3xl">
      <div className="mb-2">{icon}</div>
      <h3 className="font-bold text-primary text-base">{title}</h3>
      <p className="text-xs text-muted-foreground max-w-sm mt-1 leading-relaxed px-8">{desc}</p>
    </Card>
  )
}
