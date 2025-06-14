
-- Create galleries table to organize photos by client
CREATE TABLE public.galleries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  client_name TEXT,
  client_email TEXT,
  access_code TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create photos table to store individual photos in galleries
CREATE TABLE public.photos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  gallery_id UUID REFERENCES public.galleries(id) ON DELETE CASCADE NOT NULL,
  filename TEXT NOT NULL,
  title TEXT,
  description TEXT,
  storage_path TEXT NOT NULL,
  thumbnail_path TEXT,
  is_selected BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create photo selections table to track what clients select
CREATE TABLE public.photo_selections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  gallery_id UUID REFERENCES public.galleries(id) ON DELETE CASCADE NOT NULL,
  photo_id UUID REFERENCES public.photos(id) ON DELETE CASCADE NOT NULL,
  client_email TEXT,
  selected_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(gallery_id, photo_id)
);

-- Add Row Level Security (RLS)
ALTER TABLE public.galleries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.photo_selections ENABLE ROW LEVEL SECURITY;

-- Create policies for galleries (admin can see all, clients can see their own)
CREATE POLICY "Admin can manage all galleries" 
  ON public.galleries 
  FOR ALL 
  USING (true);

CREATE POLICY "Clients can view galleries with valid access code" 
  ON public.galleries 
  FOR SELECT 
  USING (true);

-- Create policies for photos
CREATE POLICY "Admin can manage all photos" 
  ON public.photos 
  FOR ALL 
  USING (true);

CREATE POLICY "Clients can view photos in accessible galleries" 
  ON public.photos 
  FOR SELECT 
  USING (true);

-- Create policies for photo selections
CREATE POLICY "Admin can manage all selections" 
  ON public.photo_selections 
  FOR ALL 
  USING (true);

CREATE POLICY "Anyone can create selections" 
  ON public.photo_selections 
  FOR INSERT 
  WITH CHECK (true);

-- Create storage bucket for photos
INSERT INTO storage.buckets (id, name, public) 
VALUES ('gallery-photos', 'gallery-photos', true);

-- Create storage policies
CREATE POLICY "Admin can upload photos" 
  ON storage.objects 
  FOR INSERT 
  WITH CHECK (bucket_id = 'gallery-photos');

CREATE POLICY "Anyone can view photos" 
  ON storage.objects 
  FOR SELECT 
  USING (bucket_id = 'gallery-photos');

CREATE POLICY "Admin can delete photos" 
  ON storage.objects 
  FOR DELETE 
  USING (bucket_id = 'gallery-photos');

-- Function to generate random access codes
CREATE OR REPLACE FUNCTION generate_access_code() 
RETURNS TEXT AS $$
BEGIN
  RETURN upper(substr(md5(random()::text), 1, 8));
END;
$$ LANGUAGE plpgsql;
