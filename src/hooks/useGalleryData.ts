
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface Photo {
  id: string;
  gallery_id: string;
  filename: string;
  title?: string;
  description?: string;
  storage_path: string;
  thumbnail_path?: string;
}

interface Gallery {
  id: string;
  name: string;
  client_name?: string;
  client_email?: string;
  access_code: string;
  free_photo_limit?: number;
}

export const useGalleryData = () => {
  const { accessCode } = useParams<{ accessCode: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [gallery, setGallery] = useState<Gallery | null>(null);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);

  const getPhotoUrl = (storagePath: string) => {
    const { data } = supabase.storage
      .from('gallery-photos')
      .getPublicUrl(storagePath);
    return data.publicUrl;
  };

  const fetchGalleryData = async () => {
    try {
      // Fetch gallery info
      const { data: galleryData, error: galleryError } = await supabase
        .from('galleries')
        .select('*')
        .eq('access_code', accessCode)
        .single();

      if (galleryError || !galleryData) {
        toast({
          title: "Gallery not found",
          description: "Invalid access code or gallery doesn't exist.",
          variant: "destructive"
        });
        navigate('/');
        return;
      }

      setGallery(galleryData);

      // Fetch photos
      const { data: photosData, error: photosError } = await supabase
        .from('photos')
        .select('*')
        .eq('gallery_id', galleryData.id)
        .order('created_at', { ascending: false });

      if (photosError) throw photosError;

      // Transform photos with public URLs
      const photosWithUrls = photosData.map(photo => ({
        ...photo,
        url: getPhotoUrl(photo.storage_path),
        thumbnail: getPhotoUrl(photo.thumbnail_path || photo.storage_path)
      }));

      setPhotos(photosWithUrls as any);
    } catch (error) {
      toast({
        title: "Error loading gallery",
        description: "Failed to load gallery data.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (accessCode) {
      fetchGalleryData();
    }
  }, [accessCode]);

  return {
    gallery,
    photos,
    loading,
    getPhotoUrl
  };
};

export type { Photo, Gallery };
