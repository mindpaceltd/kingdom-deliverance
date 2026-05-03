import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

// GET /api/google/data/pagespeed
export async function GET() {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://kdcuganda.org';
    
    // PageSpeed Insights API endpoint
    const url = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(siteUrl)}&category=ACCESSIBILITY&category=BEST_PRACTICES&category=PERFORMANCE&category=SEO&strategy=mobile`;

    const res = await fetch(url);
    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error?.message || 'Failed to fetch PageSpeed data');
    }

    // Extract relevant metrics
    const lighthouse = data.lighthouseResult;
    const scores = {
      performance: lighthouse.categories.performance.score * 100,
      accessibility: lighthouse.categories.accessibility.score * 100,
      bestPractices: lighthouse.categories['best-practices'].score * 100,
      seo: lighthouse.categories.seo.score * 100,
    };

    return NextResponse.json({ scores, lighthouse });
  } catch (err: any) {
    console.error('PageSpeed API error:', err);
    return NextResponse.json({ 
      error: err.message || 'Failed to fetch PageSpeed data'
    }, { status: 500 });
  }
}
