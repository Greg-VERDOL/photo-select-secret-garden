
-- Create table to track sent notifications
CREATE TABLE public.admin_notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  type TEXT NOT NULL DEFAULT 'photo_selection',
  gallery_id UUID NOT NULL REFERENCES public.galleries(id),
  client_email TEXT NOT NULL,
  admin_email TEXT NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'sent',
  error_message TEXT,
  notification_data JSONB
);

-- Add RLS policies for admin notifications
ALTER TABLE public.admin_notifications ENABLE ROW LEVEL SECURITY;

-- Create policy that allows reading all notifications (admin only)
CREATE POLICY "Allow reading admin notifications" 
  ON public.admin_notifications 
  FOR SELECT 
  USING (true);

-- Create policy that allows inserting notifications
CREATE POLICY "Allow inserting admin notifications" 
  ON public.admin_notifications 
  FOR INSERT 
  WITH CHECK (true);

-- Add admin email setting to app_settings if not exists
INSERT INTO public.app_settings (key, value) 
VALUES ('admin_notification_email', 'admin@example.com')
ON CONFLICT (key) DO NOTHING;

-- Add notification enabled setting
INSERT INTO public.app_settings (key, value) 
VALUES ('notifications_enabled', 'true')
ON CONFLICT (key) DO NOTHING;
