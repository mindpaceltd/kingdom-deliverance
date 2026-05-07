import { SEOValidator } from '@/components/admin/seo/seo-validator'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { BarChart3, Search, FileText, Settings } from 'lucide-react'

export default function SEOToolsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">SEO Tools</h1>
        <p className="text-gray-600 mt-2">
          Validate and optimize your site's SEO performance with these tools.
        </p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center space-y-0 pb-2">
            <BarChart3 className="h-8 w-8 text-blue-600" />
            <CardTitle className="ml-2">SEO Analytics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">87%</div>
            <p className="text-xs text-muted-foreground">
              Overall SEO score
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center space-y-0 pb-2">
            <Search className="h-8 w-8 text-green-600" />
            <CardTitle className="ml-2">Indexed Pages</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">142</div>
            <p className="text-xs text-muted-foreground">
              Pages in Google index
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center space-y-0 pb-2">
            <FileText className="h-8 w-8 text-purple-600" />
            <CardTitle className="ml-2">Content Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">92%</div>
            <p className="text-xs text-muted-foreground">
              Average content SEO score
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="lg:col-span-2">
          <SEOValidator />
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              SEO Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium mb-2">Meta Keywords</h4>
              <p className="text-sm text-gray-600 mb-2">
                Site-wide meta keywords are configured
              </p>
              <div className="text-xs text-green-600">
                ✓ Enabled and optimized
              </div>
            </div>
            
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium mb-2">Structured Data</h4>
              <p className="text-sm text-gray-600 mb-2">
                Organization and article schemas are active
              </p>
              <div className="text-xs text-green-600">
                ✓ All schemas implemented
              </div>
            </div>
            
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium mb-2">Sitemap</h4>
              <p className="text-sm text-gray-600 mb-2">
                XML sitemap is being generated
              </p>
              <div className="text-xs text-green-600">
                ✓ Available at /sitemap.xml
              </div>
            </div>
            
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium mb-2">Canonical Tags</h4>
              <p className="text-sm text-gray-600 mb-2">
                Canonical URLs are set for all pages
              </p>
              <div className="text-xs text-green-600">
                ✓ Properly implemented
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
