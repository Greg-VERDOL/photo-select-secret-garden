
-- Add free_photo_limit column to galleries table
ALTER TABLE public.galleries 
ADD COLUMN free_photo_limit INTEGER DEFAULT 5;

-- Create a settings table for global app settings
CREATE TABLE public.app_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  value TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on app_settings (admin only access)
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

-- Policy to allow all operations on app_settings (since this is admin only)
CREATE POLICY "Admin full access to app_settings" ON public.app_settings
FOR ALL USING (true);

-- Create payment_sessions table to track Stripe payment sessions
CREATE TABLE public.payment_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gallery_id UUID NOT NULL REFERENCES public.galleries(id) ON DELETE CASCADE,
  client_email TEXT NOT NULL,
  stripe_session_id TEXT UNIQUE NOT NULL,
  extra_photos_count INTEGER NOT NULL,
  amount_cents INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, completed, failed
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on payment_sessions
ALTER TABLE public.payment_sessions ENABLE ROW LEVEL SECURITY;

-- Policy to allow all operations on payment_sessions
CREATE POLICY "Full access to payment_sessions" ON public.payment_sessions
FOR ALL USING (true);

-- Insert default settings
INSERT INTO public.app_settings (key, value) VALUES 
('price_per_extra_photo_cents', '500'),
('stripe_connected', 'false')
ON CONFLICT (key) DO NOTHING;
