import { NextResponse } from 'next/server';
import { google } from 'googleapis';
import { createClient } from '@/lib/supabase/server';
import { GOOGLE_OAUTH_SCOPES } from '@/lib/google/scopes';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const requestUrl = new URL(request.url);
  const siteUrl = `${requestUrl.protocol}//${requestUrl.host}`;

  if (!clientId || !clientSecret) {
    return NextResponse.json({ error: 'Google OAuth credentials not configured.' }, { status: 500 });
  }

  const oauth2Client = new google.auth.OAuth2(
    clientId,
    clientSecret,
    `${siteUrl}/api/google/callback`
  );

  const scopes = [...GOOGLE_OAUTH_SCOPES]

  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes,
    prompt: 'consent',
    state: user.id, // Track the user through the redirect
  });

  return NextResponse.redirect(url);
}
