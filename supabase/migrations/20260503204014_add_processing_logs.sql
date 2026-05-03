-- Migration: Add processing_logs table for Sermon AI Link Processor
-- Feature: sermon-ai-link-processor
-- Requirements: 8.3, 11.2

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $func$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$func$ LANGUAGE plpgsql;

-- Create processing_logs table
CREATE TABLE processing_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  link_url TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  error_message TEXT,
  duration_ms INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for efficient rate limiting queries (user_id, created_at DESC)
CREATE INDEX idx_processing_logs_user_created 
  ON processing_logs(user_id, created_at DESC);

-- Create indexes for monitoring queries (status, created_at DESC)
CREATE INDEX idx_processing_logs_status_created 
  ON processing_logs(status, created_at DESC);

-- Enable Row Level Security
ALTER TABLE processing_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can view only their own processing logs
CREATE POLICY "Users can view own processing logs"
  ON processing_logs FOR SELECT
  USING (auth.uid() = user_id);

-- RLS Policy: Service role can insert processing logs
CREATE POLICY "Service role can insert processing logs"
  ON processing_logs FOR INSERT
  WITH CHECK (true);

-- RLS Policy: Service role can update processing logs
CREATE POLICY "Service role can update processing logs"
  ON processing_logs FOR UPDATE
  USING (true);

-- Create trigger to automatically update updated_at timestamp
CREATE TRIGGER set_processing_logs_updated_at
  BEFORE UPDATE ON processing_logs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
