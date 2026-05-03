import { NextResponse } from 'next/server';
import { google } from 'googleapis';
import { createClient } from '@/lib/supabase/server';
import { getAuthedGoogleClient } from '@/lib/google/client';

export const dynamic = 'force-dynamic';

// GET /api/google/data/analytics
export async function GET() {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: config } = await supabase
      .from('analytics_config')
      .select('property_id')
      .eq('user_id', user.id)
      .single();

    if (!config?.property_id) {
      return NextResponse.json({ error: 'Analytics property not configured.' }, { status: 404 });
    }

    // Validate property ID format
    if (!config.property_id.startsWith('properties/')) {
      return NextResponse.json({ error: 'Invalid analytics property ID format.' }, { status: 400 });
    }

    const auth = await getAuthedGoogleClient(user.id);
    const analyticsData = google.analyticsdata({ version: 'v1beta', auth });

    const { data } = await analyticsData.properties.runReport({
      property: config.property_id,
      requestBody: {
        dateRanges: [{ startDate: '28daysAgo', endDate: 'today' }],
        metrics: [
          { name: 'activeUsers' },
          { name: 'sessions' },
          { name: 'bounceRate' },
          { name: 'averageSessionDuration' },
        ],
        dimensions: [{ name: 'date' }],
        orderBys: [{ dimension: { dimensionName: 'date' } }],
        limit: '28',
      },
    });

    // Top pages
    const { data: topPages } = await analyticsData.properties.runReport({
      property: config.property_id,
      requestBody: {
        dateRanges: [{ startDate: '28daysAgo', endDate: 'today' }],
        metrics: [{ name: 'screenPageViews' }],
        dimensions: [{ name: 'pagePath' }, { name: 'pageTitle' }],
        orderBys: [{ metric: { metricName: 'screenPageViews' }, desc: true }],
        limit: '5',
      },
    });

    return NextResponse.json({ report: data, topPages });
  } catch (err: any) {
    console.error('Analytics API error:', err);
    const status = err.message?.includes('Google account not connected') || err.message?.includes('Unauthorized')
      ? 401
      : 500;
    return NextResponse.json({ 
      error: err.message || 'Failed to fetch analytics data',
      details: process.env.NODE_ENV === 'development' ? err.stack : undefined
    }, { status });
  }
}
