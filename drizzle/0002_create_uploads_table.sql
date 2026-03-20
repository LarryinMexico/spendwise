-- Create uploads table to track CSV import batches
CREATE TABLE IF NOT EXISTS uploads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id TEXT NOT NULL,
  file_name TEXT NOT NULL,
  transaction_count INTEGER NOT NULL DEFAULT 0,
  date_range_start DATE,
  date_range_end DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add upload_id to transactions (no FK constraint for flexibility)
ALTER TABLE transactions 
ADD COLUMN IF NOT EXISTS upload_id UUID;

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_uploads_user_id ON uploads(clerk_user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_upload_id ON transactions(upload_id);

-- Enable RLS on uploads table
ALTER TABLE uploads ENABLE ROW LEVEL SECURITY;

-- RLS policies for uploads (using the same pattern as other tables)
DROP POLICY IF EXISTS "Users can view own uploads" ON uploads;
DROP POLICY IF EXISTS "Users can insert own uploads" ON uploads;
DROP POLICY IF EXISTS "Users can delete own uploads" ON uploads;

CREATE POLICY "Users can view own uploads" ON uploads FOR SELECT USING (clerk_user_id = get_clerk_user_id());
CREATE POLICY "Users can insert own uploads" ON uploads FOR INSERT WITH CHECK (clerk_user_id = get_clerk_user_id());
CREATE POLICY "Users can delete own uploads" ON uploads FOR DELETE USING (clerk_user_id = get_clerk_user_id());
