
import React from 'react';
import { motion } from 'framer-motion';
import { Heart, CheckCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import WatermarkedImage from './WatermarkedImage';
import { Photo } from '@/hooks/useGalleryData';

interface PhotoGalleryGridProps {
  photos: Photo[];
  selectedPhotos: Set<string>;
  onPhotoClick: (photo: Photo) => void;
  onToggleSelection: (photoId: string) => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
}

const PhotoGalleryGrid: React.FC<PhotoGalleryGridProps> = ({
  photos,
  selectedPhotos,
  onPhotoClick,
  onToggleSelection,
  onSelectAll,
  onDeselectAll
}) => {
  const allSelected = photos.length > 0 && selectedPhotos.size === photos.length;

  if (photos.length === 0) {
    return (
      <div className="text-center py-20">
        <h2 className="text-xl md:text-2xl font-bold text-white mb-4">No Photos Yet</h2>
        <p className="text-slate-300">This gallery is empty. Please check back later.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Select All Button */}
      <div className="flex justify-center">
        <Button
          onClick={allSelected ? onDeselectAll : onSelectAll}
          variant={allSelected ? "destructive" : "default"}
          className={`${
            allSelected 
              ? "bg-red-600 hover:bg-red-700" 
              : "bg-blue-600 hover:bg-blue-700"
          } text-white`}
        >
          <CheckCircle className="w-4 h-4 mr-2" />
          {allSelected ? "Deselect All" : "Select All"}
        </Button>
      </div>

      <motion.div 
        className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3 md:gap-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        {photos.map((photo, index) => (
          <motion.div
            key={photo.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.03 }}
            className="group"
          >
            <Card className="overflow-hidden bg-white/5 border-white/10 hover:border-blue-400/30 transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/10">
              <div 
                className="relative aspect-square overflow-hidden cursor-pointer"
                onClick={() => onPhotoClick(photo)}
              >
                <WatermarkedImage
                  src={(photo as any).thumbnail}
                  alt={photo.title || photo.filename}
                  className="w-full h-full transition-transform duration-300 group-hover:scale-105"
                  fitContainer={true}
                />
                
                {/* Selection overlay - Always visible on mobile, hover on desktop */}
                <div className="absolute inset-0 bg-black/0 md:group-hover:bg-black/20 transition-all duration-300">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleSelection(photo.id);
                    }}
                    className={`absolute top-2 right-2 p-2 rounded-full transition-all duration-300 touch-manipulation ${
                      selectedPhotos.has(photo.id)
                        ? 'bg-red-500 text-white scale-110'
                        : 'bg-white/90 text-slate-700 hover:bg-white md:opacity-0 md:group-hover:opacity-100'
                    }`}
                  >
                    <Heart className={`w-4 h-4 md:w-5 md:h-5 ${selectedPhotos.has(photo.id) ? 'fill-current' : ''}`} />
                  </button>
                </div>
              </div>
              
              <div className="p-2 md:p-4">
                <h3 className="font-semibold text-white text-sm md:text-base truncate">
                  {photo.title || photo.filename}
                </h3>
                {photo.description && (
                  <p className="text-xs md:text-sm text-slate-300 mt-1 line-clamp-2">
                    {photo.description}
                  </p>
                )}
              </div>
            </Card>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
};

export default PhotoGalleryGrid;
