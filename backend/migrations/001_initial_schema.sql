-- ============================
-- MAICA FULL DATABASE SETUP
-- ============================

-- ============================
-- PROFILES TABLE
-- ============================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY,
  first_name TEXT,
  last_name TEXT,
  push_tokens JSONB DEFAULT '[]'::jsonb,
  subscription_plan TEXT DEFAULT 'trial',
  trial_ends_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_profiles_created_at ON profiles(created_at);


-- ============================
-- PRODUCTS TABLE
-- ============================
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY,
  owner_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT,
  price NUMERIC(10,2) DEFAULT 0,
  cost_price NUMERIC(10,2) DEFAULT 0,
  qty INTEGER DEFAULT 0,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_products_owner_id ON products(owner_id);
CREATE INDEX IF NOT EXISTS idx_products_created_at ON products(created_at);


-- ============================
-- PRODUCT PHOTOS TABLE
-- ============================
CREATE TABLE IF NOT EXISTS product_photos (
  id UUID PRIMARY KEY,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_product_photos_product_id ON product_photos(product_id);


-- ============================
-- PASSWORD RESET TOKENS
-- ============================
CREATE TABLE IF NOT EXISTS password_resets (
  id UUID PRIMARY KEY,
  email TEXT,
  user_id UUID,
  token_hash TEXT,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_password_resets_email ON password_resets(email);


-- ============================
-- SALES TABLE
-- ============================
CREATE TABLE IF NOT EXISTS sales (
  id UUID PRIMARY KEY,
  owner_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  product_name TEXT,
  quantity INTEGER DEFAULT 1,
  unit_price NUMERIC(10,2),
  tax_rate NUMERIC(5,2) DEFAULT 7.5,
  discount NUMERIC(10,2) DEFAULT 0,
  tax_amount NUMERIC(10,2) DEFAULT 0,
  total NUMERIC(10,2),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sales_owner_id ON sales(owner_id);
CREATE INDEX IF NOT EXISTS idx_sales_created_at ON sales(created_at);


-- ============================
-- EXPENSES TABLE
-- ============================
CREATE TABLE IF NOT EXISTS expenses (
  id UUID PRIMARY KEY,
  owner_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  amount NUMERIC(10,2),
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_expenses_owner_id ON expenses(owner_id);


-- ============================
-- TRANSACTIONS TABLE
-- ============================
-- Unified transaction log for sales & expenses
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY,
  owner_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT CHECK (type IN ('sale','expense')),
  category TEXT,
  amount NUMERIC NOT NULL,
  description TEXT,
  date TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_transactions_owner_id ON transactions(owner_id);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);


-- ============================
-- ANALYTICS RPC: monthly_sales_last_n_months
-- ============================
DROP FUNCTION IF EXISTS monthly_sales_last_n_months(int);

CREATE OR REPLACE FUNCTION monthly_sales_last_n_months(n_months INT)
RETURNS TABLE (
  label TEXT,
  value NUMERIC
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    TO_CHAR(date_trunc('month', m.month), 'Mon YYYY') AS label,
    COALESCE(SUM(t.amount), 0) AS value
  FROM (
    SELECT generate_series(
      date_trunc('month', NOW()) - (n_months || ' months')::interval,
      date_trunc('month', NOW()),
      '1 month'
    ) AS month
  ) AS m
  LEFT JOIN transactions t
    ON t.type = 'sale'
    AND date_trunc('month', t.date) = date_trunc('month', m.month)
  GROUP BY m.month
  ORDER BY m.month ASC;
END;
$$;

-- Grant function execution to anon users (client calls)
GRANT EXECUTE ON FUNCTION monthly_sales_last_n_months TO anon;
GRANT EXECUTE ON FUNCTION monthly_sales_last_n_months TO authenticated;


-- ============================
-- ROW LEVEL SECURITY (RLS)
-- ============================
ALTER TABLE IF EXISTS profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS products ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS product_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS password_resets ENABLE ROW LEVEL SECURITY;

-- 1) PROFILES TABLE
-- Allow authenticated user to insert their own profile (id must match auth.uid)
CREATE POLICY IF NOT EXISTS profiles_insert_own ON profiles
  FOR INSERT USING (auth.role() = 'authenticated' OR auth.role() = 'service_role')
  WITH CHECK ((auth.role() = 'service_role') OR (id = auth.uid()));

-- Allow users to select/update/delete their own profile
CREATE POLICY IF NOT EXISTS profiles_select_own ON profiles
  FOR SELECT USING ((auth.role() = 'service_role') OR (id = auth.uid()));

CREATE POLICY IF NOT EXISTS profiles_update_own ON profiles
  FOR UPDATE USING ((auth.role() = 'service_role') OR (id = auth.uid()))
  WITH CHECK ((auth.role() = 'service_role') OR (id = auth.uid()));

CREATE POLICY IF NOT EXISTS profiles_delete_own ON profiles
  FOR DELETE USING ((auth.role() = 'service_role') OR (id = auth.uid()));

-- 2) PRODUCTS TABLE
-- Allow authenticated users to INSERT products with owner_id = auth.uid()
CREATE POLICY IF NOT EXISTS products_insert_owner ON products
  FOR INSERT USING (auth.role() = 'service_role' OR auth.role() = 'authenticated')
  WITH CHECK ((auth.role() = 'service_role') OR (owner_id = auth.uid()));

-- Allow users to SELECT their own products
CREATE POLICY IF NOT EXISTS products_select_owner ON products
  FOR SELECT USING ((auth.role() = 'service_role') OR (owner_id = auth.uid()));

-- Allow users to UPDATE / DELETE their own products
CREATE POLICY IF NOT EXISTS products_update_owner ON products
  FOR UPDATE USING ((auth.role() = 'service_role') OR (owner_id = auth.uid()))
  WITH CHECK ((auth.role() = 'service_role') OR (owner_id = auth.uid()));

CREATE POLICY IF NOT EXISTS products_delete_owner ON products
  FOR DELETE USING ((auth.role() = 'service_role') OR (owner_id = auth.uid()));

-- 3) TRANSACTIONS TABLE
-- Users can INSERT transactions for themselves (owner_id = auth.uid())
CREATE POLICY IF NOT EXISTS transactions_insert_owner ON transactions
  FOR INSERT USING (auth.role() = 'service_role' OR auth.role() = 'authenticated')
  WITH CHECK ((auth.role() = 'service_role') OR (owner_id = auth.uid()));

-- Users can SELECT only their transactions
CREATE POLICY IF NOT EXISTS transactions_select_owner ON transactions
  FOR SELECT USING ((auth.role() = 'service_role') OR (owner_id = auth.uid()));

-- Users can UPDATE or DELETE their transactions
CREATE POLICY IF NOT EXISTS transactions_update_owner ON transactions
  FOR UPDATE USING ((auth.role() = 'service_role') OR (owner_id = auth.uid()))
  WITH CHECK ((auth.role() = 'service_role') OR (owner_id = auth.uid()));

CREATE POLICY IF NOT EXISTS transactions_delete_owner ON transactions
  FOR DELETE USING ((auth.role() = 'service_role') OR (owner_id = auth.uid()));

-- 4) PRODUCT_PHOTOS TABLE
-- Users can SELECT only photos whose product is owned by them
CREATE POLICY IF NOT EXISTS product_photos_select_owner ON product_photos
  FOR SELECT USING (
    auth.role() = 'service_role' OR
    EXISTS (
      SELECT 1 FROM products p WHERE p.id = product_photos.product_id AND p.owner_id = auth.uid()
    )
  );

