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

// POST /api/google/search-console/sites
export async function POST(request: Request) {
  try {
    const { siteUrl, autoVerify = false } = await request.json();
    if (!siteUrl) return NextResponse.json({ error: 'siteUrl is required' }, { status: 400 });

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const auth = await getAuthedGoogleClient(user.id);
    const searchconsole = google.searchconsole({ version: 'v1', auth });

    const { data: site } = await searchconsole.sites.add({ siteUrl });
    let verificationResult: any = { verified: true };

    if (autoVerify) {
      const siteVerification = google.siteVerification({ version: 'v1', auth });
      try {
        const { data: verified } = await siteVerification.webResource.insert({
          verificationMethod: 'META',
          requestBody: {
            site: {
              type: 'SITE',
              identifier: siteUrl,
            },
          },
        });
        verificationResult = { verified: true, resource: verified };
      } catch (verifyError: any) {
        const tokenResponse = await siteVerification.webResource.getToken({
          requestBody: {
            site: {
              type: 'SITE',
              identifier: siteUrl,
            },
            verificationMethod: 'META',
          },
        });

        verificationResult = {
          verified: false,
          error: verifyError?.message || 'Verification failed',
          token: tokenResponse.data,
        };
      }
    }

    return NextResponse.json({ site, verificationResult });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST /api/google/search-console/sites
export async function POST(request: Request) {
  try {
    const { siteUrl } = await request.json();
    if (!siteUrl) return NextResponse.json({ error: 'siteUrl is required' }, { status: 400 });

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const auth = await getAuthedGoogleClient(user.id);
    const searchconsole = google.searchconsole({ version: 'v1', auth });

    const { data } = await searchconsole.sites.add({ siteUrl });
    return NextResponse.json({ site: data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
