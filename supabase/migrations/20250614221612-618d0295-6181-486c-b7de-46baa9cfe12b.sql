
-- Create a clients table to store client information
CREATE TABLE public.clients (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT,
  access_code TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add a foreign key to galleries to link them with clients
ALTER TABLE public.galleries 
ADD COLUMN client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE;

-- Enable RLS on clients table
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

-- Create policies for clients table
CREATE POLICY "Admin can manage all clients" 
  ON public.clients 
  FOR ALL 
  USING (true);

CREATE POLICY "Clients can view their own data" 
  ON public.clients 
  FOR SELECT 
  USING (true);

-- Create a function to automatically create a client when a gallery is created
CREATE OR REPLACE FUNCTION public.create_client_for_gallery()
RETURNS TRIGGER AS $$
BEGIN
  -- Only create a client if client_name is provided and no client_id is set
  IF NEW.client_name IS NOT NULL AND NEW.client_id IS NULL THEN
    INSERT INTO public.clients (name, email, access_code)
    VALUES (NEW.client_name, NEW.client_email, NEW.access_code)
    RETURNING id INTO NEW.client_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically create clients
CREATE TRIGGER trigger_create_client_for_gallery
  BEFORE INSERT ON public.galleries
  FOR EACH ROW
  EXECUTE FUNCTION public.create_client_for_gallery();
