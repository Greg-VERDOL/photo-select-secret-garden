
-- Create a function to handle photo selections with proper transaction handling
CREATE OR REPLACE FUNCTION public.handle_photo_selections(
  p_gallery_id UUID,
  p_client_email TEXT,
  p_photo_ids UUID[]
)
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
  -- Delete all existing selections for this client and gallery
  DELETE FROM public.photo_selections 
  WHERE gallery_id = p_gallery_id 
    AND client_email = p_client_email;
  
  -- Insert new selections if any photos are provided
  IF array_length(p_photo_ids, 1) > 0 THEN
    INSERT INTO public.photo_selections (photo_id, gallery_id, client_email)
    SELECT unnest(p_photo_ids), p_gallery_id, p_client_email;
  END IF;
END;
$$;
