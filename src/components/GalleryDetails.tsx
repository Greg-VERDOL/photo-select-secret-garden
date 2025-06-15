
import React from 'react';
import { Card } from '@/components/ui/card';
import PhotoGrid from './PhotoGrid';
import GalleryInfo from './GalleryInfo';
import GalleryActions from './GalleryActions';
import { usePhotoOperations } from './PhotoOperations';

interface Gallery {
  id: string;
  name: string;
  client_name?: string;
  client_email?: string;
  access_code: string;
  created_at: string;
  photo_count?: number;
}

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

interface GalleryDetailsProps {
  gallery: Gallery;
  photos: Photo[];
  onPhotoUploaded: () => void;
  onPhotoClick: (photo: Photo) => void;
  getPhotoUrl: (storagePath: string) => string;
  onGalleryDeleted: () => void;
}

const GalleryDetails: React.FC<GalleryDetailsProps> = ({
  gallery,
  photos,
  onPhotoUploaded,
  onPhotoClick,
  getPhotoUrl,
  onGalleryDeleted
}) => {
  const { handleFileUpload, deletePhoto } = usePhotoOperations();

  const onFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    handleFileUpload(event, gallery, onPhotoUploaded);
  };

  const onDeletePhoto = (photoId: string, storagePath: string) => {
    deletePhoto(photoId, storagePath, onPhotoUploaded);
  };

  return (
    <Card className="p-6 bg-transparent border-none">
      <div className="flex justify-between items-start mb-6">
        <GalleryInfo gallery={gallery} photos={photos} />
        <GalleryActions
          gallery={gallery}
          photos={photos}
          onPhotoUploaded={onPhotoUploaded}
          onGalleryDeleted={onGalleryDeleted}
          onFileUpload={onFileUpload}
        />
      </div>

      <PhotoGrid
        photos={photos}
        getPhotoUrl={getPhotoUrl}
        onPhotoClick={onPhotoClick}
        onDeletePhoto={onDeletePhoto}
      />
    </Card>
  );
};

export default GalleryDetails;
