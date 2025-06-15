
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
        className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          exit={{ scale: 0.8 }}
          className="relative max-w-4xl max-h-full"
          onClick={(e) => e.stopPropagation()}
        >
          <WatermarkedImage
            src={(photo as any).url}
            alt={photo.title || photo.filename}
            className="max-w-full max-h-[80vh] object-contain rounded-lg"
          />
          
          {/* Controls */}
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-4 right-4 bg-black/50 hover:bg-black/70 text-white"
            onClick={onClose}
          >
            <X className="w-6 h-6" />
          </Button>
          
          <Button
            variant="ghost"
            size="icon"
            className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white"
            onClick={() => onNavigate('prev')}
          >
            <ChevronLeft className="w-6 h-6" />
          </Button>
          
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white"
            onClick={() => onNavigate('next')}
          >
            <ChevronRight className="w-6 h-6" />
          </Button>

          {/* Selection button */}
          <Button
            onClick={() => onToggleSelection(photo.id)}
            className={`absolute bottom-4 right-4 ${
              selectedPhotos.has(photo.id)
                ? 'bg-red-500 hover:bg-red-600'
                : 'bg-white/20 hover:bg-white/30'
            }`}
          >
            <Heart className={`w-4 h-4 mr-2 ${selectedPhotos.has(photo.id) ? 'fill-current' : ''}`} />
            {selectedPhotos.has(photo.id) ? 'Selected' : 'Select'}
          </Button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default PhotoLightbox;
