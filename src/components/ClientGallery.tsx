
import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useGalleryData } from '@/hooks/useGalleryData';
import { usePhotoSelections } from '@/hooks/usePhotoSelections';
import { useLightbox } from '@/hooks/useLightbox';
import { useClientGalleryState } from '@/hooks/useClientGalleryState';
import { usePhotoNavigation } from '@/hooks/usePhotoNavigation';
import { useClientGalleryActions } from '@/hooks/useClientGalleryActions';
import GalleryHeader from './GalleryHeader';
import PhotoGalleryGrid from './PhotoGalleryGrid';
import PhotoLightbox from './PhotoLightbox';
import PhotoPreviewModal from './PhotoPreviewModal';
import SelectionModal from './SelectionModal';
import FullscreenPhotoModal from './FullscreenPhotoModal';
import { useTranslation } from 'react-i18next';

const ClientGallery = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  
  const { gallery, photos, loading, getPhotoUrl } = useGalleryData();
  const { selectedPhotos, clientInfo, togglePhotoSelection, selectAllPhotos, deselectAllPhotos } = usePhotoSelections(gallery);
  const { lightboxPhoto, setLightboxPhoto, navigateLightbox, closeLightbox } = useLightbox(photos);
  
  const {
    showSelectionModal,
    setShowSelectionModal,
    fullscreenPhoto,
    setFullscreenPhoto,
    previewPhoto,
    setPreviewPhoto
  } = useClientGalleryState();

  // Resolve the client email with better fallback logic
  const clientEmail = useMemo(() => {
    const email = clientInfo.email || gallery?.client_email || '';
    console.log('🔍 Resolved client email:', email, 'from clientInfo:', clientInfo.email, 'gallery:', gallery?.client_email);
    return email;
  }, [clientInfo.email, gallery?.client_email]);

  const { navigateFullscreen, navigatePreview } = usePhotoNavigation(photos);
  const { handleSendSelection, handleSelectAll } = useClientGalleryActions(
    selectedPhotos,
    photos,
    selectAllPhotos,
    setShowSelectionModal
  );

  const handlePhotoClick = (photo: any) => {
    setPreviewPhoto(photo);
  };

  const handleNavigateFullscreen = (direction: 'prev' | 'next') => {
    navigateFullscreen(direction, fullscreenPhoto, setFullscreenPhoto);
  };

  const handleNavigatePreview = (direction: 'prev' | 'next') => {
    navigatePreview(direction, previewPhoto, setPreviewPhoto);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 flex items-center justify-center text-white p-4">
        <div className="text-center">
          <div className="w-12 h-12 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <div className="text-xl mb-2">
            {t('clientGallery.loading')}
          </div>
          <div className="text-sm text-slate-300">
            {'Loading gallery data...'}
          </div>
        </div>
      </div>
    );
  }

  if (!gallery) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 flex items-center justify-center text-white p-4">
        <div className="text-center">
          <h1 className="text-xl md:text-2xl font-bold mb-4">{t('clientGallery.notFound')}</h1>
          <Button onClick={() => navigate('/')} className="bg-blue-600 hover:bg-blue-700">
            <ArrowLeft className="w-4 h-4 mr-2" />
            {t('clientGallery.backButton')}
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
          onPhotoClick={handlePhotoClick}
          onToggleSelection={togglePhotoSelection}
          onSelectAll={handleSelectAll}
          onDeselectAll={deselectAllPhotos}
        />
      </div>

      <PhotoLightbox
        photo={lightboxPhoto}
        selectedPhotos={selectedPhotos}
        onClose={closeLightbox}
        onNavigate={navigateLightbox}
        onToggleSelection={togglePhotoSelection}
      />

      <PhotoPreviewModal
        photo={previewPhoto}
        isOpen={!!previewPhoto}
        onClose={() => setPreviewPhoto(null)}
        getPhotoUrl={getPhotoUrl}
        photos={photos}
        onNavigate={handleNavigatePreview}
        selectedPhotos={selectedPhotos}
        onToggleSelection={togglePhotoSelection}
      />

      <FullscreenPhotoModal
        photo={fullscreenPhoto}
        isOpen={!!fullscreenPhoto}
        onClose={() => setFullscreenPhoto(null)}
        getPhotoUrl={getPhotoUrl}
        photos={photos}
        onNavigate={handleNavigateFullscreen}
        galleryId={gallery.id}
        clientEmail={clientEmail}
      />

      <SelectionModal
        isOpen={showSelectionModal}
        onClose={() => setShowSelectionModal(false)}
        selectedPhotos={Array.from(selectedPhotos)}
        photos={photos}
        onPhotoToggle={togglePhotoSelection}
        galleryId={gallery.id}
        clientEmail={clientEmail}
        freePhotoLimit={gallery.free_photo_limit || 5}
        getPhotoUrl={getPhotoUrl}
      />
    </div>
  );
};

export default ClientGallery;
