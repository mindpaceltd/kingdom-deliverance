import { google } from 'googleapis';
import { createClient } from '@/lib/supabase/server';

/**
 * Returns an authorized OAuth2 client for the current user.
 * Handles automatic token refresh.
 */
export async function getAuthedGoogleClient(userId: string) {
  const supabase = createClient();

  const { data: integration, error } = await supabase
    .from('users_google_integrations')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error || !integration) {
    throw new Error('Google account not connected.');
  }

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    `${process.env.NEXT_PUBLIC_SITE_URL}/api/google/callback`
  );

  oauth2Client.setCredentials({
    access_token: integration.access_token,
    refresh_token: integration.refresh_token,
    expiry_date: integration.expiry_date,
  });

  // Auto-refresh token if expired
  oauth2Client.on('tokens', async (tokens) => {
    if (tokens.access_token) {
      await supabase
        .from('users_google_integrations')
        .update({
          access_token: tokens.access_token,
          expiry_date: tokens.expiry_date,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId);
    }
  });

  return oauth2Client;
}
