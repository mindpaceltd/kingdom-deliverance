"use client"

import * as React from "react"
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Users, TrendingUp, Settings, 
  MailIcon, MessageCircle, Eye, Loader2, CheckCircle2,
  Zap, ExternalLink, Globe, MousePointer2, MapPin,
  Activity, Search, BarChart3, ShieldCheck, ShieldAlert,
  ArrowUpRight, ArrowDownRight, RefreshCw, Key
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { createClient } from '@/lib/supabase/client'
import { cn } from "@/lib/utils"
import { motion, AnimatePresence } from "framer-motion"
import { GoogleConnectionCard } from "./google-connection-card"
import { GooglePropertySetup } from "./google-property-setup"

export function AnalyticsDashboard() {
  const [loading, setLoading] = React.useState(true)
  const [userId, setUserId] = React.useState<string | null>(null)
  
  // Database local stats
  const [dbStats, setDbStats] = React.useState({ users: 0, messages: 0, testimonies: 0, totalViews: 0 })
  const [topPosts, setTopPosts] = React.useState<any[]>([])

  // Google Integration Status
  const [isGoogleConnected, setIsGoogleConnected] = React.useState(false)
  const [googleUserEmail, setGoogleUserEmail] = React.useState<string | null>(null)
  const [gaConfigured, setGaConfigured] = React.useState(false)
  const [scConfigured, setScConfigured] = React.useState(false)

  // API Data States
  const [gaData, setGaData] = React.useState<any>(null)
  const [scData, setScData] = React.useState<any>(null)
  const [psData, setPsData] = React.useState<any>(null)

  // Loading States
  const [gaLoading, setGaLoading] = React.useState(false)
  const [scLoading, setScLoading] = React.useState(false)
  const [psLoading, setPsLoading] = React.useState(false)

  // Error States
  const [gaError, setGaError] = React.useState<string | null>(null)
  const [scError, setScError] = React.useState<string | null>(null)
  const [psError, setPsError] = React.useState<string | null>(null)

  const supabase = createClient()

  const fetchData = React.useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUserId(user.id)
      }

      // Fetch DB stats first (non-blocking for Google integration)
      const [
        { data: posts },
        { count: userCount },
        { count: msgCount },
        { count: testCount },
        { data: allPosts }
      ] = await Promise.all([
        supabase.from('posts').select('title, views, slug').order('views', { ascending: false }).limit(5),
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('contact_submissions').select('*', { count: 'exact', head: true }),
        supabase.from('testimonies').select('*', { count: 'exact', head: true }),
        supabase.from('posts').select('views')
      ])

      if (posts) setTopPosts(posts)
      setDbStats({
        users: userCount || 0,
        messages: msgCount || 0,
        testimonies: testCount || 0,
        totalViews: allPosts?.reduce((a, p) => a + (p.views || 0), 0) || 0
      })

      if (user) {
        // Fetch integration configs
        const [
          { data: googleIntegration },
          { data: analyticsConfig },
          { data: searchConsoleConfig }
        ] = await Promise.all([
          supabase.from('users_google_integrations').select('user_id').eq('user_id', user.id).maybeSingle(),
          supabase.from('analytics_config').select('property_id').eq('user_id', user.id).maybeSingle(),
          supabase.from('search_console_config').select('site_url').eq('user_id', user.id).maybeSingle()
        ])

        const connected = !!googleIntegration
        setIsGoogleConnected(connected)
        setGaConfigured(!!analyticsConfig?.property_id)
        setScConfigured(!!searchConsoleConfig?.site_url)

        if (connected) {
          // Fetch Google User Email
          fetch('/api/google/info')
            .then(res => res.json())
            .then(data => setGoogleUserEmail(data.email || null))
            .catch(err => console.error("Error fetching Google email info:", err))

          // Trigger parallel data fetches
          fetchGaData()
          fetchScData()
        }
        
        // Fetch PageSpeed data independently
        fetchPsData()
      }
    } catch (error) {
      console.error("Error initializing dashboard data:", error)
    } finally {
      setLoading(false)
    }
  }, [supabase])

  React.useEffect(() => {
    fetchData()
  }, [fetchData])

  async function fetchGaData() {
    setGaLoading(true)
    setGaError(null)
    try {
      const res = await fetch('/api/google/data/analytics')
      const data = await res.json()
      if (res.ok) {
        setGaData(data)
      } else {
        setGaError(data.error || 'Failed to fetch GA4 data')
      }
    } catch (error: any) {
      setGaError(error.message || 'Connection error')
    } finally {
      setGaLoading(false)
    }
  }

  async function fetchScData() {
    setScLoading(true)
    setScError(null)
    try {
      const res = await fetch('/api/google/data/search-console')
      const data = await res.json()
      if (res.ok) {
        setScData(data)
      } else {
        setScError(data.error || 'Failed to fetch Search Console data')
      }
    } catch (error: any) {
      setScError(error.message || 'Connection error')
    } finally {
      setScLoading(false)
    }
  }

  async function fetchPsData() {
    setPsLoading(true)
    setPsError(null)
    try {
      const res = await fetch('/api/google/data/pagespeed')
      const data = await res.json()
      if (res.ok) {
        setPsData(data)
      } else {
        setPsError(data.error || 'Failed to fetch PageSpeed data')
      }
    } catch (error: any) {
      setPsError(error.message || 'Connection error')
    } finally {
      setPsLoading(false)
    }
  }

  async function refreshConfig() {
    if (!userId) return
    const [
      { data: analyticsConfig },
      { data: searchConsoleConfig }
    ] = await Promise.all([
      supabase.from('analytics_config').select('property_id').eq('user_id', userId).maybeSingle(),
      supabase.from('search_console_config').select('site_url').eq('user_id', userId).maybeSingle()
    ])

    setGaConfigured(!!analyticsConfig?.property_id)
    setScConfigured(!!searchConsoleConfig?.site_url)
    
    fetchGaData()
    fetchScData()
    fetchPsData()
  }

  async function handleDisconnect() {
    if (userId) {
      await Promise.all([
        supabase.from('users_google_integrations').delete().eq('user_id', userId),
        supabase.from('analytics_config').delete().eq('user_id', userId),
        supabase.from('search_console_config').delete().eq('user_id', userId)
      ])
    }
    setIsGoogleConnected(false)
    setGoogleUserEmail(null)
    setGaData(null)
    setScData(null)
    setPsData(null)
  }

  // Parse GA charts data
  const gaChartData = React.useMemo(() => {
    if (!gaData?.report?.rows) return []
    return gaData.report.rows.map((row: any) => ({
      date: row.dimensionValues?.[0]?.value?.replace(/(\d{4})(\d{2})(\d{2})/, '$2/$3'),
      users: parseInt(row.metricValues?.[0]?.value || '0'),
      sessions: parseInt(row.metricValues?.[1]?.value || '0'),
    }))
  }, [gaData])

  // Parse SC charts data
  const scChartData = React.useMemo(() => {
    if (!scData?.summary?.rows) return []
    return scData.summary.rows.map((row: any) => ({
      date: row.keys?.[0]?.slice(5),
      clicks: row.clicks || 0,
      impressions: row.impressions || 0,
    }))
  }, [scData])

  // Extract GA Aggregated Stats
  const gaStats = React.useMemo(() => {
    if (!gaData?.report?.rows) return { users: 0, sessions: 0, bounceRate: 0, sessionDuration: 0 }
    
    let totalUsers = 0
    let totalSessions = 0
    let totalBounce = 0
    let totalDuration = 0
    
    gaData.report.rows.forEach((row: any) => {
      totalUsers += parseInt(row.metricValues?.[0]?.value || '0')
      totalSessions += parseInt(row.metricValues?.[1]?.value || '0')
      totalBounce += parseFloat(row.metricValues?.[2]?.value || '0')
      totalDuration += parseFloat(row.metricValues?.[3]?.value || '0')
    })
    
    const count = gaData.report.rows.length
    return {
      users: totalUsers,
      sessions: totalSessions,
      bounceRate: count > 0 ? Math.round((totalBounce / count) * 100) : 0,
      sessionDuration: count > 0 ? Math.round(totalDuration / count) : 0
    }
  }, [gaData])

  // Extract SC Aggregated Stats
  const scStats = React.useMemo(() => {
    if (!scData?.summary?.rows) return { clicks: 0, impressions: 0, ctr: 0, position: 0 }
    
    let totalClicks = 0
    let totalImpressions = 0
    let totalCtr = 0
    let totalPos = 0
    
    scData.summary.rows.forEach((row: any) => {
      totalClicks += row.clicks || 0
      totalImpressions += row.impressions || 0
      totalCtr += row.ctr || 0
      totalPos += row.position || 0
    })
    
    const count = scData.summary.rows.length
    return {
      clicks: totalClicks,
      impressions: totalImpressions,
      ctr: count > 0 ? (totalCtr / count) * 100 : 0,
      position: count > 0 ? totalPos / count : 0
    }
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
              <TrendingUp className="size-4" /> Google Site Kit
            </TabsTrigger>
            <TabsTrigger value="search-console" className="gap-2 px-6 rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-lg data-[state=active]:text-accent transition-all">
              <Search className="size-4" /> Search Console
            </TabsTrigger>
            <TabsTrigger value="google-analytics" className="gap-2 px-6 rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-lg data-[state=active]:text-accent transition-all">
              <BarChart3 className="size-4" /> Google Analytics
            </TabsTrigger>
            <TabsTrigger value="pagespeed" className="gap-2 px-6 rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-lg data-[state=active]:text-accent transition-all">
              <Zap className="size-4" /> Page Speed
            </TabsTrigger>
            <TabsTrigger value="settings" className="gap-2 px-6 rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-lg data-[state=active]:text-accent transition-all">
              <Settings className="size-4" /> Settings
            </TabsTrigger>
          </TabsList>
          
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={fetchData} className="size-8 p-0 rounded-full border">
              <RefreshCw className="size-3.5 text-muted-foreground" />
            </Button>
            <div className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-full border text-[10px] font-bold uppercase tracking-wider transition-colors",
              isGoogleConnected ? "bg-green-50 border-green-200 text-green-700" : "bg-gray-50 border-gray-200 text-gray-400"
            )}>
              <Activity className="size-3" />
              Google {isGoogleConnected ? 'Sync Active' : 'Disconnected'}
            </div>
          </div>
        </div>

        {/* SITE KIT OVERVIEW */}
        <TabsContent value="overview" className="space-y-8 mt-0 outline-none">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <StatCard title="GA4 Traffic (28d)" value={gaLoading ? '...' : gaStats.users.toLocaleString()} icon={<Users className="size-5 text-accent" />} trend={isGoogleConnected ? "Active" : "Setup GA"} />
            <StatCard title="Search Clicks" value={scLoading ? '...' : scStats.clicks.toLocaleString()} icon={<MousePointer2 className="size-5 text-accent" />} trend={isGoogleConnected ? "Active" : "Setup SC"} />
            <StatCard title="Avg Search Pos." value={scLoading ? '...' : scStats.position.toFixed(1)} icon={<TrendingUp className="size-5 text-accent" />} trend={isGoogleConnected ? "Active" : "Setup SC"} />
            <StatCard title="Performance Score" value={psLoading ? '...' : psData ? `${Math.round(psData.scores.performance)}%` : '—'} icon={<Zap className="size-5 text-accent" />} trend={psData ? "Live" : "No Audit"} />
          </div>

          {!isGoogleConnected ? (
            <EmptyState
              icon={<ShieldAlert className="size-12 text-muted-foreground/30 mb-2" />}
              title="Google Services Connection Required"
              desc="To view search console queries, conversion funnels, and real-time site stats, link your Google properties."
              link="/admin/analytics?tab=settings"
              linkLabel="Go to Connection Settings"
            />
          ) : (
            <div className="grid gap-6 lg:grid-cols-3">
              {/* Site Kit Chart */}
              <Card className="lg:col-span-2 border-primary/5 shadow-sm rounded-2xl">
                <CardHeader className="flex flex-row items-center justify-between pb-4">
                  <div>
                    <CardTitle className="text-sm font-bold">Search Clicks & Impressions (Last 28 Days)</CardTitle>
                    <CardDescription className="text-xs">Search Console Performance overview</CardDescription>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px] w-full">
                    {scLoading ? (
                      <div className="flex items-center justify-center h-full"><Loader2 className="animate-spin text-accent" /></div>
                    ) : scChartData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={scChartData}>
                          <defs>
                            <linearGradient id="clicks" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.2}/>
                              <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                            </linearGradient>
                            <linearGradient id="impressions" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.2}/>
                              <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.1} />
                          <XAxis dataKey="date" tickLine={false} axisLine={false} style={{ fontSize: '10px' }} />
                          <YAxis tickLine={false} axisLine={false} style={{ fontSize: '10px' }} />
                          <Tooltip />
                          <Legend verticalAlign="top" height={36}/>
                          <Area type="monotone" name="Clicks" dataKey="clicks" stroke="#4f46e5" strokeWidth={2} fillOpacity={1} fill="url(#clicks)" />
                          <Area type="monotone" name="Impressions" dataKey="impressions" stroke="#06b6d4" strokeWidth={2} fillOpacity={1} fill="url(#impressions)" />
                        </AreaChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full text-muted-foreground text-xs">
                        No performance data available. Please verify site configurations.
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Local database views */}
              <Card className="border-primary/5 shadow-sm rounded-2xl">
                <CardHeader>
                  <CardTitle className="text-sm font-bold">Top Performing Pages</CardTitle>
                  <CardDescription className="text-xs">Based on user analytics database</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {topPosts.length > 0 ? (
                    topPosts.map((post, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 rounded-xl border border-border/40 text-sm hover:bg-muted/30 transition-colors">
                        <div className="flex flex-col gap-0.5 truncate pr-4">
                          <span className="font-semibold truncate">{post.title}</span>
                          <span className="text-xs text-muted-foreground font-mono">/{post.slug}</span>
                        </div>
                        <div className="flex items-center gap-1.5 font-bold text-accent shrink-0">
                          <Eye className="size-3.5" />
                          {post.views?.toLocaleString() || 0}
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-muted-foreground text-center py-8">No content records found.</p>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        {/* SEARCH CONSOLE TAB */}
        <TabsContent value="search-console" className="space-y-6 mt-0 outline-none">
          {!isGoogleConnected || !scConfigured ? (
            <EmptyState
              icon={<Search className="size-12 text-muted-foreground/30 mb-2" />}
              title="Search Console Property Required"
              desc="Configure and verify your Search Console property in Integration Settings to analyze organic queries and search performance."
              link="/admin/analytics?tab=settings"
              linkLabel="Verify Search Console Site"
            />
          ) : scLoading ? (
            <div className="flex flex-col items-center justify-center py-20"><Loader2 className="animate-spin text-accent" /></div>
          ) : scError ? (
            <EmptyState icon={<ShieldAlert className="size-12 text-destructive mb-2" />} title="Search Console Error" desc={scError} />
          ) : (
            <div className="space-y-6">
              <div className="grid gap-6 md:grid-cols-4">
                <StatCard title="Clicks" value={scStats.clicks.toLocaleString()} icon={<MousePointer2 className="size-4" />} />
                <StatCard title="Impressions" value={scStats.impressions.toLocaleString()} icon={<Eye className="size-4" />} />
                <StatCard title="Avg. CTR" value={`${scStats.ctr.toFixed(2)}%`} icon={<TrendingUp className="size-4" />} />
                <StatCard title="Avg. Position" value={scStats.position.toFixed(1)} icon={<Activity className="size-4" />} />
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                {/* Search Console Keywords */}
                <Card className="border-primary/5 shadow-sm rounded-2xl">
                  <CardHeader>
                    <CardTitle className="text-sm font-bold">Top Search Queries</CardTitle>
                    <CardDescription className="text-xs">Keywords driving organic search traffic</CardDescription>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="divide-y">
                      {scData.topQueries?.rows?.length > 0 ? (
                        scData.topQueries.rows.map((row: any, idx: number) => (
                          <div key={idx} className="flex items-center justify-between px-6 py-3.5 text-sm hover:bg-muted/10 transition-colors">
                            <span className="font-semibold text-primary font-mono">{row.keys?.[0]}</span>
                            <div className="flex items-center gap-4 text-xs font-medium">
                              <span className="text-muted-foreground"><strong className="text-primary">{row.clicks}</strong> Clicks</span>
                              <span className="text-muted-foreground"><strong className="text-primary">{row.impressions}</strong> Impr</span>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-xs text-muted-foreground text-center py-8">No organic search queries registered.</p>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Top pages on Google */}
                <Card className="border-primary/5 shadow-sm rounded-2xl">
                  <CardHeader>
                    <CardTitle className="text-sm font-bold">Top Pages in Search Results</CardTitle>
                    <CardDescription className="text-xs">Pages with highest organic impressions</CardDescription>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="divide-y">
                      {scData.topPages?.rows?.length > 0 ? (
                        scData.topPages.rows.map((row: any, idx: number) => (
                          <div key={idx} className="flex items-center justify-between px-6 py-3.5 text-sm hover:bg-muted/10 transition-colors">
                            <span className="font-semibold text-primary font-mono truncate max-w-[280px]">{row.keys?.[0]?.replace(/https?:\/\/[^\/]+/, '') || '/'}</span>
                            <div className="flex items-center gap-4 text-xs font-medium shrink-0">
                              <span className="text-muted-foreground"><strong className="text-primary">{row.clicks}</strong> Clicks</span>
                              <span className="text-muted-foreground"><strong className="text-primary">{row.impressions}</strong> Impr</span>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-xs text-muted-foreground text-center py-8">No organic page impressions registered.</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </TabsContent>

        {/* GOOGLE ANALYTICS TAB */}
        <TabsContent value="google-analytics" className="space-y-6 mt-0 outline-none">
          {!isGoogleConnected || !gaConfigured ? (
            <EmptyState
              icon={<BarChart3 className="size-12 text-muted-foreground/30 mb-2" />}
              title="GA4 Sync Required"
              desc="Configure your Google Analytics GA4 Property ID in integration settings to start syncing detailed real-time active users and bounce rate performance."
              link="/admin/analytics?tab=settings"
              linkLabel="Link GA4 Property"
            />
          ) : gaLoading ? (
            <div className="flex flex-col items-center justify-center py-20"><Loader2 className="animate-spin text-accent" /></div>
          ) : gaError ? (
            <EmptyState icon={<ShieldAlert className="size-12 text-destructive mb-2" />} title="Google Analytics Error" desc={gaError} />
          ) : (
            <div className="space-y-6">
              <div className="grid gap-6 md:grid-cols-4">
                <StatCard title="Active Users" value={gaStats.users.toLocaleString()} icon={<Users className="size-4" />} />
                <StatCard title="Total Sessions" value={gaStats.sessions.toLocaleString()} icon={<Activity className="size-4" />} />
                <StatCard title="Bounce Rate" value={`${gaStats.bounceRate}%`} icon={<MousePointer2 className="size-4" />} />
                <StatCard title="Avg. Session Time" value={`${gaStats.sessionDuration}s`} icon={<TrendingUp className="size-4" />} />
              </div>

              {/* GA4 Sessions Area Chart */}
              <Card className="border-primary/5 shadow-sm rounded-2xl">
                <CardHeader>
                  <CardTitle className="text-sm font-bold">GA4 Traffic Volume (Daily)</CardTitle>
                  <CardDescription className="text-xs">Daily active users and session volume</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px] w-full">
                    {gaChartData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={gaChartData}>
                          <defs>
                            <linearGradient id="users" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.2}/>
                              <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.1} />
                          <XAxis dataKey="date" tickLine={false} axisLine={false} style={{ fontSize: '10px' }} />
                          <YAxis tickLine={false} axisLine={false} style={{ fontSize: '10px' }} />
                          <Tooltip />
                          <Legend verticalAlign="top" height={36}/>
                          <Area type="monotone" name="Active Users" dataKey="users" stroke="#f59e0b" strokeWidth={2} fillOpacity={1} fill="url(#users)" />
                        </AreaChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex items-center justify-center h-full text-muted-foreground text-xs">No analytics logs loaded.</div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Top Pages in GA */}
              <Card className="border-primary/5 shadow-sm rounded-2xl">
                <CardHeader>
                  <CardTitle className="text-sm font-bold">Top Performing Pages (GA4)</CardTitle>
                  <CardDescription className="text-xs">Most viewed pages and screen routes</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="divide-y">
                    {gaData.topPages?.rows?.length > 0 ? (
                      gaData.topPages.rows.map((row: any, idx: number) => (
                        <div key={idx} className="flex items-center justify-between px-6 py-3.5 text-sm hover:bg-muted/10 transition-colors">
                          <div className="flex flex-col gap-0.5 truncate max-w-[400px]">
                            <span className="font-semibold truncate text-primary">{row.dimensionValues?.[1]?.value || 'Page'}</span>
                            <span className="text-xs text-muted-foreground font-mono">{row.dimensionValues?.[0]?.value || '/'}</span>
                          </div>
                          <span className="font-bold text-accent shrink-0">{parseInt(row.metricValues?.[0]?.value || '0').toLocaleString()} Views</span>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-muted-foreground text-center py-8">No screen views logged.</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        {/* PAGESPEED TAB */}
        <TabsContent value="pagespeed" className="space-y-6 mt-0 outline-none">
          {psLoading ? (
            <div className="flex flex-col items-center justify-center py-32 space-y-4 animate-pulse">
              <Loader2 className="size-12 animate-spin text-primary/20" />
              <p className="text-sm text-muted-foreground font-medium">Running Lighthouse Audit...</p>
            </div>
          ) : psError ? (
            <EmptyState
              icon={<Zap className="size-12 text-destructive/20 mb-4" />}
              title="PageSpeed Analysis Error"
              desc={psError}
              link="https://console.developers.google.com/apis/library/pagespeedonline.googleapis.com"
              linkLabel="Open PageSpeed API settings"
            />
          ) : !psData ? (
            <EmptyState icon={<Zap className="size-12 text-primary/20 mb-4" />} title="No PageSpeed Data" desc="Analyze your site's performance and SEO health." />
          ) : (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard 
                  title="Performance" 
                  value={`${Math.round(psData.scores.performance)}%`} 
                  icon={<Zap className="size-4 text-yellow-500" />} 
                  trend={psData.scores.performance > 89 ? 'EXCELLENT' : psData.scores.performance > 49 ? 'GOOD' : 'POOR'}
                  trendLabel="Score Status"
                />
                <StatCard 
                  title="Accessibility" 
                  value={`${Math.round(psData.scores.accessibility)}%`} 
                  icon={<ShieldCheck className="size-4 text-blue-500" />} 
                  trend={psData.scores.accessibility > 89 ? 'EXCELLENT' : 'IMPROVE'}
                  trendLabel="Score Status"
                />
                <StatCard 
                  title="Best Practices" 
                  value={`${Math.round(psData.scores.bestPractices)}%`} 
                  icon={<ShieldCheck className="size-4 text-purple-500" />} 
                  trend={psData.scores.bestPractices > 89 ? 'SECURE' : 'OPTIMIZE'}
                  trendLabel="Score Status"
                />
                <StatCard 
                  title="SEO Score" 
                  value={`${Math.round(psData.scores.seo)}%`} 
                  icon={<Search className="size-4 text-green-500" />} 
                  trend={psData.scores.seo > 89 ? 'OPTIMIZED' : 'NEEDS WORK'}
                  trendLabel="Score Status"
                />
              </div>

              {/* Page Speed Performance Recommendations */}
              <Card className="border-primary/5 shadow-sm rounded-2xl">
                <CardHeader>
                  <CardTitle className="text-sm font-bold">Lighthouse Core Web Vitals</CardTitle>
                  <CardDescription className="text-xs">Real-time performance audits (Lighthouse Mobile API)</CardDescription>
                </CardHeader>
                <CardContent className="divide-y p-0">
                  <div className="flex items-center justify-between px-6 py-4">
                    <span className="text-sm font-medium">First Contentful Paint (FCP)</span>
                    <span className="font-bold text-primary font-mono">{psData.metrics?.firstContentfulPaint || '—'}</span>
                  </div>
                  <div className="flex items-center justify-between px-6 py-4">
                    <span className="text-sm font-medium">Speed Index</span>
                    <span className="font-bold text-primary font-mono">{psData.metrics?.speedIndex || '—'}</span>
                  </div>
                  <div className="flex items-center justify-between px-6 py-4">
                    <span className="text-sm font-medium">Total Blocking Time (TBT)</span>
                    <span className="font-bold text-primary font-mono">{psData.metrics?.totalBlockingTime || '—'}</span>
                  </div>
                  <div className="flex items-center justify-between px-6 py-4">
                    <span className="text-sm font-medium">Largest Contentful Paint (LCP)</span>
                    <span className="font-bold text-primary font-mono">{psData.metrics?.largestContentfulPaint || '—'}</span>
                  </div>
                  <div className="flex items-center justify-between px-6 py-4">
                    <span className="text-sm font-medium">Cumulative Layout Shift (CLS)</span>
                    <span className="font-bold text-primary font-mono">{psData.metrics?.cumulativeLayoutShift || '—'}</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        {/* SETTINGS TAB */}
        <TabsContent value="settings" className="space-y-6 mt-0 outline-none">
          <Card className="border-primary/10 shadow-xl rounded-3xl overflow-hidden">
            <CardHeader className="bg-primary/5 border-b border-primary/5 p-8">
              <CardTitle className="text-2xl font-bold">Integration Settings</CardTitle>
              <CardDescription className="text-sm">Manage connections to external Google APIs and properties.</CardDescription>
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
                  {gaConfigured && <CheckCircle2 className="size-5 text-green-500 mt-4 animate-pulse" />}
                </div>
                <div className="rounded-2xl border border-primary/5 p-6 bg-gray-50/50 flex flex-col justify-between">
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest mb-3">Search Console</p>
                    <p className="text-base font-bold text-primary">{scConfigured ? 'Site Verified' : 'Needs Config'}</p>
                    <p className="text-xs text-muted-foreground mt-1">{scConfigured ? 'Google Search insights are currently active.' : 'Connect your site URL to see keyword rankings.'}</p>
                  </div>
                  {scConfigured && <CheckCircle2 className="size-5 text-green-500 mt-4 animate-pulse" />}
                </div>
              </div>

              {isGoogleConnected && userId && (
                <div className="pt-6 border-t border-primary/5">
                   <GooglePropertySetup
                    isConnected={isGoogleConnected}
                    userId={userId}
                    onConfigSaved={refreshConfig}
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

function StatCard({ title, value, icon, trend, trendLabel }: { title: string; value: string; icon: React.ReactNode; trend?: string, trendLabel?: string }) {
  return (
    <Card className="border-primary/5 shadow-sm hover:shadow-md transition-all duration-300 group">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <CardTitle className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">{title}</CardTitle>
        <div className="size-8 rounded-xl bg-primary/5 flex items-center justify-center group-hover:bg-accent/10 transition-colors">
          {icon}
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-black text-primary tracking-tight tabular-nums">{value}</div>
        {trend && (
          <div className="flex items-center gap-1.5 mt-2">
            <span className={cn(
              "text-[10px] font-black px-1.5 py-0.5 rounded-full",
              trend === 'POOR' || trend === 'NEEDS WORK' ? "bg-red-50 text-red-600" :
              trend === 'GOOD' || trend === 'OPTIMIZE' ? "bg-yellow-50 text-yellow-600" :
              "bg-green-50 text-green-600"
            )}>{trend}</span>
            <span className="text-[10px] font-bold text-muted-foreground">{trendLabel || 'vs last month'}</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function EmptyState({ icon, title, desc, link, linkLabel }: { icon: React.ReactNode; title: string; desc: string; link?: string; linkLabel?: string }) {
  const isApiDisabled = !!link || desc.toLowerCase().includes('google cloud console') || desc.includes('googleapis.com')
  const apiLink = link ?? "https://console.developers.google.com/apis/api/analyticsdata.googleapis.com/overview"
  const buttonLabel = linkLabel ?? 'Open Google API settings'

  return (
    <Card className="flex flex-col items-center justify-center py-20 text-center border-dashed border-2 bg-gray-50/30 rounded-3xl animate-in zoom-in-95 duration-500">
      <div className="mb-4 bg-white p-6 rounded-full shadow-sm border border-primary/5">{icon}</div>
      <h3 className="font-bold text-primary text-lg px-6">{title}</h3>
      <p className="text-sm text-muted-foreground max-w-sm mt-2 leading-relaxed px-8">{desc}</p>
      
      {isApiDisabled && (
        <Button asChild className="mt-6 rounded-xl bg-primary hover:bg-primary/90 gap-2 px-8">
          <a href={apiLink} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="size-4" />
            {buttonLabel}
          </a>
        </Button>
      )}

      {title.includes('Permission') && (
        <Button asChild variant="outline" className="mt-6 rounded-xl gap-2 px-8">
          <a href="https://search.google.com/search-console" target="_blank" rel="noopener noreferrer">
            <ExternalLink className="size-4" />
            Check Search Console Permissions
          </a>
        </Button>
      )}
    </Card>
  )
}
