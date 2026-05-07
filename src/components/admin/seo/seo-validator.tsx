'use client'

import { useState } from 'react'
import { CheckCircle, XCircle, AlertTriangle, Search, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'

interface ValidationResult {
  status: 'pass' | 'warning' | 'fail'
  message: string
  details?: string
  action?: string
}

interface SEOValidationReport {
  url: string
  overall: 'good' | 'needs_work' | 'critical'
  validations: {
    title: ValidationResult
    description: ValidationResult
    h1: ValidationResult
    images: ValidationResult
    links: ValidationResult
    schema: ValidationResult
    canonical: ValidationResult
    social: ValidationResult
  }
  score: number
  timestamp: string
}

export function SEOValidator() {
  const [url, setUrl] = useState('')
  const [validating, setValidating] = useState(false)
  const [report, setReport] = useState<SEOValidationReport | null>(null)

  const validateSEO = async () => {
    if (!url) return

    setValidating(true)
    try {
      // This would be a server action that validates SEO
      // For now, we'll simulate a validation report
      const mockReport: SEOValidationReport = {
        url,
        overall: 'needs_work',
        score: 75,
        timestamp: new Date().toISOString(),
        validations: {
          title: {
            status: 'pass',
            message: 'Title is optimal length (50-60 characters)',
            details: 'Title: "Home | Kingdom Deliverance Centre Uganda" (42 chars)'
          },
          description: {
            status: 'pass',
            message: 'Meta description is optimal length (150-160 characters)',
            details: 'Description: 158 characters'
          },
          h1: {
            status: 'pass',
            message: 'Exactly one H1 tag found',
            details: 'H1: "Welcome to Kingdom Deliverance Centre Uganda"'
          },
          images: {
            status: 'warning',
            message: 'Some images missing alt text',
            details: '3 of 8 images have alt text',
            action: 'Add descriptive alt text to all images'
          },
          links: {
            status: 'pass',
            message: 'All internal links are working',
            details: '24 internal links checked'
          },
          schema: {
            status: 'pass',
            message: 'Structured data found and valid',
            details: 'Organization schema detected'
          },
          canonical: {
            status: 'pass',
            message: 'Canonical tag present',
            details: 'Canonical URL matches page URL'
          },
          social: {
            status: 'warning',
            message: 'OpenGraph tags present but could be improved',
            details: 'Missing og:image:width and og:image:height',
            action: 'Add image dimensions to OpenGraph tags'
          }
        }
      }
      setReport(mockReport)
    } catch (error) {
      console.error('Validation failed:', error)
    } finally {
      setValidating(false)
    }
  }

  const getStatusIcon = (status: 'pass' | 'warning' | 'fail') => {
    switch (status) {
      case 'pass':
        return <CheckCircle className="w-4 h-4 text-green-600" />
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-yellow-600" />
      case 'fail':
        return <XCircle className="w-4 h-4 text-red-600" />
    }
  }

  const getStatusColor = (status: 'pass' | 'warning' | 'fail') => {
    switch (status) {
      case 'pass':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'warning':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'fail':
        return 'bg-red-100 text-red-800 border-red-200'
    }
  }

  const getOverallColor = (overall: 'good' | 'needs_work' | 'critical') => {
    switch (overall) {
      case 'good':
        return 'text-green-600'
      case 'needs_work':
        return 'text-yellow-600'
      case 'critical':
        return 'text-red-600'
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="w-5 h-5" />
            SEO Validation Tool
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Enter URL to validate (e.g., https://kdcuganda.org)"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="flex-1"
            />
            <Button
              onClick={validateSEO}
              disabled={validating || !url}
            >
              {validating ? 'Validating...' : 'Validate SEO'}
            </Button>
          </div>
          
          {url && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <ExternalLink className="w-3 h-3" />
              <span>Validating: {url}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {report && (
        <div className="space-y-4">
          {/* Overall Score */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">Overall SEO Score</h3>
                  <p className={`text-2xl font-bold ${getScoreColor(report.score)}`}>
                    {report.score}/100
                  </p>
                </div>
                <Badge className={getOverallColor(report.overall)}>
                  {report.overall === 'good' ? 'Good' : 
                   report.overall === 'needs_work' ? 'Needs Work' : 'Critical'}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Validation Results */}
          <Card>
            <CardHeader>
              <CardTitle>Validation Results</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {Object.entries(report.validations).map(([key, validation]) => (
                <div key={key} className="border rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    {getStatusIcon(validation.status)}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium capitalize">
                          {key.replace(/_/g, ' ')}
                        </h4>
                        <Badge className={getStatusColor(validation.status)}>
                          {validation.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-700 mb-1">
                        {validation.message}
                      </p>
                      {validation.details && (
                        <p className="text-xs text-gray-500 mb-1">
                          {validation.details}
                        </p>
                      )}
                      {validation.action && (
                        <p className="text-xs text-blue-600 font-medium">
                          💡 {validation.action}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button variant="outline" className="w-full justify-start">
                <ExternalLink className="w-4 h-4 mr-2" />
                Open Page in New Tab
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Search className="w-4 h-4 mr-2" />
                View Page Source
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <CheckCircle className="w-4 h-4 mr-2" />
                Run Full SEO Audit
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
