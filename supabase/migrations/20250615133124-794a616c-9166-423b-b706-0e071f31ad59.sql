
-- Create table for image access logging
CREATE TABLE public.image_access_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gallery_id UUID REFERENCES public.galleries(id) ON DELETE CASCADE,
  photo_id UUID REFERENCES public.photos(id) ON DELETE CASCADE,
  client_email TEXT NOT NULL,
  access_token TEXT NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  accessed_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  is_suspicious BOOLEAN DEFAULT false
);

-- Create table for secure viewing sessions
CREATE TABLE public.viewing_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gallery_id UUID REFERENCES public.galleries(id) ON DELETE CASCADE,
  client_email TEXT NOT NULL,
  session_token TEXT UNIQUE NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  max_views INTEGER DEFAULT 100,
  current_views INTEGER DEFAULT 0
);

-- Create table for download attempt tracking
CREATE TABLE public.download_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gallery_id UUID REFERENCES public.galleries(id) ON DELETE CASCADE,
  photo_id UUID REFERENCES public.photos(id) ON DELETE CASCADE,
  client_email TEXT NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  attempt_type TEXT NOT NULL, -- 'right_click', 'dev_tools', 'save_as', etc.
  blocked BOOLEAN DEFAULT true,
  attempted_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add indexes for performance
CREATE INDEX idx_image_access_logs_gallery_client ON public.image_access_logs(gallery_id, client_email);
CREATE INDEX idx_image_access_logs_expires ON public.image_access_logs(expires_at);
CREATE INDEX idx_viewing_sessions_token ON public.viewing_sessions(session_token);
CREATE INDEX idx_viewing_sessions_expires ON public.viewing_sessions(expires_at);
CREATE INDEX idx_download_attempts_gallery_client ON public.download_attempts(gallery_id, client_email);

-- Enable RLS on new tables
ALTER TABLE public.image_access_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.viewing_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.download_attempts ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (allow all access since these are admin-managed tables)
CREATE POLICY "Allow all access to image_access_logs" ON public.image_access_logs FOR ALL USING (true);
CREATE POLICY "Allow all access to viewing_sessions" ON public.viewing_sessions FOR ALL USING (true);
CREATE POLICY "Allow all access to download_attempts" ON public.download_attempts FOR ALL USING (true);
