-- Enable Row Level Security on all tables
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own accounts" ON accounts;
DROP POLICY IF EXISTS "Users can insert own accounts" ON accounts;
DROP POLICY IF EXISTS "Users can update own accounts" ON accounts;
DROP POLICY IF EXISTS "Users can delete own accounts" ON accounts;
DROP POLICY IF EXISTS "Users can view own categories" ON categories;
DROP POLICY IF EXISTS "Users can insert own categories" ON categories;
DROP POLICY IF EXISTS "Users can update own categories" ON categories;
DROP POLICY IF EXISTS "Users can delete own categories" ON categories;
DROP POLICY IF EXISTS "Users can view own transactions" ON transactions;
DROP POLICY IF EXISTS "Users can insert own transactions" ON transactions;
DROP POLICY IF EXISTS "Users can update own transactions" ON transactions;
DROP POLICY IF EXISTS "Users can delete own transactions" ON transactions;

-- Helper function to extract clerk_user_id from JWT
CREATE OR REPLACE FUNCTION get_clerk_user_id()
RETURNS TEXT AS $$
BEGIN
  RETURN COALESCE(
    NULLIF(current_setting('request.jwt.claims', true), '')::json->>'sub',
    NULLIF(current_setting('app.current_user_id', true), '')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Accounts policies
CREATE POLICY "Users can view own accounts" ON accounts FOR SELECT USING (clerk_user_id = get_clerk_user_id());
CREATE POLICY "Users can insert own accounts" ON accounts FOR INSERT WITH CHECK (clerk_user_id = get_clerk_user_id());
CREATE POLICY "Users can update own accounts" ON accounts FOR UPDATE USING (clerk_user_id = get_clerk_user_id());
CREATE POLICY "Users can delete own accounts" ON accounts FOR DELETE USING (clerk_user_id = get_clerk_user_id());

-- Categories policies
CREATE POLICY "Users can view own categories" ON categories FOR SELECT USING (clerk_user_id = get_clerk_user_id());
CREATE POLICY "Users can insert own categories" ON categories FOR INSERT WITH CHECK (clerk_user_id = get_clerk_user_id());
CREATE POLICY "Users can update own categories" ON categories FOR UPDATE USING (clerk_user_id = get_clerk_user_id());
CREATE POLICY "Users can delete own categories" ON categories FOR DELETE USING (clerk_user_id = get_clerk_user_id());

-- Transactions policies
CREATE POLICY "Users can view own transactions" ON transactions FOR SELECT USING (clerk_user_id = get_clerk_user_id());
CREATE POLICY "Users can insert own transactions" ON transactions FOR INSERT WITH CHECK (clerk_user_id = get_clerk_user_id());
CREATE POLICY "Users can update own transactions" ON transactions FOR UPDATE USING (clerk_user_id = get_clerk_user_id());
CREATE POLICY "Users can delete own transactions" ON transactions FOR DELETE USING (clerk_user_id = get_clerk_user_id());
