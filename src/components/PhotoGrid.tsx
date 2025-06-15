
import React from 'react';
import { motion } from 'framer-motion';
import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import WatermarkedImage from './WatermarkedImage';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface Photo {
  id: string;
  filename: string;
  title?: string;
  storage_path: string;
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
      <div className="text-center py-20">
        <p className="text-slate-400 text-lg">No photos uploaded yet.</p>
        <p className="text-slate-500 text-sm mt-2">
          Upload some photos to get started.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
      {photos.map((photo, index) => (
        <motion.div
          key={photo.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
          className="group relative bg-slate-700 rounded-lg overflow-hidden"
        >
          <div 
            className="aspect-square cursor-pointer"
            onClick={() => onPhotoClick(photo)}
          >
            <WatermarkedImage
              src={getPhotoUrl(photo.storage_path)}
              alt={photo.title || photo.filename}
              className="w-full h-full object-cover"
              fitContainer={true}
              isAdminView={true} // Admin view - no watermarks
            />
          </div>
          
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center pointer-events-none">
            <div className="pointer-events-auto">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    size="sm"
                    variant="destructive"
                    className="opacity-90"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="bg-slate-800 border-slate-600">
                  <AlertDialogHeader>
                    <AlertDialogTitle className="text-white">Delete Photo</AlertDialogTitle>
                    <AlertDialogDescription className="text-slate-300">
                      Are you sure you want to delete "{photo.title || photo.filename}"? 
                      This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel className="bg-slate-700 border-slate-600 text-white hover:bg-slate-600">
                      Cancel
                    </AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => onDeletePhoto(photo.id, photo.storage_path)}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
          
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2">
            <p className="text-white text-xs truncate">
              {photo.title || photo.filename}
            </p>
            <p className="text-slate-300 text-xs">
              {new Date(photo.created_at).toLocaleDateString()}
            </p>
          </div>
        </motion.div>
      ))}
    </div>
  );
};

export default PhotoGrid;

