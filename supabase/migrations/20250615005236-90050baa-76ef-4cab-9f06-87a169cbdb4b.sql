
-- Clean up existing photo selections with empty or null client_email
DELETE FROM public.photo_selections 
WHERE client_email IS NULL OR client_email = '' OR trim(client_email) = '';

-- Add NOT NULL constraint to prevent empty client_email entries
ALTER TABLE public.photo_selections 
ALTER COLUMN client_email SET NOT NULL;

-- Add check constraint to prevent empty strings
ALTER TABLE public.photo_selections 
ADD CONSTRAINT client_email_not_empty CHECK (trim(client_email) != '');

-- Update the unique constraint to include client_email for better data integrity
ALTER TABLE public.photo_selections 
DROP CONSTRAINT IF EXISTS photo_selections_gallery_id_photo_id_key;

ALTER TABLE public.photo_selections 
ADD CONSTRAINT photo_selections_unique_selection UNIQUE (gallery_id, photo_id, client_email);
