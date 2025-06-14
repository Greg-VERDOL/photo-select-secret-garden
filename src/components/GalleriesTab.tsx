
import React, { useState, useEffect } from 'react';
import { FolderPlus } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import CreateGalleryForm from './CreateGalleryForm';
import GalleryList from './GalleryList';
import GalleryDetails from './GalleryDetails';
import PhotoPreviewModal from './PhotoPreviewModal';

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

const GalleriesTab: React.FC = () => {
  const [galleries, setGalleries] = useState<Gallery[]>([]);
  const [selectedGallery, setSelectedGallery] = useState<Gallery | null>(null);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchGalleries();
  }, []);

  useEffect(() => {
    if (selectedGallery) {
      fetchPhotos(selectedGallery.id);
    }
  }, [selectedGallery]);

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

  const handleGalleryCreated = () => {
    fetchGalleries();
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

  const openPhotoPreview = (photo: Photo) => {
    setSelectedPhoto(photo);
    setIsPreviewOpen(true);
  };

  const closePhotoPreview = () => {
    setSelectedPhoto(null);
    setIsPreviewOpen(false);
  };

  const navigatePhoto = (direction: 'prev' | 'next') => {
    if (!selectedPhoto) return;
    
    const currentIndex = photos.findIndex(p => p.id === selectedPhoto.id);
    let newIndex;
    
    if (direction === 'prev') {
      newIndex = currentIndex > 0 ? currentIndex - 1 : photos.length - 1;
    } else {
      newIndex = currentIndex < photos.length - 1 ? currentIndex + 1 : 0;
    }
    
    setSelectedPhoto(photos[newIndex]);
  };

  const deletePhoto = async (photoId: string, storagePath: string) => {
    try {
      const { error: storageError } = await supabase.storage
        .from('gallery-photos')
        .remove([storagePath]);

      if (storageError) throw storageError;

      const { error: dbError } = await supabase
        .from('photos')
        .delete()
        .eq('id', photoId);

      if (dbError) throw dbError;

      toast({
        title: "Photo deleted",
        description: "Photo removed from gallery.",
      });

      handlePhotoUploaded();
    } catch (error) {
      toast({
        title: "Delete failed",
        description: "Failed to delete photo",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Create New Gallery */}
      <CreateGalleryForm onGalleryCreated={handleGalleryCreated} />

      {/* Galleries Management */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Gallery List */}
        <div className="lg:col-span-1">
          <GalleryList
            galleries={galleries}
            selectedGallery={selectedGallery}
            onSelectGallery={handleSelectGallery}
            onGalleryDeleted={handleGalleryDeleted}
          />
        </div>

        {/* Gallery Management */}
        <div className="lg:col-span-2">
          {selectedGallery ? (
            <GalleryDetails
              gallery={selectedGallery}
              photos={photos}
              onPhotoUploaded={handlePhotoUploaded}
              onPhotoClick={openPhotoPreview}
              getPhotoUrl={getPhotoUrl}
            />
          ) : (
            <Card className="p-12 bg-white/5 border-white/10 text-center">
              <FolderPlus className="w-16 h-16 mx-auto mb-4 text-slate-400" />
              <h3 className="text-xl font-semibold mb-2">Select a Gallery</h3>
              <p className="text-slate-400">Choose a gallery from the list to manage photos</p>
            </Card>
          )}
        </div>
      </div>

      {/* Photo Preview Modal */}
      <PhotoPreviewModal
        photo={selectedPhoto}
        isOpen={isPreviewOpen}
        onClose={closePhotoPreview}
        onDelete={deletePhoto}
        getPhotoUrl={getPhotoUrl}
        photos={photos}
        onNavigate={navigatePhoto}
      />
    </div>
  );
};

export default GalleriesTab;
