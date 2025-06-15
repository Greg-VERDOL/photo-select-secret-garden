
import React, { useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { X, ChevronLeft, ChevronRight, Heart } from 'lucide-react';
import WatermarkedImage from './WatermarkedImage';

interface Photo {
  id: string;
  filename: string;
  title?: string;
  description?: string;
  storage_path: string;
  created_at?: string;
}

interface PhotoPreviewModalProps {
  photo: Photo | null;
  isOpen: boolean;
  onClose: () => void;
  getPhotoUrl: (storagePath: string) => string;
  photos?: Photo[];
  onNavigate?: (direction: 'prev' | 'next') => void;
  selectedPhotos?: Set<string>;
  onToggleSelection?: (photoId: string) => void;
}

const PhotoPreviewModal: React.FC<PhotoPreviewModalProps> = ({
  photo,
  isOpen,
  onClose,
  getPhotoUrl,
  photos = [],
  onNavigate,
  selectedPhotos = new Set(),
  onToggleSelection
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
  const isSelected = selectedPhotos.has(photo.id);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl max-h-[95vh] bg-slate-800 border-slate-600 text-white overflow-hidden p-0">
        <DialogHeader className="p-4 md:p-6 pb-0">
          <DialogTitle className="flex justify-between items-center">
            <span className="text-sm md:text-base">{photo.title || photo.filename}</span>
            <div className="flex items-center gap-2">
              {onToggleSelection && (
                <Button
                  size="sm"
                  variant={isSelected ? "default" : "outline"}
                  onClick={() => onToggleSelection(photo.id)}
                  className={`${
                    isSelected 
                      ? "bg-red-500 hover:bg-red-600 text-white" 
                      : "border-slate-600 text-black hover:bg-slate-700 hover:text-white bg-white"
                  }`}
                >
                  <Heart className={`w-4 h-4 mr-1 ${isSelected ? 'fill-current' : ''}`} />
                  {isSelected ? 'Selected' : 'Select'}
                </Button>
              )}
              <Button
                size="sm"
                variant="outline"
                onClick={onClose}
                className="border-slate-600 text-slate-300 hover:bg-slate-700"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex flex-col items-center space-y-2 md:space-y-4 p-4 md:p-6 pt-0 relative">
          {/* Navigation arrows - Desktop */}
          {onNavigate && canNavigatePrev && (
            <Button
              size="sm"
              variant="outline"
              className="hidden md:flex absolute left-4 top-1/2 transform -translate-y-1/2 border-slate-600 text-slate-300 hover:bg-slate-700 z-10"
              onClick={() => onNavigate('prev')}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
          )}
          
          {onNavigate && canNavigateNext && (
            <Button
              size="sm"
              variant="outline"
              className="hidden md:flex absolute right-4 top-1/2 transform -translate-y-1/2 border-slate-600 text-slate-300 hover:bg-slate-700 z-10"
              onClick={() => onNavigate('next')}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          )}

          {/* Mobile navigation buttons */}
          {onNavigate && (canNavigatePrev || canNavigateNext) && (
            <div className="flex md:hidden justify-between w-full mb-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => onNavigate('prev')}
                disabled={!canNavigatePrev}
                className="border-slate-600 text-slate-300 hover:bg-slate-700 disabled:opacity-50"
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                Previous
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onNavigate('next')}
                disabled={!canNavigateNext}
                className="border-slate-600 text-slate-300 hover:bg-slate-700 disabled:opacity-50"
              >
                Next
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          )}

          <div className="w-full flex justify-center">
            <WatermarkedImage
              src={getPhotoUrl(photo.storage_path)}
              alt={photo.title || photo.filename}
              className="max-w-full max-h-[60vh] md:max-h-[70vh] object-contain rounded-lg"
            />
          </div>
          
          {photo.description && (
            <div className="text-slate-300 text-center max-w-md px-4">
              <p className="text-xs md:text-sm">{photo.description}</p>
            </div>
          )}
          
          <div className="text-slate-400 text-xs text-center px-4">
            {photo.created_at && (
              <p>Uploaded: {new Date(photo.created_at).toLocaleDateString()}</p>
            )}
            <p>Filename: {photo.filename}</p>
            {photos.length > 1 && (
              <p>Photo {currentIndex + 1} of {photos.length}</p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PhotoPreviewModal;
