
import React from 'react';
import { FolderPlus } from 'lucide-react';
import GalleryDetails from './GalleryDetails';

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

interface GalleryMainContentProps {
  selectedGallery: Gallery | null;
  photos: Photo[];
  onPhotoUploaded: () => void;
  onPhotoClick: (photo: Photo) => void;
  getPhotoUrl: (storagePath: string) => string;
  onGalleryDeleted: () => void;
}

const GalleryMainContent: React.FC<GalleryMainContentProps> = ({
  selectedGallery,
  photos,
  onPhotoUploaded,
  onPhotoClick,
  getPhotoUrl,
  onGalleryDeleted
}) => {
  return (
    <div className="lg:col-span-2">
      {selectedGallery ? (
        <div className="bg-slate-800/30 backdrop-blur-sm rounded-2xl border border-slate-600">
          <GalleryDetails
            gallery={selectedGallery}
            photos={photos}
            onPhotoUploaded={onPhotoUploaded}
            onPhotoClick={onPhotoClick}
            getPhotoUrl={getPhotoUrl}
            onGalleryDeleted={onGalleryDeleted}
          />
        </div>
      ) : (
        <div className="bg-slate-800/30 backdrop-blur-sm rounded-2xl border border-slate-600 p-12 text-center">
          <FolderPlus className="w-16 h-16 mx-auto text-slate-400 mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">Select a Gallery</h3>
          <p className="text-slate-300">Choose a gallery from the list to manage photos</p>
        </div>
      )}
    </div>
  );
};

export default GalleryMainContent;
