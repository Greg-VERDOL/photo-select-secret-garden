
import React, { useEffect, useCallback } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import WatermarkedImage from './WatermarkedImage';

interface Photo {
  id: string;
  filename: string;
  title?: string;
  storage_path: string;
}

interface FullscreenPhotoModalProps {
  photo: Photo | null;
  isOpen: boolean;
  onClose: () => void;
  getPhotoUrl: (storagePath: string) => string;
  photos?: Photo[];
  onNavigate?: (direction: 'prev' | 'next') => void;
  allowDownload?: boolean;
  onDownload?: (photo: Photo) => void;
}

const FullscreenPhotoModal: React.FC<FullscreenPhotoModalProps> = ({
  photo,
  isOpen,
  onClose,
  getPhotoUrl,
  photos = [],
  onNavigate,
  allowDownload = false,
  onDownload
}) => {
  const handleKeyNavigation = useCallback((event: KeyboardEvent) => {
    if (!isOpen || !onNavigate) return;
    
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      onNavigate('prev');
    } else if (event.key === 'ArrowRight') {
      event.preventDefault();
      onNavigate('next');
    } else if (event.key === 'Escape') {
      event.preventDefault();
      onClose();
    }
  }, [isOpen, onNavigate, onClose]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyNavigation);
    return () => {
      document.removeEventListener('keydown', handleKeyNavigation);
    };
  }, [handleKeyNavigation]);

  if (!photo) return null;

  const currentIndex = photos.findIndex(p => p.id === photo.id);
  const canNavigatePrev = currentIndex > 0;
  const canNavigateNext = currentIndex < photos.length - 1;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[100vw] max-h-[100vh] w-full h-full bg-black/95 border-none p-0 m-0">
        {/* Header with controls */}
        <div className="absolute top-4 left-4 right-4 z-10 flex justify-between items-center">
          <div className="text-white text-sm md:text-base">
            {photo.title || photo.filename}
            {photos.length > 1 && (
              <span className="ml-2 text-white/70">
                ({currentIndex + 1} of {photos.length})
              </span>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={onClose}
              className="bg-black/50 border-white/50 text-white hover:bg-black/70 hover:border-white"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Navigation arrows */}
        {onNavigate && canNavigatePrev && (
          <Button
            size="lg"
            variant="outline"
            className="absolute left-4 top-1/2 transform -translate-y-1/2 z-10 bg-black/50 border-white/50 text-white hover:bg-black/70 hover:border-white"
            onClick={() => onNavigate('prev')}
          >
            <ChevronLeft className="w-6 h-6" />
          </Button>
        )}
        
        {onNavigate && canNavigateNext && (
          <Button
            size="lg"
            variant="outline"
            className="absolute right-4 top-1/2 transform -translate-y-1/2 z-10 bg-black/50 border-white/50 text-white hover:bg-black/70 hover:border-white"
            onClick={() => onNavigate('next')}
          >
            <ChevronRight className="w-6 h-6" />
          </Button>
        )}

        {/* Image container that displays image at natural size */}
        <div className="absolute inset-0 flex items-center justify-center p-8 pt-20 md:p-16 overflow-auto">
          <div className="flex-shrink-0">
            <WatermarkedImage
              src={getPhotoUrl(photo.storage_path)}
              alt={photo.title || photo.filename}
              className="block"
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default FullscreenPhotoModal;
