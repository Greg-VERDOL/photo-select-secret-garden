
import React from 'react';
import { useTranslation } from 'react-i18next';
import SelectedPhotosGrid from '../SelectedPhotosGrid';
import PricingInfo from '../PricingInfo';
import ClientInfoForm from '../ClientInfoForm';

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

  return (
    <div className="flex-1 overflow-y-auto space-y-6 pr-2">
      {/* Selected Photos Grid */}
      <div>
        <h3 className="text-lg font-semibold mb-3">{t('selectionModal.selectedPhotos')}</h3>
        <SelectedPhotosGrid
          photos={photos}
          selectedPhotos={selectedPhotos}
          onPhotoToggle={onPhotoToggle}
          getPhotoUrl={getPhotoUrl}
        />
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
