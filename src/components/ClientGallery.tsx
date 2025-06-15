
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useGalleryData } from '@/hooks/useGalleryData';
import { usePhotoSelections } from '@/hooks/usePhotoSelections';
import { useLightbox } from '@/hooks/useLightbox';
import GalleryHeader from './GalleryHeader';
import PhotoGalleryGrid from './PhotoGalleryGrid';
import PhotoLightbox from './PhotoLightbox';
import SelectionModal from './SelectionModal';

const ClientGallery = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [showSelectionModal, setShowSelectionModal] = useState(false);
  
  const { gallery, photos, loading, getPhotoUrl } = useGalleryData();
  const { selectedPhotos, clientInfo, togglePhotoSelection } = usePhotoSelections(gallery);
  const { lightboxPhoto, setLightboxPhoto, navigateLightbox, closeLightbox } = useLightbox(photos);

  const handleSendSelection = () => {
    if (selectedPhotos.size === 0) {
      toast({
        title: "No photos selected",
        description: "Please select at least one photo before sending.",
        variant: "destructive"
      });
      return;
    }
    setShowSelectionModal(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 flex items-center justify-center text-white p-4">
        <div className="text-center">
          <div className="text-xl">Loading gallery...</div>
        </div>
      </div>
    );
  }

  if (!gallery) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 flex items-center justify-center text-white p-4">
        <div className="text-center">
          <h1 className="text-xl md:text-2xl font-bold mb-4">Gallery Not Found</h1>
          <Button onClick={() => navigate('/')} className="bg-blue-600 hover:bg-blue-700">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Access Form
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 text-white">
      <GalleryHeader
        gallery={gallery}
        selectedPhotosCount={selectedPhotos.size}
        onSendSelection={handleSendSelection}
      />

      <div className="max-w-7xl mx-auto p-3 md:p-6">
        <PhotoGalleryGrid
          photos={photos}
          selectedPhotos={selectedPhotos}
          onPhotoClick={setLightboxPhoto}
          onToggleSelection={togglePhotoSelection}
        />
      </div>

      <PhotoLightbox
        photo={lightboxPhoto}
        selectedPhotos={selectedPhotos}
        onClose={closeLightbox}
        onNavigate={navigateLightbox}
        onToggleSelection={togglePhotoSelection}
      />

      <SelectionModal
        isOpen={showSelectionModal}
        onClose={() => setShowSelectionModal(false)}
        selectedPhotos={Array.from(selectedPhotos)}
        photos={photos}
        onPhotoToggle={togglePhotoSelection}
        galleryId={gallery.id}
        clientEmail={clientInfo.email || gallery.client_email || ''}
        freePhotoLimit={gallery.free_photo_limit || 5}
        getPhotoUrl={getPhotoUrl}
      />
    </div>
  );
};

export default ClientGallery;
