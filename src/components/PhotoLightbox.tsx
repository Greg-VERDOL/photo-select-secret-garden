
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import WatermarkedImage from './WatermarkedImage';
import { Photo } from '@/hooks/useGalleryData';

interface PhotoLightboxProps {
  photo: Photo | null;
  selectedPhotos: Set<string>;
  onClose: () => void;
  onNavigate: (direction: 'prev' | 'next') => void;
  onToggleSelection: (photoId: string) => void;
}

const PhotoLightbox: React.FC<PhotoLightboxProps> = ({
  photo,
  selectedPhotos,
  onClose,
  onNavigate,
  onToggleSelection
}) => {
  if (!photo) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-2 md:p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          exit={{ scale: 0.8 }}
          className="relative max-w-full max-h-full w-full flex items-center justify-center"
          onClick={(e) => e.stopPropagation()}
        >
          <WatermarkedImage
            src={(photo as any).url}
            alt={photo.title || photo.filename}
            className="max-w-full max-h-[85vh] md:max-h-[80vh] object-contain rounded-lg"
          />
          
          {/* Close button */}
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-2 right-2 md:top-4 md:right-4 bg-black/50 hover:bg-black/70 text-white touch-manipulation"
            onClick={onClose}
          >
            <X className="w-5 h-5 md:w-6 md:h-6" />
          </Button>
          
          {/* Navigation arrows - Hidden on small screens, shown on tablets+ */}
          <Button
            variant="ghost"
            size="icon"
            className="hidden sm:flex absolute left-2 md:left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white touch-manipulation"
            onClick={() => onNavigate('prev')}
          >
            <ChevronLeft className="w-6 h-6 md:w-8 md:h-8" />
          </Button>
          
          <Button
            variant="ghost"
            size="icon"
            className="hidden sm:flex absolute right-2 md:right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white touch-manipulation"
            onClick={() => onNavigate('next')}
          >
            <ChevronRight className="w-6 h-6 md:w-8 md:h-8" />
          </Button>

          {/* Mobile navigation buttons */}
          <div className="sm:hidden absolute bottom-16 left-1/2 -translate-x-1/2 flex gap-4">
            <Button
              variant="ghost"
              size="sm"
              className="bg-black/50 hover:bg-black/70 text-white touch-manipulation px-6"
              onClick={() => onNavigate('prev')}
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Prev
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              className="bg-black/50 hover:bg-black/70 text-white touch-manipulation px-6"
              onClick={() => onNavigate('next')}
            >
              Next
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>

          {/* Selection button */}
          <Button
            onClick={() => onToggleSelection(photo.id)}
            size="sm"
            className={`absolute bottom-2 right-2 md:bottom-4 md:right-4 touch-manipulation ${
              selectedPhotos.has(photo.id)
                ? 'bg-red-500 hover:bg-red-600'
                : 'bg-white/20 hover:bg-white/30'
            }`}
          >
            <Heart className={`w-4 h-4 mr-2 ${selectedPhotos.has(photo.id) ? 'fill-current' : ''}`} />
            <span className="hidden sm:inline">
              {selectedPhotos.has(photo.id) ? 'Selected' : 'Select'}
            </span>
          </Button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default PhotoLightbox;
