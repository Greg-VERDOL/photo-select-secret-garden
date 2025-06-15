
import { useState } from 'react';
import { Photo } from './useGalleryData';

export const useLightbox = (photos: Photo[]) => {
  const [lightboxPhoto, setLightboxPhoto] = useState<Photo | null>(null);

  const currentPhotoIndex = lightboxPhoto ? photos.findIndex(p => p.id === lightboxPhoto.id) : -1;

  const navigateLightbox = (direction: 'prev' | 'next') => {
    if (currentPhotoIndex === -1) return;
    
    const newIndex = direction === 'prev' 
      ? (currentPhotoIndex - 1 + photos.length) % photos.length
      : (currentPhotoIndex + 1) % photos.length;
    
    setLightboxPhoto(photos[newIndex]);
  };

  const closeLightbox = () => setLightboxPhoto(null);

  return {
    lightboxPhoto,
    setLightboxPhoto,
    navigateLightbox,
    closeLightbox
  };
};
