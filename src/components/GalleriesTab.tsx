
import React, { useState, useEffect } from 'react';
import GalleriesHeader from './GalleriesHeader';
import GalleriesSidebar from './GalleriesSidebar';
import GalleryMainContent from './GalleryMainContent';
import CreateGalleryModal from './CreateGalleryModal';
import PhotoPreviewModal from './PhotoPreviewModal';
import { useGalleryOperations } from './GalleryOperations';

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
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);

  const {
    galleries,
    selectedGallery,
    photos,
    fetchGalleries,
    fetchPhotos,
    handleGalleryDeleted,
    handleSelectGallery,
    handlePhotoUploaded,
    getPhotoUrl
  } = useGalleryOperations();

  useEffect(() => {
    fetchGalleries();
  }, []);

  useEffect(() => {
    if (selectedGallery) {
      fetchPhotos(selectedGallery.id);
    }
  }, [selectedGallery]);

  const handleGalleryCreated = () => {
    fetchGalleries();
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 text-white">
      <GalleriesHeader onCreateGallery={() => setShowCreateForm(true)} />

      <CreateGalleryModal
        isOpen={showCreateForm}
        onClose={() => setShowCreateForm(false)}
        onGalleryCreated={handleGalleryCreated}
      />

      <div className="px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <GalleriesSidebar
            galleries={galleries}
            selectedGallery={selectedGallery}
            onSelectGallery={handleSelectGallery}
          />

          <GalleryMainContent
            selectedGallery={selectedGallery}
            photos={photos}
            onPhotoUploaded={handlePhotoUploaded}
            onPhotoClick={openPhotoPreview}
            getPhotoUrl={getPhotoUrl}
            onGalleryDeleted={handleGalleryDeleted}
          />
        </div>
      </div>

      <PhotoPreviewModal
        photo={selectedPhoto}
        isOpen={isPreviewOpen}
        onClose={closePhotoPreview}
        getPhotoUrl={getPhotoUrl}
        photos={photos}
        onNavigate={navigatePhoto}
      />
    </div>
  );
};

export default GalleriesTab;
