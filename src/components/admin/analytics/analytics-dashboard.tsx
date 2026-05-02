"use client"

import * as React from "react"
import { 
  BarChart as RechartsBarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from "recharts"
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Users, 
  MousePointer2, 
  Search, 
  TrendingUp, 
  Settings,
  MailIcon,
  MessageCircle,
  EyeIcon,
  Loader2,
  CheckCircleIcon
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"

export function AnalyticsDashboard() {
  const [loading, setLoading] = React.useState(true)
  const [topPosts, setTopPosts] = React.useState<any[]>([])
  
  // Real DB Stats
  const [stats, setStats] = React.useState({
    users: 0,
    messages: 0,
    testimonies: 0,
    totalViews: 0
  })

  // Settings state
  const [gaId, setGaId] = React.useState("")
  const [scUrl, setScUrl] = React.useState("")
  const [saving, setSaving] = React.useState(false)
  const [saveSuccess, setSaveSuccess] = React.useState(false)

  React.useEffect(() => {
    async function fetchData() {
      const supabase = createClient()
      
      // Fetch Top Posts
      const { data: posts } = await supabase
        .from('posts')
        .select('title, views, slug')
        .order('views', { ascending: false })
        .limit(5)
      
      if (posts) setTopPosts(posts)

      // Fetch DB Stats
      const [
        { count: userCount },
        { count: msgCount },
        { count: testCount },
        { data: allPosts }
      ] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('contact_submissions').select('*', { count: 'exact', head: true }),
        supabase.from('testimonies').select('*', { count: 'exact', head: true }),
        supabase.from('posts').select('views')
      ])

      const totalViews = allPosts?.reduce((acc, p) => acc + (p.views || 0), 0) || 0

      setStats({
        users: userCount || 0,
        messages: msgCount || 0,
        testimonies: testCount || 0,
        totalViews
      })

      // Fetch Settings
      const { data: settingsData } = await supabase
        .from('site_settings')
        .select('key, value')
        .in('key', ['ga_measurement_id', 'sc_property_url'])

      if (settingsData) {
        const s = new Map(settingsData.map(i => [i.key, i.value]))
        setGaId(s.get('ga_measurement_id') || "")
        setScUrl(s.get('sc_property_url') || "")
      }

      setLoading(false)
    }
    fetchData()
  }, [])

  async function handleSaveSettings() {
    setSaving(true)
    setSaveSuccess(false)
    const supabase = createClient()
    
    await supabase.from('site_settings').upsert([
      { key: 'ga_measurement_id', value: gaId },
      { key: 'sc_property_url', value: scUrl }
    ])

    setSaving(false)
    setSaveSuccess(true)
    setTimeout(() => setSaveSuccess(false), 3000)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        <Loader2 className="size-8 animate-spin" />
      </div>
    )
  }

  return (
    <Tabs defaultValue="overview" className="space-y-6">
      <div className="flex items-center justify-between">
        <TabsList className="bg-muted/50 p-1 border">
          <TabsTrigger value="overview" className="gap-2 px-4">
            <TrendingUp className="size-4" /> Overview
          </TabsTrigger>
          <TabsTrigger value="search-console" className="gap-2 px-4">
            <Search className="size-4" /> Search Console
          </TabsTrigger>
          <TabsTrigger value="google-analytics" className="gap-2 px-4">
            <RechartsBarChart className="size-4" /> Google Analytics
          </TabsTrigger>
          <TabsTrigger value="settings" className="gap-2 px-4">
            <Settings className="size-4" /> Settings
          </TabsTrigger>
        </TabsList>
      </div>

      {/* OVERVIEW TAB */}
      <TabsContent value="overview" className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard 
            title="Total Content Views" 
            value={stats.totalViews.toLocaleString()} 
            icon={<EyeIcon className="size-4 text-muted-foreground" />} 
          />
          <StatCard 
            title="Registered Users" 
            value={stats.users.toLocaleString()} 
            icon={<Users className="size-4 text-muted-foreground" />} 
          />
          <StatCard 
            title="Messages & Prayers" 
            value={stats.messages.toLocaleString()} 
            icon={<MailIcon className="size-4 text-muted-foreground" />} 
          />
          <StatCard 
            title="Testimonies" 
            value={stats.testimonies.toLocaleString()} 
            icon={<MessageCircle className="size-4 text-muted-foreground" />} 
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
          <Card className="lg:col-span-4 flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
            <TrendingUp className="size-12 opacity-20 mb-4" />
            <h3 className="font-semibold text-foreground">Traffic Chart Unavailable</h3>
            <p className="text-sm max-w-sm mt-1">Connect your Google Analytics Measurement ID in the Settings tab to visualize time-series traffic data here.</p>
          </Card>

          <Card className="lg:col-span-3">
            <CardHeader>
              <CardTitle>Top Performing Content</CardTitle>
              <CardDescription>Most viewed pages across the site</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-8">
                {topPosts.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No data available.</p>
                ) : (
                  topPosts.map((post) => (
                    <div key={post.slug} className="flex items-center">
                      <div className="space-y-1 flex-1">
                        <p className="text-sm font-medium leading-none line-clamp-1">{post.title}</p>
                        <p className="text-xs text-muted-foreground">/blog/{post.slug}</p>
                      </div>
                      <div className="ml-auto font-medium text-sm">
                        {post.views?.toLocaleString() || 0} <span className="text-xs text-muted-foreground font-normal">views</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </TabsContent>

      {/* SEARCH CONSOLE TAB */}
      <TabsContent value="search-console" className="space-y-6">
        <Card className="flex flex-col items-center justify-center py-24 text-center text-muted-foreground">
           <Search className="size-12 opacity-20 mb-4" />
           <h3 className="font-semibold text-foreground">Search Console Not Connected</h3>
           <p className="text-sm max-w-sm mt-1">Add your Search Console Property URL in the Settings tab to view impressions and click data.</p>
        </Card>
      </TabsContent>

      {/* GOOGLE ANALYTICS TAB */}
      <TabsContent value="google-analytics" className="space-y-6">
        <Card className="flex flex-col items-center justify-center py-24 text-center text-muted-foreground">
           <MousePointer2 className="size-12 opacity-20 mb-4" />
           <h3 className="font-semibold text-foreground">Analytics Not Connected</h3>
           <p className="text-sm max-w-sm mt-1">Add your Google Analytics Measurement ID in the Settings tab to view detailed traffic metrics.</p>
        </Card>
      </TabsContent>

      {/* SETTINGS TAB */}
      <TabsContent value="settings" className="space-y-6">
         <div className="grid gap-6">
            <Card>
               <CardHeader>
                  <CardTitle>Google Service Connections</CardTitle>
                  <CardDescription>Connect your website to Google services to enable advanced charts.</CardDescription>
               </CardHeader>
               <CardContent className="space-y-6">
                  <div className="pt-4 space-y-4">
                     <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                           <Label>GA4 Measurement ID</Label>
                           <Input 
                             placeholder="G-XXXXXXXXXX" 
                             value={gaId}
                             onChange={(e) => setGaId(e.target.value)}
                           />
                           <p className="text-[10px] text-muted-foreground">Required for the Traffic and Google Analytics charts.</p>
                        </div>
                        <div className="space-y-2">
                           <Label>Search Console Property URL</Label>
                           <Input 
                             placeholder="https://kdcuganda.org" 
                             value={scUrl}
                             onChange={(e) => setScUrl(e.target.value)}
                           />
                           <p className="text-[10px] text-muted-foreground">Required for the Search Console chart.</p>
                        </div>
                     </div>
                     <div className="flex items-center gap-4 pt-2">
                       <Button 
                         onClick={handleSaveSettings} 
                         disabled={saving}
                         className="bg-accent text-primary hover:bg-accent/90 min-w-[140px]"
                       >
                         {saving ? <Loader2 className="size-4 animate-spin" /> : "Save Settings"}
                       </Button>
                       {saveSuccess && <span className="text-sm font-medium text-green-600 flex items-center gap-1"><CheckCircleIcon className="size-4" /> Saved!</span>}
                     </div>
                  </div>
               </CardContent>
            </Card>
         </div>
      </TabsContent>

    </Tabs>
  )
}

function StatCard({ title, value, icon }: { title: string, value: string, icon: React.ReactNode }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground mt-1">
          Total recorded in database
        </p>
      </CardContent>
    </Card>
  )
}
