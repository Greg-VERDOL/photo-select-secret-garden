
import { useCallback } from 'react';

interface Photo {
  id: string;
  [key: string]: any;
}

export const usePhotoNavigation = (photos: Photo[]) => {
  const navigatePhotos = useCallback((
    currentPhoto: Photo | null,
    direction: 'prev' | 'next',
    setPhoto: (photo: Photo | null) => void
  ) => {
    if (!currentPhoto) return;
    
    const currentIndex = photos.findIndex(p => p.id === currentPhoto.id);
    let newIndex;
    
    if (direction === 'prev') {
      newIndex = currentIndex > 0 ? currentIndex - 1 : photos.length - 1;
    } else {
      newIndex = currentIndex < photos.length - 1 ? currentIndex + 1 : 0;
    }
    
    setPhoto(photos[newIndex]);
  }, [photos]);

  const navigateFullscreen = useCallback((direction: 'prev' | 'next', fullscreenPhoto: Photo | null, setFullscreenPhoto: (photo: Photo | null) => void) => {
    navigatePhotos(fullscreenPhoto, direction, setFullscreenPhoto);
  }, [navigatePhotos]);

  const navigatePreview = useCallback((direction: 'prev' | 'next', previewPhoto: Photo | null, setPreviewPhoto: (photo: Photo | null) => void) => {
    navigatePhotos(previewPhoto, direction, setPreviewPhoto);
  }, [navigatePhotos]);

  return {
    navigateFullscreen,
    navigatePreview
  };
};
