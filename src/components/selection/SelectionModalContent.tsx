
import React from 'react';
import { useTranslation } from 'react-i18next';
import PricingInfo from '../PricingInfo';
import ClientInfoForm from '../ClientInfoForm';
import WatermarkedImage from '../WatermarkedImage';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Photo {
  id: string;
  filename: string;
  title?: string;
  storage_path: string;
}

interface SelectionModalContentProps {
  photos: Photo[];
  selectedPhotos: string[];
  onPhotoToggle: (photoId: string) => void;
  getPhotoUrl: (storagePath: string) => string;
  freePhotoLimit: number;
  pricePerPhoto: number;
  email: string;
  message: string;
  onEmailChange: (email: string) => void;
  onMessageChange: (message: string) => void;
}

const SelectionModalContent: React.FC<SelectionModalContentProps> = ({
  photos,
  selectedPhotos,
  onPhotoToggle,
  getPhotoUrl,
  freePhotoLimit,
  pricePerPhoto,
  email,
  message,
  onEmailChange,
  onMessageChange
}) => {
  const { t } = useTranslation();

  const extraPhotosCount = Math.max(0, selectedPhotos.length - freePhotoLimit);
  const totalCost = extraPhotosCount * pricePerPhoto;

  const selectedPhotoObjects = photos.filter(p => selectedPhotos.includes(p.id));

  return (
    <div className="flex-1 overflow-y-auto space-y-6 pr-2">
      {/* Selected Photos Grid */}
      <div>
        <h3 className="text-lg font-semibold mb-3">{t('selectionModal.selectedPhotos')}</h3>
        {selectedPhotoObjects.length > 0 ? (
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
            {selectedPhotoObjects.map(photo => (
              <div key={photo.id} className="relative aspect-square group rounded-md overflow-hidden">
                <WatermarkedImage
                  src={getPhotoUrl(photo.storage_path)}
                  alt={photo.title || photo.filename}
                  className="w-full h-full"
                  fitContainer={true}
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-1 right-1 h-7 w-7 bg-black/50 text-white/80 hover:bg-black/70 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={(e) => {
                    e.stopPropagation();
                    onPhotoToggle(photo.id);
                  }}
                  aria-label={t('selectionModal.deselectPhoto')}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 px-4 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-lg">
            <p className="text-sm text-slate-500 dark:text-slate-400">{t('selectionModal.noPhotosSelected', 'No photos have been selected yet.')}</p>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">{t('selectionModal.goBackAndSelect', 'Return to the gallery to make your selection.')}</p>
          </div>
        )}
      </div>

      {/* Pricing Information */}
      <PricingInfo
        freePhotoLimit={freePhotoLimit}
        pricePerPhoto={pricePerPhoto}
        selectedPhotosCount={selectedPhotos.length}
        extraPhotosCount={extraPhotosCount}
        totalCost={totalCost}
      />

      {/* Client Information Form */}
      <ClientInfoForm
        email={email}
        message={message}
        onEmailChange={onEmailChange}
        onMessageChange={onMessageChange}
      />
    </div>
  );
};

export default SelectionModalContent;
