import { NextResponse } from 'next/server';
import { google } from 'googleapis';
import { createClient } from '@/lib/supabase/server';
import { getAuthedGoogleClient } from '@/lib/google/client';

// GET /api/google/analytics/properties?accountId=accounts/123
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const accountId = searchParams.get('accountId');
    if (!accountId) return NextResponse.json({ error: 'accountId is required' }, { status: 400 });

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const auth = await getAuthedGoogleClient(user.id);
    const analyticsAdmin = google.analyticsadmin({ version: 'v1beta', auth });

    const { data } = await analyticsAdmin.properties.list({ filter: `parent:${accountId}` });
    return NextResponse.json({ properties: data.properties || [] });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
