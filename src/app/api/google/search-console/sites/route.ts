import { NextResponse } from 'next/server';
import { google } from 'googleapis';
import { createClient } from '@/lib/supabase/server';
import { getAuthedGoogleClient } from '@/lib/google/client';

// GET /api/google/search-console/sites
export async function GET() {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const auth = await getAuthedGoogleClient(user.id);
    const searchconsole = google.searchconsole({ version: 'v1', auth });

    const { data } = await searchconsole.sites.list();
    return NextResponse.json({ sites: data.siteEntry || [] });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
