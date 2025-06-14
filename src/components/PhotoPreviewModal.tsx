
import React, { useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { X, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import WatermarkedImage from './WatermarkedImage';

interface Photo {
  id: string;
  gallery_id: string;
  filename: string;
  title?: string;
  description?: string;
  storage_path: string;
  thumbnail_path?: string;
  created_at: string;
}

interface PhotoPreviewModalProps {
  photo: Photo | null;
  isOpen: boolean;
  onClose: () => void;
  onDelete?: (photoId: string, storagePath: string) => void;
  getPhotoUrl: (storagePath: string) => string;
  photos?: Photo[];
  onNavigate?: (direction: 'prev' | 'next') => void;
}

const PhotoPreviewModal: React.FC<PhotoPreviewModalProps> = ({
  photo,
  isOpen,
  onClose,
  onDelete,
  getPhotoUrl,
  photos = [],
  onNavigate
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

  const handleDelete = () => {
    if (onDelete && window.confirm('Are you sure you want to delete this photo?')) {
      onDelete(photo.id, photo.storage_path);
      onClose();
    }
  };

  const currentIndex = photos.findIndex(p => p.id === photo.id);
  const canNavigatePrev = currentIndex > 0;
  const canNavigateNext = currentIndex < photos.length - 1;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl max-h-[95vh] bg-slate-800 border-slate-600 text-white overflow-hidden p-0">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="flex justify-between items-center">
            <span>{photo.title || photo.filename}</span>
            <div className="flex gap-2">
              {onDelete && (
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={handleDelete}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
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
        
        <div className="flex flex-col items-center space-y-4 p-6 pt-0 relative">
          {/* Navigation arrows */}
          {onNavigate && canNavigatePrev && (
            <Button
              size="sm"
              variant="outline"
              className="absolute left-4 top-1/2 transform -translate-y-1/2 border-slate-600 text-slate-300 hover:bg-slate-700 z-10"
              onClick={() => onNavigate('prev')}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
          )}
          
          {onNavigate && canNavigateNext && (
            <Button
              size="sm"
              variant="outline"
              className="absolute right-4 top-1/2 transform -translate-y-1/2 border-slate-600 text-slate-300 hover:bg-slate-700 z-10"
              onClick={() => onNavigate('next')}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          )}

          <div className="w-full flex justify-center">
            <WatermarkedImage
              src={getPhotoUrl(photo.storage_path)}
              alt={photo.title || photo.filename}
              className="max-w-full max-h-[70vh] object-contain rounded-lg"
            />
          </div>
          
          {photo.description && (
            <div className="text-slate-300 text-center max-w-md">
              <p className="text-sm">{photo.description}</p>
            </div>
          )}
          
          <div className="text-slate-400 text-xs text-center">
            <p>Uploaded: {new Date(photo.created_at).toLocaleDateString()}</p>
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