-- Allow inserting photo metadata only if product is owned by user
CREATE POLICY IF NOT EXISTS product_photos_insert_owner ON product_photos
  FOR INSERT USING (
    auth.role() = 'service_role' OR
    EXISTS (SELECT 1 FROM products p WHERE p.id = product_photos.product_id AND p.owner_id = auth.uid())
  ) WITH CHECK (
    auth.role() = 'service_role' OR
    EXISTS (SELECT 1 FROM products p WHERE p.id = product_photos.product_id AND p.owner_id = auth.uid())
  );

-- Allow delete by owner
CREATE POLICY IF NOT EXISTS product_photos_delete_owner ON product_photos
  FOR DELETE USING (
    auth.role() = 'service_role' OR
    EXISTS (SELECT 1 FROM products p WHERE p.id = product_photos.product_id AND p.owner_id = auth.uid())
  );

-- 5) PASSWORD_RESETS TABLE
-- Prevent client-side reads/inserts from anon users: only allow service role (server)
REVOKE ALL ON password_resets FROM public;

-- 6) GRANT PERMISSIONS
GRANT SELECT ON TABLE profiles TO authenticated;
GRANT SELECT ON TABLE products TO authenticated;
GRANT SELECT ON TABLE transactions TO authenticated;
GRANT SELECT ON TABLE product_photos TO authenticated;
