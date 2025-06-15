
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface Gallery {
  id: string;
  name: string;
  client_name?: string;
  client_email?: string;
  access_code: string;
  created_at: string;
  photo_count?: number;
}

interface Photo {
  id: string;
  gallery_id: string;
  filename: string;
  title?: string;
  description?: string;
  storage_path: string;
  thumbnail_path?: string;
  created_at: string;
}

export const useGalleryOperations = () => {
  const [galleries, setGalleries] = useState<Gallery[]>([]);
  const [selectedGallery, setSelectedGallery] = useState<Gallery | null>(null);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const { toast } = useToast();

  const fetchGalleries = async () => {
    try {
      const { data, error } = await supabase
        .from('galleries')
        .select(`
          *,
          photos(count)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const galleriesWithCount = data.map(gallery => ({
        ...gallery,
        photo_count: gallery.photos?.[0]?.count || 0
      }));

      setGalleries(galleriesWithCount);
    } catch (error) {
      toast({
        title: "Error fetching galleries",
        description: "Failed to load galleries",
        variant: "destructive"
      });
    }
  };

  const fetchPhotos = async (galleryId: string) => {
    try {
      const { data, error } = await supabase
        .from('photos')
        .select('*')
        .eq('gallery_id', galleryId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPhotos(data || []);
    } catch (error) {
      toast({
        title: "Error fetching photos",
        description: "Failed to load photos",
        variant: "destructive"
      });
    }
  };

  const handleGalleryDeleted = () => {
    if (selectedGallery) {
      setSelectedGallery(null);
      setPhotos([]);
    }
    fetchGalleries();
  };

  const handleSelectGallery = (gallery: Gallery) => {
    setSelectedGallery(gallery);
  };

  const handlePhotoUploaded = () => {
    if (selectedGallery) {
      fetchPhotos(selectedGallery.id);
    }
    fetchGalleries();
  };

  const getPhotoUrl = (storagePath: string) => {
    const { data } = supabase.storage
      .from('gallery-photos')
      .getPublicUrl(storagePath);
    return data.publicUrl;
  };

  return {
    galleries,
    selectedGallery,
    photos,
    fetchGalleries,
    fetchPhotos,
    handleGalleryDeleted,
    handleSelectGallery,
    handlePhotoUploaded,
    getPhotoUrl
  };
};
