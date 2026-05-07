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
  MailIcon, MessageCircle, Eye, Loader2, CheckCircle,
  Zap, ExternalLink, Globe, MousePointer2, MapPin
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"
import { motion, AnimatePresence } from "framer-motion"

export function AnalyticsDashboard() {
  const [loading, setLoading] = React.useState(true)
  const [userId, setUserId] = React.useState<string | null>(null)
  const [topPosts, setTopPosts] = React.useState<any[]>([])
  const [dbStats, setDbStats] = React.useState({ users: 0, messages: 0, testimonies: 0, totalViews: 0 })
  const [vercelData, setVercelData] = React.useState<any>(null)
  const [psData, setPsData] = React.useState<any>(null)
  const [vercelLoading, setVercelLoading] = React.useState(false)
  const [psLoading, setPsLoading] = React.useState(false)
  const [vercelError, setVercelError] = React.useState<string | null>(null)
  const [psError, setPsError] = React.useState<string | null>(null)

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
        await Promise.all([
          fetchVercelData(),
          fetchPsData()
        ])
      }
      setLoading(false)
    }
    fetchData()
  }, [])

  async function fetchVercelData() {
    setVercelLoading(true)
    setVercelError(null)
    try {
      const res = await fetch('/api/vercel/analytics')
      const data = await res.json()
      if (res.ok) {
        setVercelData(data.analytics)
      } else {
        setVercelError(data.error || 'Failed to fetch Vercel data')
      }
    } catch (error: any) {
      setVercelError(error.message || 'Connection error')
    } finally {
      setVercelLoading(false)
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
            <TabsTrigger value="vercel" className="gap-2 px-6 rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-lg data-[state=active]:text-accent transition-all">
              <Globe className="size-4" /> Vercel Analytics
            </TabsTrigger>
            <TabsTrigger value="pagespeed" className="gap-2 px-6 rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-lg data-[state=active]:text-accent transition-all">
              <Zap className="size-4" /> Page Speed
            </TabsTrigger>
            <TabsTrigger value="settings" className="gap-2 px-6 rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-lg data-[state=active]:text-accent transition-all">
              <Settings className="size-4" /> Settings
            </TabsTrigger>
          </TabsList>
          
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border text-[10px] font-bold uppercase tracking-wider bg-blue-50 border-blue-200 text-blue-700">
              <Globe className="size-3" />
              Vercel Sync
            </div>
          </div>
        </div>

        {/* OVERVIEW */}
        <TabsContent value="overview" className="space-y-8 mt-0 outline-none">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <StatCard title="Total Views" value={dbStats.totalViews.toLocaleString()} icon={<Eye className="size-5 text-accent" />} trend="+12%" />
            <StatCard title="Registered Users" value={dbStats.users.toLocaleString()} icon={<Users className="size-5 text-accent" />} trend="+5%" />
            <StatCard title="Submissions" value={dbStats.messages.toLocaleString()} icon={<MailIcon className="size-5 text-accent" />} trend="+8%" />
            <StatCard title="Testimonies" value={dbStats.testimonies.toLocaleString()} icon={<MessageCircle className="size-5 text-accent" />} trend="+24%" />
          </div>
        </TabsContent>

        {/* VERCEL ANALYTICS */}
        <TabsContent value="vercel" className="space-y-6 mt-0 outline-none">
          {vercelLoading ? (
            <div className="flex flex-col items-center justify-center py-32 space-y-4 animate-pulse">
              <Loader2 className="size-12 animate-spin text-primary/20" />
              <p className="text-sm text-muted-foreground font-medium">Fetching Vercel Analytics...</p>
            </div>
          ) : vercelError ? (
            <EmptyState
              icon={<Globe className="size-12 text-destructive/20 mb-4" />}
              title="Vercel Analytics Error"
              desc={vercelError}
              link="https://vercel.com/account/settings/tokens"
              linkLabel="Get Vercel Access Token"
            />
          ) : !vercelData ? (
            <EmptyState icon={<Globe className="size-12 text-primary/20 mb-4" />} title="No Vercel Data" desc="Configure Vercel Analytics in Admin Settings > Integrations." />
          ) : (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard 
                  title="Page Views" 
                  value={(vercelData.pageViews || 0).toLocaleString()} 
                  icon={<Eye className="size-4 text-blue-500" />}
                  trend={vercelData.pageViews > 0 ? 'ACTIVE' : 'IDLE'}
                  trendLabel="Status"
                />
                <StatCard 
                  title="Unique Visitors" 
                  value={(vercelData.visitors || 0).toLocaleString()} 
                  icon={<Users className="size-4 text-green-500" />}
                  trend={vercelData.visitors > 0 ? 'TRACKING' : 'NONE'}
                  trendLabel="Status"
                />
                <StatCard 
                  title="Bounce Rate" 
                  value={`${Math.round(vercelData.bounceRate || 0)}%`} 
                  icon={<MousePointer2 className="size-4 text-purple-500" />}
                  trend={vercelData.bounceRate < 50 ? 'GOOD' : 'HIGH'}
                  trendLabel="Performance"
                />
                <StatCard 
                  title="Avg. Duration" 
                  value={`${Math.round(vercelData.averageSessionDuration || 0)}s`} 
                  icon={<TrendingUp className="size-4 text-orange-500" />}
                  trend={vercelData.averageSessionDuration > 30 ? 'ENGAGED' : 'SHORT'}
                  trendLabel="Engagement"
                />
              </div>

              {vercelData.topPages?.length > 0 && (
                <Card className="border-primary/5 shadow-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Top Pages</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {vercelData.topPages.slice(0, 5).map((page: any, idx: number) => (
                        <div key={idx} className="flex items-center justify-between p-2 rounded border border-border/50 text-sm">
                          <span className="text-muted-foreground truncate">{page.path || page.url || `Page ${idx + 1}`}</span>
                          <span className="font-bold text-primary">{page.visitors || page.views || 0}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {vercelData.topCountries?.length > 0 && (
                <Card className="border-primary/5 shadow-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Top Countries</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {vercelData.topCountries.slice(0, 5).map((country: any, idx: number) => (
                        <div key={idx} className="flex items-center justify-between p-2 rounded border border-border/50 text-sm">
                          <span className="flex items-center gap-2 text-muted-foreground">
                            <MapPin className="size-3" />
                            {country.country || `Country ${idx + 1}`}
                          </span>
                          <span className="font-bold text-primary">{country.visitors || 0}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </TabsContent>

        {/* PAGE SPEED */}
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
                icon={<Users className="size-4 text-blue-500" />} 
                trend={psData.scores.accessibility > 89 ? 'EXCELLENT' : 'IMPROVE'}
                trendLabel="Score Status"
              />
              <StatCard 
                title="Best Practices" 
                value={`${Math.round(psData.scores.bestPractices)}%`} 
                icon={<CheckCircle className="size-4 text-purple-500" />} 
                trend={psData.scores.bestPractices > 89 ? 'SECURE' : 'OPTIMIZE'}
                trendLabel="Score Status"
              />
              <StatCard 
                title="SEO Score" 
                value={`${Math.round(psData.scores.seo)}%`} 
                icon={<TrendingUp className="size-4 text-green-500" />} 
                trend={psData.scores.seo > 89 ? 'OPTIMIZED' : 'NEEDS WORK'}
                trendLabel="Score Status"
              />
            </div>
          )}
        </TabsContent>

        {/* SETTINGS */}
        <TabsContent value="settings" className="space-y-6 mt-0 outline-none">
          <Card className="border-primary/10 shadow-xl rounded-3xl overflow-hidden">
            <CardHeader className="bg-primary/5 border-b border-primary/5 p-8">
              <CardTitle className="text-2xl font-bold">Analytics Configuration</CardTitle>
              <CardDescription className="text-sm">Configure Vercel and PageSpeed integrations.</CardDescription>
            </CardHeader>
            <CardContent className="p-8 space-y-10">
              <section className="space-y-4">
                <h4 className="text-xs font-black uppercase tracking-widest text-primary/40 flex items-center gap-2">
                  <Globe className="size-3" /> Vercel Web Analytics
                </h4>
                <div className="rounded-2xl border border-primary/5 p-6 bg-gray-50/50">
                  <p className="text-sm text-muted-foreground mb-3">
                    The Vercel Access Token is configured in Admin Settings > Integrations.
                  </p>
                  <Button asChild variant="outline" className="gap-2">
                    <a href="/admin/settings" className="inline-flex">
                      <Settings className="size-4" />
                      Go to Settings
                    </a>
                  </Button>
                </div>
              </section>

              <section className="space-y-4">
                <h4 className="text-xs font-black uppercase tracking-widest text-primary/40 flex items-center gap-2">
                  <Zap className="size-3" /> PageSpeed Insights
                </h4>
                <div className="rounded-2xl border border-primary/5 p-6 bg-gray-50/50">
                  <p className="text-sm text-muted-foreground mb-3">
                    The PageSpeed API key is configured in Admin Settings > Integrations.
                  </p>
                  <Button asChild variant="outline" className="gap-2">
                    <a href="/admin/settings" className="inline-flex">
                      <Settings className="size-4" />
                      Go to Settings
                    </a>
                  </Button>
                </div>
              </section>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

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
  const [psData, setPsData] = React.useState<any>(null)
  const [gaLoading, setGaLoading] = React.useState(false)
  const [scLoading, setScLoading] = React.useState(false)
  const [psLoading, setPsLoading] = React.useState(false)
  const [gaError, setGaError] = React.useState<string | null>(null)
  const [scError, setScError] = React.useState<string | null>(null)
  const [psError, setPsError] = React.useState<string | null>(null)

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
      
      if (user) {
        await Promise.all([
          fetchGaData(),
          fetchScData(),
          fetchPsData()
        ])
      }
      setLoading(false)
    }
    fetchData()
  }, [])

  async function fetchGaData() {
    setGaLoading(true)
    setGaError(null)
    try {
      const res = await fetch('/api/google/data/analytics')
      const data = await res.json()
      if (res.ok) {
        setGaData(data)
      } else {
        setGaError(data.error || 'Failed to fetch GA data')
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

  async function refreshConfig() {
    if (!userId) return
    const supabase = createClient()
    const [
      { data: analyticsConfig },
      { data: searchConsoleConfig }
    ] = await Promise.all([
      supabase.from('analytics_config').select('property_id').eq('user_id', userId).single(),
      supabase.from('search_console_config').select('site_url').eq('user_id', userId).single()
    ])

    setGaConfigured(!!analyticsConfig?.property_id)
    setScConfigured(!!searchConsoleConfig?.site_url)
    
    await Promise.all([
      fetchGaData(),
      fetchScData(),
      fetchPsData()
    ])
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
    setPsData(null)
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
            <TabsTrigger value="pagespeed" className="gap-2 px-6 rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-lg data-[state=active]:text-accent transition-all">
              <Zap className="size-4" /> Page Speed
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
            <StatCard title="Total Views" value={dbStats.totalViews.toLocaleString()} icon={<Eye className="size-5 text-accent" />} trend="+12%" />
            <StatCard title="Registered Users" value={dbStats.users.toLocaleString()} icon={<Users className="size-5 text-accent" />} trend="+5%" />
            <StatCard title="Submissions" value={dbStats.messages.toLocaleString()} icon={<MailIcon className="size-5 text-accent" />} trend="+8%" />
            <StatCard title="Testimonies" value={dbStats.testimonies.toLocaleString()} icon={<MessageCircle className="size-5 text-accent" />} trend="+24%" />
          </div>
          {/* ... (rest of overview content) ... */}
        </TabsContent>

        {/* SEARCH CONSOLE */}
        <TabsContent value="search-console" className="space-y-6 mt-0 outline-none">
          {/* ... (search console content) ... */}
        </TabsContent>

        {/* PAGE SPEED */}
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
          )}
        </TabsContent>

        {/* GOOGLE ANALYTICS */}
        <TabsContent value="google-analytics" className="space-y-6 mt-0 outline-none">
          {/* ... (analytics content) ... */}
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
                  {gaConfigured && <CheckCircle className="size-5 text-green-500 mt-4" />}
                </div>
                <div className="rounded-2xl border border-primary/5 p-6 bg-gray-50/50 flex flex-col justify-between">
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest mb-3">Search Console</p>
                    <p className="text-base font-bold text-primary">{scConfigured ? 'Site Verified' : 'Needs Config'}</p>
                    <p className="text-xs text-muted-foreground mt-1">{scConfigured ? 'Google Search insights are currently active.' : 'Connect your site URL to see keyword rankings.'}</p>
                  </div>
                  {scConfigured && <CheckCircle className="size-5 text-green-500 mt-4" />}
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
        <div className="text-2xl font-black text-primary tracking-tight">{value}</div>
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
    <Card className="flex flex-col items-center justify-center py-24 text-center border-dashed border-2 bg-gray-50/30 rounded-3xl animate-in zoom-in-95 duration-500">
      <div className="mb-4 bg-white p-6 rounded-full shadow-sm border border-primary/5">{icon}</div>
      <h3 className="font-bold text-primary text-lg">{title}</h3>
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
