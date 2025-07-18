-- Stripe Payment Integration Migration
-- This migration adds payment-related tables to support Stripe integration

-- Enable necessary extensions if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create payment-related enums
CREATE TYPE payment_status AS ENUM ('pending', 'processing', 'succeeded', 'failed', 'canceled', 'refunded');
CREATE TYPE subscription_status AS ENUM ('active', 'canceled', 'past_due', 'unpaid', 'trialing');
CREATE TYPE payment_method_type AS ENUM ('card', 'bank_account', 'sepa_debit', 'ideal', 'sofort');

-- Stripe customers table
CREATE TABLE stripe_customers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  stripe_customer_id TEXT UNIQUE NOT NULL,
  email TEXT,
  name TEXT,
  phone TEXT,
  address JSONB,
  shipping JSONB,
  tax_exempt TEXT DEFAULT 'none',
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id)
);

-- Payment methods table
CREATE TABLE payment_methods (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  stripe_payment_method_id TEXT UNIQUE NOT NULL,
  type payment_method_type NOT NULL,
  card_brand TEXT,
  card_last4 TEXT,
  card_exp_month INTEGER,
  card_exp_year INTEGER,
  billing_details JSONB,
  is_default BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Subscriptions table
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  stripe_subscription_id TEXT UNIQUE NOT NULL,
  stripe_customer_id TEXT NOT NULL,
  stripe_price_id TEXT NOT NULL,
  status subscription_status NOT NULL,
  current_period_start TIMESTAMP WITH TIME ZONE,
  current_period_end TIMESTAMP WITH TIME ZONE,
  cancel_at_period_end BOOLEAN DEFAULT false,
  canceled_at TIMESTAMP WITH TIME ZONE,
  trial_start TIMESTAMP WITH TIME ZONE,
  trial_end TIMESTAMP WITH TIME ZONE,
  quantity INTEGER DEFAULT 1,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Payments table
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  stripe_payment_intent_id TEXT UNIQUE NOT NULL,
  stripe_customer_id TEXT NOT NULL,
  subscription_id UUID REFERENCES subscriptions(id) ON DELETE SET NULL,
  amount INTEGER NOT NULL, -- Amount in cents
  currency TEXT DEFAULT 'usd',
  status payment_status NOT NULL,
  payment_method_id UUID REFERENCES payment_methods(id) ON DELETE SET NULL,
  description TEXT,
  receipt_url TEXT,
  refunded BOOLEAN DEFAULT false,
  refunded_at TIMESTAMP WITH TIME ZONE,
  refund_amount INTEGER,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Invoice items table for detailed billing
CREATE TABLE invoice_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  payment_id UUID NOT NULL REFERENCES payments(id) ON DELETE CASCADE,
  stripe_invoice_item_id TEXT UNIQUE,
  description TEXT NOT NULL,
  amount INTEGER NOT NULL, -- Amount in cents
  currency TEXT DEFAULT 'usd',
  quantity INTEGER DEFAULT 1,
  unit_amount INTEGER,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Usage records for metered billing
CREATE TABLE usage_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  stripe_usage_record_id TEXT UNIQUE,
  stripe_subscription_item_id TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
  action TEXT DEFAULT 'increment',
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Webhook events table for tracking Stripe webhooks
CREATE TABLE webhook_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  stripe_event_id TEXT UNIQUE NOT NULL,
  event_type TEXT NOT NULL,
  api_version TEXT,
  created_at_stripe TIMESTAMP WITH TIME ZONE,
  livemode BOOLEAN NOT NULL,
  request_id TEXT,
  request_idempotency_key TEXT,
  data JSONB NOT NULL,
  processed BOOLEAN DEFAULT false,
  processed_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX idx_stripe_customers_user_id ON stripe_customers(user_id);
CREATE INDEX idx_stripe_customers_stripe_id ON stripe_customers(stripe_customer_id);
CREATE INDEX idx_payment_methods_user_id ON payment_methods(user_id);
CREATE INDEX idx_payment_methods_stripe_id ON payment_methods(stripe_payment_method_id);
CREATE INDEX idx_payment_methods_default ON payment_methods(user_id, is_default) WHERE is_default = true;
CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_stripe_id ON subscriptions(stripe_subscription_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
CREATE INDEX idx_payments_user_id ON payments(user_id);
CREATE INDEX idx_payments_stripe_id ON payments(stripe_payment_intent_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_created_at ON payments(created_at DESC);
CREATE INDEX idx_invoice_items_payment_id ON invoice_items(payment_id);
CREATE INDEX idx_usage_records_user_id ON usage_records(user_id);
CREATE INDEX idx_usage_records_timestamp ON usage_records(timestamp DESC);
CREATE INDEX idx_webhook_events_stripe_id ON webhook_events(stripe_event_id);
CREATE INDEX idx_webhook_events_type ON webhook_events(event_type);
CREATE INDEX idx_webhook_events_processed ON webhook_events(processed);

-- Apply updated_at triggers
CREATE TRIGGER update_stripe_customers_updated_at BEFORE UPDATE ON stripe_customers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payment_methods_updated_at BEFORE UPDATE ON payment_methods
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON subscriptions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON payments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) Policies
ALTER TABLE stripe_customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_events ENABLE ROW LEVEL SECURITY;

-- Stripe customers policies
CREATE POLICY "Users can view their own stripe customer data" ON stripe_customers
    FOR SELECT USING (user_id IN (
        SELECT id FROM users WHERE firebase_uid = auth.uid()::text
    ));

CREATE POLICY "Users can update their own stripe customer data" ON stripe_customers
    FOR UPDATE USING (user_id IN (
        SELECT id FROM users WHERE firebase_uid = auth.uid()::text
    ));

CREATE POLICY "Users can insert their own stripe customer data" ON stripe_customers
    FOR INSERT WITH CHECK (user_id IN (
        SELECT id FROM users WHERE firebase_uid = auth.uid()::text
    ));

-- Payment methods policies
CREATE POLICY "Users can view their own payment methods" ON payment_methods
    FOR SELECT USING (user_id IN (
        SELECT id FROM users WHERE firebase_uid = auth.uid()::text
    ));

CREATE POLICY "Users can update their own payment methods" ON payment_methods
    FOR UPDATE USING (user_id IN (
        SELECT id FROM users WHERE firebase_uid = auth.uid()::text
    ));

CREATE POLICY "Users can insert their own payment methods" ON payment_methods
    FOR INSERT WITH CHECK (user_id IN (
        SELECT id FROM users WHERE firebase_uid = auth.uid()::text
    ));

CREATE POLICY "Users can delete their own payment methods" ON payment_methods
    FOR DELETE USING (user_id IN (
        SELECT id FROM users WHERE firebase_uid = auth.uid()::text
    ));

-- Subscriptions policies
CREATE POLICY "Users can view their own subscriptions" ON subscriptions
    FOR SELECT USING (user_id IN (
        SELECT id FROM users WHERE firebase_uid = auth.uid()::text
    ));

CREATE POLICY "Users can update their own subscriptions" ON subscriptions
    FOR UPDATE USING (user_id IN (
        SELECT id FROM users WHERE firebase_uid = auth.uid()::text
    ));

CREATE POLICY "Users can insert their own subscriptions" ON subscriptions
    FOR INSERT WITH CHECK (user_id IN (
        SELECT id FROM users WHERE firebase_uid = auth.uid()::text
    ));

-- Payments policies
CREATE POLICY "Users can view their own payments" ON payments
    FOR SELECT USING (user_id IN (
        SELECT id FROM users WHERE firebase_uid = auth.uid()::text
    ));

CREATE POLICY "Users can insert their own payments" ON payments
    FOR INSERT WITH CHECK (user_id IN (
        SELECT id FROM users WHERE firebase_uid = auth.uid()::text
    ));

-- Invoice items policies (read-only for users)
CREATE POLICY "Users can view their own invoice items" ON invoice_items
    FOR SELECT USING (payment_id IN (
        SELECT id FROM payments WHERE user_id IN (
            SELECT id FROM users WHERE firebase_uid = auth.uid()::text
        )
    ));

-- Usage records policies
CREATE POLICY "Users can view their own usage records" ON usage_records
    FOR SELECT USING (user_id IN (
        SELECT id FROM users WHERE firebase_uid = auth.uid()::text
    ));

CREATE POLICY "Users can insert their own usage records" ON usage_records
    FOR INSERT WITH CHECK (user_id IN (
        SELECT id FROM users WHERE firebase_uid = auth.uid()::text
    ));

-- Webhook events policies (admin only)
CREATE POLICY "Only service role can access webhook events" ON webhook_events
    FOR ALL USING (auth.role() = 'service_role');

-- Helper functions for payment operations
CREATE OR REPLACE FUNCTION get_user_subscription_tier(p_user_id UUID)
RETURNS subscription_tier AS $$
DECLARE
    tier subscription_tier;
BEGIN
    SELECT subscription_tier INTO tier
    FROM users
    WHERE id = p_user_id;
    
    RETURN COALESCE(tier, 'free');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION update_user_subscription_tier(p_user_id UUID, p_tier subscription_tier)
RETURNS VOID AS $$
BEGIN
    UPDATE users
    SET subscription_tier = p_tier,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get payment statistics
CREATE OR REPLACE FUNCTION get_payment_statistics(p_user_id UUID)
RETURNS JSONB AS $$
DECLARE
    stats JSONB;
BEGIN
    SELECT jsonb_build_object(
        'total_payments', COUNT(*),
        'total_amount', COALESCE(SUM(amount), 0),
        'successful_payments', COUNT(*) FILTER (WHERE status = 'succeeded'),
        'failed_payments', COUNT(*) FILTER (WHERE status = 'failed'),
        'refunded_amount', COALESCE(SUM(refund_amount), 0),
        'last_payment_date', MAX(created_at) FILTER (WHERE status = 'succeeded')
    ) INTO stats
    FROM payments
    WHERE user_id = p_user_id;
    
    RETURN stats;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 