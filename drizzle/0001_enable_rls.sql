-- Enable RLS on all tables
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can manage own accounts" ON accounts;
DROP POLICY IF EXISTS "Users can manage own categories" ON categories;
DROP POLICY IF EXISTS "Users can manage own transactions" ON transactions;

-- Accounts policies
CREATE POLICY "Users can manage own accounts"
ON accounts
FOR ALL
USING (clerk_user_id = current_setting('app.current_user_id', true))
WITH CHECK (clerk_user_id = current_setting('app.current_user_id', true));

-- Categories policies
CREATE POLICY "Users can manage own categories"
ON categories
FOR ALL
USING (clerk_user_id = current_setting('app.current_user_id', true))
WITH CHECK (clerk_user_id = current_setting('app.current_user_id', true));

-- Transactions policies
CREATE POLICY "Users can manage own transactions"
ON transactions
FOR ALL
USING (clerk_user_id = current_setting('app.current_user_id', true))
WITH CHECK (clerk_user_id = current_setting('app.current_user_id', true));
