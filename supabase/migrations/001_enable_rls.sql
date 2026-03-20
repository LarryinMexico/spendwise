-- ============================================================
-- RLS Migration for ai-finance-dashboard
-- 使用 Clerk userId 作為 RLS 策略的基礎
-- 在 Supabase SQL Editor 中執行此腳本
-- ============================================================

-- -------------------------------------------------------
-- 1. 啟用 RLS（Row Level Security）至所有公開資料表
-- -------------------------------------------------------
ALTER TABLE public.accounts     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- -------------------------------------------------------
-- 2. 建立一個 helper function 來安全取得目前的 userId
--    這個值由後端 API 透過 SET LOCAL 注入
-- -------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_current_clerk_user_id()
RETURNS TEXT
LANGUAGE sql
STABLE
AS $$
  SELECT NULLIF(current_setting('app.current_user_id', TRUE), '')
$$;

-- -------------------------------------------------------
-- 3. transactions 資料表 RLS 策略
--    允許使用者只存取自己的交易記錄
-- -------------------------------------------------------
DROP POLICY IF EXISTS "Users can view own transactions"  ON public.transactions;
DROP POLICY IF EXISTS "Users can insert own transactions" ON public.transactions;
DROP POLICY IF EXISTS "Users can update own transactions" ON public.transactions;
DROP POLICY IF EXISTS "Users can delete own transactions" ON public.transactions;

CREATE POLICY "Users can view own transactions"
  ON public.transactions FOR SELECT
  USING (clerk_user_id = public.get_current_clerk_user_id());

CREATE POLICY "Users can insert own transactions"
  ON public.transactions FOR INSERT
  WITH CHECK (clerk_user_id = public.get_current_clerk_user_id());

CREATE POLICY "Users can update own transactions"
  ON public.transactions FOR UPDATE
  USING (clerk_user_id = public.get_current_clerk_user_id())
  WITH CHECK (clerk_user_id = public.get_current_clerk_user_id());

CREATE POLICY "Users can delete own transactions"
  ON public.transactions FOR DELETE
  USING (clerk_user_id = public.get_current_clerk_user_id());

-- -------------------------------------------------------
-- 4. accounts 資料表 RLS 策略
-- -------------------------------------------------------
DROP POLICY IF EXISTS "Users can view own accounts"  ON public.accounts;
DROP POLICY IF EXISTS "Users can insert own accounts" ON public.accounts;
DROP POLICY IF EXISTS "Users can update own accounts" ON public.accounts;
DROP POLICY IF EXISTS "Users can delete own accounts" ON public.accounts;

CREATE POLICY "Users can view own accounts"
  ON public.accounts FOR SELECT
  USING (clerk_user_id = public.get_current_clerk_user_id());

CREATE POLICY "Users can insert own accounts"
  ON public.accounts FOR INSERT
  WITH CHECK (clerk_user_id = public.get_current_clerk_user_id());

CREATE POLICY "Users can update own accounts"
  ON public.accounts FOR UPDATE
  USING (clerk_user_id = public.get_current_clerk_user_id())
  WITH CHECK (clerk_user_id = public.get_current_clerk_user_id());

CREATE POLICY "Users can delete own accounts"
  ON public.accounts FOR DELETE
  USING (clerk_user_id = public.get_current_clerk_user_id());

-- -------------------------------------------------------
-- 5. categories 資料表 RLS 策略
--    系統預設分類（is_system=true）所有人可讀
--    自訂分類只有本人可操作
-- -------------------------------------------------------
DROP POLICY IF EXISTS "Users can view categories"     ON public.categories;
DROP POLICY IF EXISTS "Users can insert own categories" ON public.categories;
DROP POLICY IF EXISTS "Users can update own categories" ON public.categories;
DROP POLICY IF EXISTS "Users can delete own categories" ON public.categories;

CREATE POLICY "Users can view categories"
  ON public.categories FOR SELECT
  USING (
    is_system = TRUE
    OR clerk_user_id = public.get_current_clerk_user_id()
  );

CREATE POLICY "Users can insert own categories"
  ON public.categories FOR INSERT
  WITH CHECK (clerk_user_id = public.get_current_clerk_user_id());

CREATE POLICY "Users can update own categories"
  ON public.categories FOR UPDATE
  USING (clerk_user_id = public.get_current_clerk_user_id())
  WITH CHECK (clerk_user_id = public.get_current_clerk_user_id());

CREATE POLICY "Users can delete own categories"
  ON public.categories FOR DELETE
  USING (
    clerk_user_id = public.get_current_clerk_user_id()
    AND is_system = FALSE
  );

-- -------------------------------------------------------
-- 6. 驗證：確認 RLS 已啟用
-- -------------------------------------------------------
SELECT
  tablename,
  rowsecurity AS rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('transactions', 'accounts', 'categories')
ORDER BY tablename;
