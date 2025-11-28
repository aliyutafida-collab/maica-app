-- Add subscription fields to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS subscription_plan VARCHAR(50),
ADD COLUMN IF NOT EXISTS subscription_status VARCHAR(20) DEFAULT 'none',
ADD COLUMN IF NOT EXISTS subscription_provider VARCHAR(20),
ADD COLUMN IF NOT EXISTS subscription_reference VARCHAR(255),
ADD COLUMN IF NOT EXISTS subscription_expires_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Create subscription_history table
CREATE TABLE IF NOT EXISTS subscription_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  plan_key VARCHAR(50) NOT NULL,
  amount INTEGER NOT NULL,
  provider VARCHAR(20) NOT NULL,
  reference VARCHAR(255),
  status VARCHAR(20) DEFAULT 'active',
  started_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_subscription_history_user_id ON subscription_history(user_id);
CREATE INDEX IF NOT EXISTS idx_subscription_history_reference ON subscription_history(reference);

-- Enable RLS on subscription_history
ALTER TABLE subscription_history ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for subscription_history
CREATE POLICY "Users can view their own subscription history" ON subscription_history
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role can insert subscription history" ON subscription_history
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Service role can update subscription history" ON subscription_history
  FOR UPDATE USING (true);
