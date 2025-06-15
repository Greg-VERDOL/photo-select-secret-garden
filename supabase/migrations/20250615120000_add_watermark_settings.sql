
-- Add watermark settings to app_settings table
INSERT INTO public.app_settings (key, value) VALUES 
('watermark_text', '© PHOTO STUDIO'),
('watermark_style', 'corners')
ON CONFLICT (key) DO NOTHING;
