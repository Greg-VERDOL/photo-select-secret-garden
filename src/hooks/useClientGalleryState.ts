
import { useState } from 'react';

export const useClientGalleryState = () => {
  const [showSelectionModal, setShowSelectionModal] = useState(false);
  const [fullscreenPhoto, setFullscreenPhoto] = useState(null);
  const [previewPhoto, setPreviewPhoto] = useState(null);

  return {
    showSelectionModal,
    setShowSelectionModal,
    fullscreenPhoto,
    setFullscreenPhoto,
    previewPhoto,
    setPreviewPhoto
  };
};
