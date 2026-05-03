import { NextResponse } from 'next/server';
import { google } from 'googleapis';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state'); // Contains user.id

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://kdcuganda.org';

  if (!code || !state) {
    return NextResponse.redirect(`${siteUrl}/admin/analytics?error=missing_code`);
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return NextResponse.redirect(`${siteUrl}/admin/analytics?error=missing_credentials`);
  }

  const oauth2Client = new google.auth.OAuth2(
    clientId,
    clientSecret,
    `${siteUrl}/api/google/callback`
  );

  try {
    const { tokens } = await oauth2Client.getToken(code);
    
    const supabase = createClient();
    
    const payload: any = {
      user_id: state,
      access_token: tokens.access_token,
      expiry_date: tokens.expiry_date,
      scope: tokens.scope,
      updated_at: new Date().toISOString(),
    }

    if (tokens.refresh_token) {
      payload.refresh_token = tokens.refresh_token
    }

    // Save to DB
    // We do an upsert so if they reconnect, it updates their tokens
    const { error } = await supabase.from('users_google_integrations').upsert(payload, { onConflict: 'user_id' });

    if (error) {
      console.error('Supabase Google Integration Save Error:', error);
      return NextResponse.redirect(`${siteUrl}/admin/analytics?error=db_save_failed`);
    }

    return NextResponse.redirect(`${siteUrl}/admin/analytics?success=google_connected`);
  } catch (error) {
    console.error('Google Callback Error:', error);
    return NextResponse.redirect(`${siteUrl}/admin/analytics?error=auth_failed`);
  }
}
