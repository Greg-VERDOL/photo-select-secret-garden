
import React from 'react';
import { motion } from 'framer-motion';
import { Heart } from 'lucide-react';
import { Card } from '@/components/ui/card';
import WatermarkedImage from './WatermarkedImage';
import { Photo } from '@/hooks/useGalleryData';

interface PhotoGalleryGridProps {
  photos: Photo[];
  selectedPhotos: Set<string>;
  onPhotoClick: (photo: Photo) => void;
  onToggleSelection: (photoId: string) => void;
}

const PhotoGalleryGrid: React.FC<PhotoGalleryGridProps> = ({
  photos,
  selectedPhotos,
  onPhotoClick,
  onToggleSelection
}) => {
  if (photos.length === 0) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-bold text-white mb-4">No Photos Yet</h2>
        <p className="text-slate-300">This gallery is empty. Please check back later.</p>
      </div>
    );
  }

  return (
    <motion.div 
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.2 }}
    >
      {photos.map((photo, index) => (
        <motion.div
          key={photo.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
          className="group"
        >
          <Card className="overflow-hidden bg-white/5 border-white/10 hover:border-blue-400/30 transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/10">
            <div className="relative aspect-[4/3] overflow-hidden">
              <WatermarkedImage
                src={(photo as any).thumbnail}
                alt={photo.title || photo.filename}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105 cursor-pointer"
                onClick={() => onPhotoClick(photo)}
              />
              
              {/* Selection overlay */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleSelection(photo.id);
                  }}
                  className={`absolute top-3 right-3 p-2 rounded-full transition-all duration-300 ${
                    selectedPhotos.has(photo.id)
                      ? 'bg-red-500 text-white'
                      : 'bg-white/80 text-slate-700 hover:bg-white'
                  }`}
                >
                  <Heart className={`w-5 h-5 ${selectedPhotos.has(photo.id) ? 'fill-current' : ''}`} />
                </button>
              </div>
            </div>
            
            <div className="p-4">
              <h3 className="font-semibold text-white">{photo.title || photo.filename}</h3>
              {photo.description && (
                <p className="text-sm text-slate-300 mt-1">{photo.description}</p>
              )}
            </div>
          </Card>
        </motion.div>
      ))}
    </motion.div>
  );
};

export default PhotoGalleryGrid;
