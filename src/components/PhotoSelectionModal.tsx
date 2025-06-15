
import React from 'react';
import { useTranslation } from 'react-i18next';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PhotoSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  photoUrl: string;
  photoTitle: string;
  clientName: string;
}

const PhotoSelectionModal: React.FC<PhotoSelectionModalProps> = ({
  isOpen,
  onClose,
  photoUrl,
  photoTitle,
  clientName
}) => {
  const { t } = useTranslation();
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
      <div className="relative max-w-4xl max-h-[90vh] bg-slate-800 rounded-lg overflow-hidden">
        <div className="absolute top-4 right-4 z-10">
          <Button
            onClick={onClose}
            variant="outline"
            size="sm"
            className="bg-black/50 border-slate-600 text-white hover:bg-black/70"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
        
        <div className="p-6">
          <div className="mb-4">
            <h3 className="text-xl font-semibold text-white">{photoTitle}</h3>
            <p className="text-slate-400">{t('photoSelectionModal.selectedBy', { clientName })}</p>
          </div>
          
          <div className="flex justify-center">
            <img
              src={photoUrl}
              alt={photoTitle}
              className="max-w-full max-h-[70vh] object-contain rounded-lg"
              draggable={false}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default PhotoSelectionModal;
