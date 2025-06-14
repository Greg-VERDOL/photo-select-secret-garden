
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { X } from 'lucide-react';

interface Photo {
  id: string;
  filename: string;
  storage_path: string;
}

interface SelectedPhotosGridProps {
  photos: Photo[];
  selectedPhotos: string[];
  onPhotoToggle: (photoId: string) => void;
  getPhotoUrl: (storagePath: string) => string;
}

const SelectedPhotosGrid: React.FC<SelectedPhotosGridProps> = ({
  photos,
  selectedPhotos,
  onPhotoToggle,
  getPhotoUrl,
}) => {
  const selectedPhotosList = photos.filter(photo => selectedPhotos.includes(photo.id));

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {selectedPhotosList.map((photo) => (
        <div key={photo.id} className="relative group">
          <img
            src={getPhotoUrl(photo.storage_path)}
            alt={photo.filename}
            className="w-full h-32 object-cover rounded-lg"
          />
          <button
            onClick={() => onPhotoToggle(photo.id)}
            className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <X className="w-4 h-4" />
          </button>
          <div className="absolute bottom-2 left-2">
            <Badge variant="secondary" className="text-xs">
              {selectedPhotos.indexOf(photo.id) + 1}
            </Badge>
          </div>
        </div>
      ))}
    </div>
  );
};

export default SelectedPhotosGrid;
