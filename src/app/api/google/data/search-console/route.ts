import { NextResponse } from 'next/server';
import { google } from 'googleapis';
import { createClient } from '@/lib/supabase/server';
import { getAuthedGoogleClient } from '@/lib/google/client';

export const dynamic = 'force-dynamic';

// GET /api/google/data/search-console
export async function GET(request: Request) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: config } = await supabase
      .from('search_console_config')
      .select('site_url')
      .eq('user_id', user.id)
      .maybeSingle();

    if (!config?.site_url) {
      return NextResponse.json({ error: 'Search Console site not configured.' }, { status: 404 });
    }

    // Validate site URL format
    try {
      new URL(config.site_url);
    } catch {
      return NextResponse.json({ error: 'Invalid site URL format.' }, { status: 400 });
    }

    const requestUrl = new URL(request.url);
    const dateRangeStr = requestUrl.searchParams.get('range') || '28';
    const dateRange = parseInt(dateRangeStr) || 28;

    const auth = await getAuthedGoogleClient(user.id);
    const searchconsole = google.searchconsole({ version: 'v1', auth });

    const today = new Date();
    const endDate = today.toISOString().split('T')[0];
    const startDate = new Date(today.setDate(today.getDate() - dateRange)).toISOString().split('T')[0];

    // Summary data
    const { data: summary } = await searchconsole.searchanalytics.query({
      siteUrl: config.site_url,
      requestBody: {
        startDate,
        endDate,
        dimensions: ['date'],
        rowLimit: dateRange,
      },
    });

    // Top queries
    const { data: topQueries } = await searchconsole.searchanalytics.query({
      siteUrl: config.site_url,
      requestBody: {
        startDate,
        endDate,
        dimensions: ['query'],
        rowLimit: 10,
      },
    });

    // Top pages
    const { data: topPages } = await searchconsole.searchanalytics.query({
      siteUrl: config.site_url,
      requestBody: {
        startDate,
        endDate,
        dimensions: ['page'],
        rowLimit: 5,
      },
    });

    return NextResponse.json({ summary, topQueries, topPages });
  } catch (err: any) {
    console.error('Search Console API error:', err);
    const status = err.message?.includes('Google account not connected') || err.message?.includes('Unauthorized')
      ? 401
      : 500;
    return NextResponse.json({ 
      error: err.message || 'Failed to fetch search console data',
      details: process.env.NODE_ENV === 'development' ? err.stack : undefined
    }, { status });
  }
}
