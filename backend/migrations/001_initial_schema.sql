-- MaiCa Initial Schema
-- Create tables for Supabase PostgreSQL database

-- Profiles table (extended auth)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name TEXT,
  last_name TEXT,
  push_tokens JSONB DEFAULT '[]'::jsonb,
  subscription_plan TEXT DEFAULT 'trial',
  trial_ends_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Products table
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT,
  price NUMERIC(10,2) DEFAULT 0,
  cost_price NUMERIC(10,2) DEFAULT 0,
  qty INTEGER DEFAULT 0,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Product photos
CREATE TABLE IF NOT EXISTS product_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sales transactions
CREATE TABLE IF NOT EXISTS sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
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

-- Expenses
CREATE TABLE IF NOT EXISTS expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  amount NUMERIC(10,2),
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Transactions (unified transaction log)
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  category TEXT,
  amount NUMERIC(10,2),
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Password resets
CREATE TABLE IF NOT EXISTS password_resets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  token_hash TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_products_owner ON products(owner_id);
CREATE INDEX idx_sales_owner ON sales(owner_id);
CREATE INDEX idx_sales_created ON sales(created_at);
CREATE INDEX idx_expenses_owner ON expenses(owner_id);
CREATE INDEX idx_transactions_owner ON transactions(owner_id);
CREATE INDEX idx_password_resets_email ON password_resets(email);

-- Enable RLS (Row Level Security)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can view their own products" ON products
  FOR SELECT USING (auth.uid() = owner_id);

CREATE POLICY "Users can view their own sales" ON sales
  FOR SELECT USING (auth.uid() = owner_id);

CREATE POLICY "Users can view their own expenses" ON expenses
  FOR SELECT USING (auth.uid() = owner_id);
