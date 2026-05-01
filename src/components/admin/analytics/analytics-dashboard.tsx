"use client"

import * as React from "react"
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
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
  ArrowUpRight, 
  Users, 
  MousePointer2, 
  Search, 
  TrendingUp, 
  Globe,
  Settings,
  AlertCircle,
  ExternalLink,
  Info
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { createClient } from "@/lib/supabase/client"

// Mock data for the charts
const trafficData = [
  { name: "Jan", total: 1200 },
  { name: "Feb", total: 1800 },
  { name: "Mar", total: 1400 },
  { name: "Apr", total: 2200 },
  { name: "May", total: 2800 },
  { name: "Jun", total: 3100 },
]

const searchData = [
  { name: "Mon", clicks: 12, impressions: 140 },
  { name: "Tue", clicks: 18, impressions: 220 },
  { name: "Wed", clicks: 15, impressions: 180 },
  { name: "Thu", clicks: 22, impressions: 310 },
  { name: "Fri", clicks: 30, impressions: 450 },
  { name: "Sat", clicks: 25, impressions: 380 },
  { name: "Sun", clicks: 14, impressions: 190 },
]

export function AnalyticsDashboard() {
  const [loading, setLoading] = React.useState(true)
  const [topPosts, setTopPosts] = React.useState<any[]>([])

  React.useEffect(() => {
    async function fetchStats() {
      const supabase = createClient()
      const { data } = await supabase
        .from('posts')
        .select('title, views, slug')
        .order('views', { ascending: false })
        .limit(5)
      
      if (data) setTopPosts(data)
      setLoading(false)
    }
    fetchStats()
  }, [])

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
            <BarChart className="size-4" /> Google Analytics
          </TabsTrigger>
          <TabsTrigger value="settings" className="gap-2 px-4">
            <Settings className="size-4" /> Settings
          </TabsTrigger>
        </TabsList>
        
        <div className="flex gap-2">
           <Button variant="outline" size="sm" className="h-8 gap-2">
             <Calendar className="size-4" /> Last 28 Days
           </Button>
        </div>
      </div>

      {/* OVERVIEW TAB */}
      <TabsContent value="overview" className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard 
            title="Total Impressions" 
            value="14.2K" 
            change="+12.5%" 
            icon={<Search className="size-4 text-muted-foreground" />} 
          />
          <StatCard 
            title="Total Clicks" 
            value="892" 
            change="+5.4%" 
            icon={<MousePointer2 className="size-4 text-muted-foreground" />} 
          />
          <StatCard 
            title="Total Users" 
            value="3,421" 
            change="+18.2%" 
            icon={<Users className="size-4 text-muted-foreground" />} 
          />
          <StatCard 
            title="Avg. Session Duration" 
            value="2m 14s" 
            change="-2.1%" 
            icon={<TrendingUp className="size-4 text-muted-foreground" />} 
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
          <Card className="lg:col-span-4">
            <CardHeader>
              <CardTitle>Traffic Overview</CardTitle>
              <CardDescription>Unique visitors over the last 6 months</CardDescription>
            </CardHeader>
            <CardContent className="pl-2">
              <ResponsiveContainer width="100%" height={350}>
                <AreaChart data={trafficData}>
                  <defs>
                    <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#eab308" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#eab308" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis 
                    dataKey="name" 
                    stroke="#888888" 
                    fontSize={12} 
                    tickLine={false} 
                    axisLine={false} 
                  />
                  <YAxis 
                    stroke="#888888" 
                    fontSize={12} 
                    tickLine={false} 
                    axisLine={false} 
                    tickFormatter={(value) => `${value}`}
                  />
                  <Tooltip />
                  <Area 
                    type="monotone" 
                    dataKey="total" 
                    stroke="#eab308" 
                    fillOpacity={1} 
                    fill="url(#colorTotal)" 
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="lg:col-span-3">
            <CardHeader>
              <CardTitle>Top Performing Content</CardTitle>
              <CardDescription>Most viewed pages across the site</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-8">
                {topPosts.map((post) => (
                  <div key={post.slug} className="flex items-center">
                    <div className="space-y-1 flex-1">
                      <p className="text-sm font-medium leading-none line-clamp-1">{post.title}</p>
                      <p className="text-xs text-muted-foreground">/blog/{post.slug}</p>
                    </div>
                    <div className="ml-auto font-medium text-sm">
                      {post.views?.toLocaleString() || 0} <span className="text-xs text-muted-foreground font-normal">views</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </TabsContent>

      {/* SEARCH CONSOLE TAB */}
      <TabsContent value="search-console" className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Search Performance</CardTitle>
            <CardDescription>Clicks vs Impressions from Google Search</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={searchData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="clicks" fill="#eab308" radius={[4, 4, 0, 0]} />
                <Bar dataKey="impressions" fill="#94a3b8" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </TabsContent>

      {/* SETTINGS TAB */}
      <TabsContent value="settings" className="space-y-6">
         <div className="grid gap-6">
            <Card>
               <CardHeader>
                  <CardTitle>Google Service Connections</CardTitle>
                  <CardDescription>Connect your website to Google services to see data here.</CardDescription>
               </CardHeader>
               <CardContent className="space-y-6">
                  <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/30">
                     <div className="flex gap-4">
                        <div className="size-10 bg-white border rounded flex items-center justify-center">
                           <Search className="size-5 text-blue-500" />
                        </div>
                        <div>
                           <p className="font-semibold">Search Console</p>
                           <p className="text-xs text-muted-foreground">Monitor your site&apos;s visibility in Google Search results.</p>
                        </div>
                     </div>
                     <Button variant="outline" size="sm">Connect Service</Button>
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/30">
                     <div className="flex gap-4">
                        <div className="size-10 bg-white border rounded flex items-center justify-center">
                           <BarChart className="size-5 text-orange-500" />
                        </div>
                        <div>
                           <p className="font-semibold">Google Analytics</p>
                           <p className="text-xs text-muted-foreground">Track detailed visitor data and behavioral insights.</p>
                        </div>
                     </div>
                     <Button variant="outline" size="sm">Connect Service</Button>
                  </div>

                  <div className="pt-4 border-t space-y-4">
                     <h4 className="text-sm font-bold">Manual Integration</h4>
                     <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                           <Label>GA4 Measurement ID</Label>
                           <Input placeholder="G-XXXXXXXXXX" />
                        </div>
                        <div className="space-y-2">
                           <Label>Search Console Property URL</Label>
                           <Input placeholder="https://kdcuganda.org" />
                        </div>
                     </div>
                     <Button className="bg-accent text-primary hover:bg-accent/90">Save Settings</Button>
                  </div>
               </CardContent>
            </Card>
         </div>
      </TabsContent>

    </Tabs>
  )
}

function StatCard({ title, value, change, icon }: { title: string, value: string, change: string, icon: React.ReactNode }) {
  const isPositive = change.startsWith('+')
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className={cn(
          "text-xs font-medium",
          isPositive ? "text-green-600" : "text-red-600"
        )}>
          {change} <span className="text-muted-foreground font-normal">from last month</span>
        </p>
      </CardContent>
    </Card>
  )
}

function Calendar({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M8 2v4" />
      <path d="M16 2v4" />
      <rect width="18" height="18" x="3" y="4" rx="2" />
      <path d="M3 10h18" />
    </svg>
  )
}
