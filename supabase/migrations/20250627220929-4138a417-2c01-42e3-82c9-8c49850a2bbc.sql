
-- Create table for tracking image chunks
CREATE TABLE IF NOT EXISTS public.image_chunks (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  photo_id uuid NOT NULL,
  chunk_index integer NOT NULL,
  chunk_token text NOT NULL UNIQUE,
  expires_at timestamp with time zone NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  accessed_at timestamp with time zone,
  client_email text NOT NULL,
  gallery_id uuid NOT NULL
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_image_chunks_token ON public.image_chunks(chunk_token);
CREATE INDEX IF NOT EXISTS idx_image_chunks_photo_id ON public.image_chunks(photo_id);
CREATE INDEX IF NOT EXISTS idx_image_chunks_expires_at ON public.image_chunks(expires_at);

-- Add chunk_id field to image_access_logs for tracking chunk access
ALTER TABLE public.image_access_logs 
ADD COLUMN IF NOT EXISTS chunk_id uuid REFERENCES public.image_chunks(id);

-- Add server-side watermark settings
INSERT INTO public.app_settings (key, value) VALUES 
('server_side_watermarking', 'true'),
('chunk_delivery_enabled', 'true'),
('image_chunk_count', '6'),
('chunk_token_expiry_minutes', '10')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

-- Function to cleanup expired chunks
CREATE OR REPLACE FUNCTION public.cleanup_expired_chunks()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  DELETE FROM public.image_chunks 
  WHERE expires_at < now();
END;
$$;
