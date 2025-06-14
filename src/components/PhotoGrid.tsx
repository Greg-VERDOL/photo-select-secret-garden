
import React from 'react';
import { motion } from 'framer-motion';
import { Eye, Trash2, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
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

interface PhotoGridProps {
  photos: Photo[];
  getPhotoUrl: (storagePath: string) => string;
  onPhotoClick: (photo: Photo) => void;
  onDeletePhoto: (photoId: string, storagePath: string) => void;
}

const PhotoGrid: React.FC<PhotoGridProps> = ({
  photos,
  getPhotoUrl,
  onPhotoClick,
  onDeletePhoto
}) => {
  if (photos.length === 0) {
    return (
      <div className="text-center py-12 text-slate-400">
        <Upload className="w-12 h-12 mx-auto mb-4 opacity-50" />
        <p>No photos uploaded yet. Click "Upload Photos" to get started.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 max-h-96 overflow-y-auto scrollbar-hide">
      {photos.map((photo) => (
        <motion.div
          key={photo.id}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="group relative"
        >
          <Card className="overflow-hidden bg-slate-700 border-slate-600 cursor-pointer transition-transform">
            <div onClick={() => onPhotoClick(photo)}>
              <WatermarkedImage
                src={getPhotoUrl(photo.storage_path)}
                alt={photo.title || photo.filename}
                className="w-full aspect-square object-cover hover:opacity-80 transition-opacity"
              />
              <div className="p-2">
                <p className="text-xs text-slate-300 truncate">{photo.title || photo.filename}</p>
              </div>
            </div>
            
            <Button
              size="sm"
              variant="outline"
              className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity border-slate-600 text-slate-300 hover:bg-slate-700"
              onClick={() => onPhotoClick(photo)}
            >
              <Eye className="w-3 h-3" />
            </Button>
            
            <Button
              size="sm"
              variant="destructive"
              className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={(e) => {
                e.stopPropagation();
                onDeletePhoto(photo.id, photo.storage_path);
              }}
            >
              <Trash2 className="w-3 h-3" />
            </Button>
          </Card>
        </motion.div>
      ))}
    </div>
  );
};

export default PhotoGrid;
