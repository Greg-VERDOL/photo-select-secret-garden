
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';

export const useClientGalleryActions = (
  selectedPhotos: Set<string>,
  photos: any[],
  selectAllPhotos: (photos: any[]) => void,
  setShowSelectionModal: (show: boolean) => void
) => {
  const { toast } = useToast();
  const { t } = useTranslation();

  const handleSendSelection = () => {
    if (selectedPhotos.size === 0) {
      toast({
        title: t('clientGallery.noPhotosSelected'),
        description: t('clientGallery.noPhotosSelectedDescription'),
        variant: "destructive"
      });
      return;
    }
    setShowSelectionModal(true);
  };

  const handleSelectAll = () => {
    selectAllPhotos(photos);
  };

  return {
    handleSendSelection,
    handleSelectAll
  };
};
