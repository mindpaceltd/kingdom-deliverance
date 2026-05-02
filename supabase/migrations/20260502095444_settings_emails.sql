-- Add email configuration fields to site_settings table
ALTER TABLE site_settings 
ADD COLUMN IF NOT EXISTS contact_email text DEFAULT 'info@kdcuganda.org',
ADD COLUMN IF NOT EXISTS system_email text DEFAULT 'noreply@kdcuganda.org';
