
import React from 'react';
import { Eye, Calendar } from 'lucide-react';

interface PhotoSelection {
  id: string;
  selected_at: string;
  client_email: string;
  photo: {
    id: string;
    filename: string;
    title: string;
    storage_path: string;
  };
  gallery: {
    id: string;
    name: string;
    client_name: string;
  };
}

interface PhotoThumbnailProps {
  selection: PhotoSelection;
  photoUrl: string;
  onClick: () => void;
}

const PhotoThumbnail: React.FC<PhotoThumbnailProps> = ({ selection, photoUrl, onClick }) => {
  return (
    <div
      className="group relative aspect-square rounded-xl overflow-hidden bg-slate-800 cursor-pointer hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-2xl"
      onClick={onClick}
    >
      <img
        src={photoUrl}
        alt={selection.photo.title || selection.photo.filename}
        className="w-full h-full object-cover"
      />
      
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-300 flex items-center justify-center">
        <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
            <Eye className="w-6 h-6 text-white" />
          </div>
        </div>
      </div>

      {/* Selection Date Badge */}
      <div className="absolute bottom-2 left-2 right-2">
        <div className="bg-black/60 backdrop-blur-sm rounded-lg px-2 py-1 text-xs text-white">
          <div className="flex items-center space-x-1">
            <Calendar className="w-3 h-3" />
            <span>{new Date(selection.selected_at).toLocaleDateString()}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PhotoThumbnail;
