-- 1. Create user_credits table
CREATE TABLE IF NOT EXISTS public.user_credits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    email TEXT UNIQUE NOT NULL,
    balance INTEGER NOT NULL DEFAULT 0,
    lifetime_earned INTEGER NOT NULL DEFAULT 0,
    lifetime_spent INTEGER NOT NULL DEFAULT 0,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Create credit_transactions table
CREATE TABLE IF NOT EXISTS public.credit_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    email TEXT NOT NULL,
    amount INTEGER NOT NULL, -- positive for earn, negative for spend
    transaction_type TEXT NOT NULL, -- purchase, spend, admin_adjustment, refund
    reference_id TEXT, -- payment_id, request_id
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Create service_pricing table
CREATE TABLE IF NOT EXISTS public.service_pricing (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    service_key TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    credit_cost INTEGER NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Seed initial service pricing
INSERT INTO public.service_pricing (service_key, name, credit_cost, is_active)
VALUES ('fire_service', 'Fire Service Prayer Request', 270, true)
ON CONFLICT (service_key) DO UPDATE SET credit_cost = 270;

-- 4. Create credit_packages table
CREATE TABLE IF NOT EXISTS public.credit_packages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    credits_amount INTEGER NOT NULL,
    price_usd NUMERIC(10, 2) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Seed initial credit packages
INSERT INTO public.credit_packages (name, credits_amount, price_usd)
VALUES 
  ('Starter', 100, 10.00),
  ('Basic', 270, 27.00),
  ('Growth', 500, 50.00),
  ('Pro', 1000, 100.00);

-- 5. Create fire_service_requests table
CREATE TABLE IF NOT EXISTS public.fire_service_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT NOT NULL,
    country TEXT NOT NULL,
    phone TEXT NOT NULL,
    attendance_mode TEXT NOT NULL, -- In Person, Online
    prayer_focus_areas TEXT[] NOT NULL,
    prayer_request_details TEXT NOT NULL,
    attachment_url TEXT,
    credits_used INTEGER,
    payment_method TEXT NOT NULL, -- credits, pesapal, vow
    status TEXT NOT NULL DEFAULT 'pending', -- pending, completed, cancelled
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.user_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_pricing ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fire_service_requests ENABLE ROW LEVEL SECURITY;

-- Add base RLS policies (adjust as needed for full access control)
CREATE POLICY "Users can view own credits" ON public.user_credits
    FOR SELECT USING (auth.jwt() ->> 'email' = email OR auth.uid() = user_id);

CREATE POLICY "Users can view own transactions" ON public.credit_transactions
    FOR SELECT USING (auth.jwt() ->> 'email' = email OR auth.uid() = user_id);

CREATE POLICY "Anyone can view active service pricing" ON public.service_pricing
    FOR SELECT USING (is_active = true);

CREATE POLICY "Anyone can view active credit packages" ON public.credit_packages
    FOR SELECT USING (is_active = true);

CREATE POLICY "Users can view own fire service requests" ON public.fire_service_requests
    FOR SELECT USING (auth.jwt() ->> 'email' = email OR auth.uid() = user_id);

CREATE POLICY "Users can create fire service requests" ON public.fire_service_requests
    FOR INSERT WITH CHECK (true);

-- Add global setting for exchange rate
INSERT INTO public.site_settings (key, value)
VALUES ('credits_per_usd', '10')
ON CONFLICT (key) DO UPDATE SET value = '10';
