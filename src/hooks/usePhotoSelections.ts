
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useToast } from '@/hooks/use-toast';
import { Gallery, Photo } from './useGalleryData';

export const usePhotoSelections = (gallery: Gallery | null) => {
  const [selectedPhotos, setSelectedPhotos] = useState<Set<string>>(new Set());
  const [clientInfo, setClientInfo] = useState({ name: '', email: '' });
  const { toast } = useToast();
  const { t } = useTranslation();

  // Save selections to localStorage whenever they change
  useEffect(() => {
    if (gallery && selectedPhotos.size > 0) {
      const selectionData = {
        galleryId: gallery.id,
        accessCode: gallery.access_code,
        selectedPhotos: Array.from(selectedPhotos),
        timestamp: Date.now()
      };
      localStorage.setItem(`gallery_selections_${gallery.access_code}`, JSON.stringify(selectionData));
    }
  }, [selectedPhotos, gallery]);

  // Load saved selections when gallery is loaded
  useEffect(() => {
    if (gallery) {
      loadSavedSelections();
    }
  }, [gallery]);

  const loadSavedSelections = () => {
    if (!gallery) return;
    
    try {
      const savedData = localStorage.getItem(`gallery_selections_${gallery.access_code}`);
      if (savedData) {
        const selectionData = JSON.parse(savedData);
        
        // Check if the saved data is for the same gallery and not too old (24 hours)
        const isValidData = selectionData.galleryId === gallery.id && 
                           selectionData.accessCode === gallery.access_code &&
                           (Date.now() - selectionData.timestamp) < 24 * 60 * 60 * 1000;
        
        if (isValidData && selectionData.selectedPhotos && Array.isArray(selectionData.selectedPhotos)) {
          const savedSelections = new Set<string>(selectionData.selectedPhotos);
          setSelectedPhotos(savedSelections);
          
          if (savedSelections.size > 0) {
            toast({
              title: t('photoSelections.restored'),
              description: t('photoSelections.restoredDescription', { count: savedSelections.size }),
            });
          }
        }
      }
    } catch (error) {
      console.error('Error loading saved selections:', error);
    }
  };

  const togglePhotoSelection = (photoId: string) => {
    const newSelected = new Set(selectedPhotos);
    if (newSelected.has(photoId)) {
      newSelected.delete(photoId);
    } else {
      newSelected.add(photoId);
    }
    setSelectedPhotos(newSelected);
    
    toast({
      title: newSelected.has(photoId) ? t('photoSelections.added') : t('photoSelections.removed'),
      duration: 2000,
    });
  };

  const selectAllPhotos = (photos: Photo[]) => {
    const allPhotoIds = new Set(photos.map(photo => photo.id));
    setSelectedPhotos(allPhotoIds);
    
    toast({
      title: t('photoSelections.allSelected'),
      description: t('photoSelections.allSelectedDescription', { count: photos.length }),
      duration: 2000,
    });
  };

  const deselectAllPhotos = () => {
    setSelectedPhotos(new Set());
    
    toast({
      title: t('photoSelections.allDeselected'),
      duration: 2000,
    });
  };

  // Pre-fill client info if available
  useEffect(() => {
    if (gallery && (gallery.client_name || gallery.client_email)) {
      setClientInfo({
        name: gallery.client_name || '',
        email: gallery.client_email || ''
      });
    }
  }, [gallery]);

  return {
    selectedPhotos,
    clientInfo,
    togglePhotoSelection,
    selectAllPhotos,
    deselectAllPhotos,
    setClientInfo
  };
};
