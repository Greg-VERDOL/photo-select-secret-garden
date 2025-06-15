
import React from 'react';

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

interface GalleryInfoProps {
  gallery: Gallery;
  photos: Photo[];
}

const GalleryInfo: React.FC<GalleryInfoProps> = ({ gallery, photos }) => {
  return (
    <div>
      <h2 className="text-2xl font-semibold text-white mb-2">{gallery.name}</h2>
      <div className="space-y-1">
        <p className="text-slate-300">{photos.length} photos</p>
        {gallery.client_name && (
          <p className="text-slate-300">Client: {gallery.client_name}</p>
        )}
        {gallery.client_email && (
          <p className="text-slate-300">Email: {gallery.client_email}</p>
        )}
        <p className="text-sm text-blue-300">Access Code: {gallery.access_code}</p>
      </div>
    </div>
  );
};

export default GalleryInfo;
