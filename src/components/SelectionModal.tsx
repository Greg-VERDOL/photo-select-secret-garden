
import React, { useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import SelectionModalHeader from './selection/SelectionModalHeader';
import SelectionModalContent from './selection/SelectionModalContent';
import SelectionActions from './SelectionActions';
import { useSelectionModalData } from './selection/useSelectionModalData';
import { useSelectionSubmit } from './selection/useSelectionSubmit';

interface Photo {
  id: string;
  filename: string;
  title?: string;
  storage_path: string;
}

interface SelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedPhotos: string[];
  photos: Photo[];
  onPhotoToggle: (photoId: string) => void;
  galleryId: string;
  clientEmail: string;
  freePhotoLimit: number;
  getPhotoUrl: (storagePath: string) => string;
}

const SelectionModal: React.FC<SelectionModalProps> = ({
  isOpen,
  onClose,
  selectedPhotos,
  photos,
  onPhotoToggle,
  galleryId,
  clientEmail,
  freePhotoLimit,
  getPhotoUrl
}) => {
  const [email, setEmail] = useState(clientEmail);
  const [message, setMessage] = useState('');

  const { pricePerPhoto, galleryInfo } = useSelectionModalData(isOpen, galleryId);
  
  const {
    isSubmitting,
    extraPhotosCount,
    totalCost,
    handleSubmit
  } = useSelectionSubmit({
    galleryId,
    selectedPhotos,
    photos,
    galleryInfo,
    freePhotoLimit,
    pricePerPhoto,
    onClose
  });

  const onSubmit = () => handleSubmit(email);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-[90vh] bg-slate-800 border-slate-600 text-white flex flex-col">
        <SelectionModalHeader
          selectedCount={selectedPhotos.length}
          onClose={onClose}
        />

        <SelectionModalContent
          photos={photos}
          selectedPhotos={selectedPhotos}
          onPhotoToggle={onPhotoToggle}
          getPhotoUrl={getPhotoUrl}
          freePhotoLimit={freePhotoLimit}
          pricePerPhoto={pricePerPhoto}
          email={email}
          message={message}
          onEmailChange={setEmail}
          onMessageChange={setMessage}
        />

        {/* Action Buttons - Fixed at bottom */}
        <div className="flex-shrink-0 pt-4 border-t border-slate-600">
          <SelectionActions
            selectedPhotosCount={selectedPhotos.length}
            extraPhotosCount={extraPhotosCount}
            totalCost={totalCost}
            isSubmitting={isSubmitting}
            onSubmit={onSubmit}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SelectionModal;
