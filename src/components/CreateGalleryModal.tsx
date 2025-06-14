
import React from 'react';
import CreateGalleryForm from './CreateGalleryForm';

interface CreateGalleryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGalleryCreated: () => void;
}

const CreateGalleryModal: React.FC<CreateGalleryModalProps> = ({
  isOpen,
  onClose,
  onGalleryCreated
}) => {
  if (!isOpen) return null;

  const handleGalleryCreated = () => {
    onGalleryCreated();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
        <div className="p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Create New Gallery</h2>
          <CreateGalleryForm
            onGalleryCreated={handleGalleryCreated}
            onCancel={onClose}
          />
        </div>
      </div>
    </div>
  );
};

export default CreateGalleryModal;
