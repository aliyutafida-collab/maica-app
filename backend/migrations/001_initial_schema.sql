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
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Users can view their own profile
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Users can view their own products
CREATE POLICY "Users can view own products" ON products
  FOR SELECT USING (auth.uid() = owner_id);

-- Users can manage their own products
CREATE POLICY "Users can manage own products" ON products
  FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update own products" ON products
  FOR UPDATE USING (auth.uid() = owner_id);

CREATE POLICY "Users can delete own products" ON products
  FOR DELETE USING (auth.uid() = owner_id);

-- Users can view their own sales
CREATE POLICY "Users can view own sales" ON sales
  FOR SELECT USING (auth.uid() = owner_id);

CREATE POLICY "Users can insert own sales" ON sales
  FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update own sales" ON sales
  FOR UPDATE USING (auth.uid() = owner_id);

CREATE POLICY "Users can delete own sales" ON sales
  FOR DELETE USING (auth.uid() = owner_id);

-- Users can view their own expenses
CREATE POLICY "Users can view own expenses" ON expenses
  FOR SELECT USING (auth.uid() = owner_id);

CREATE POLICY "Users can insert own expenses" ON expenses
  FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update own expenses" ON expenses
  FOR UPDATE USING (auth.uid() = owner_id);

CREATE POLICY "Users can delete own expenses" ON expenses
  FOR DELETE USING (auth.uid() = owner_id);

-- Users can view their own transactions
CREATE POLICY "Users can view own transactions" ON transactions
  FOR SELECT USING (auth.uid() = owner_id);

CREATE POLICY "Users can insert own transactions" ON transactions
  FOR INSERT WITH CHECK (auth.uid() = owner_id);
