
-- Add center watermark text setting to app_settings table
INSERT INTO public.app_settings (key, value) VALUES 
('center_watermark_text', 'PROOF')
ON CONFLICT (key) DO NOTHING;
