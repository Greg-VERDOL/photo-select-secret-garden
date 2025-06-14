
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { X, Trash2 } from 'lucide-react';
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

interface PhotoPreviewModalProps {
  photo: Photo | null;
  isOpen: boolean;
  onClose: () => void;
  onDelete?: (photoId: string, storagePath: string) => void;
  getPhotoUrl: (storagePath: string) => string;
}

const PhotoPreviewModal: React.FC<PhotoPreviewModalProps> = ({
  photo,
  isOpen,
  onClose,
  onDelete,
  getPhotoUrl
}) => {
  if (!photo) return null;

  const handleDelete = () => {
    if (onDelete && window.confirm('Are you sure you want to delete this photo?')) {
      onDelete(photo.id, photo.storage_path);
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] bg-slate-800 border-slate-600 text-white overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex justify-between items-center">
            <span>{photo.title || photo.filename}</span>
            <div className="flex gap-2">
              {onDelete && (
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={handleDelete}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </Button>
              )}
              <Button
                size="sm"
                variant="outline"
                onClick={onClose}
                className="border-slate-600 text-slate-300 hover:bg-slate-700"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex flex-col items-center space-y-4">
          <div className="max-w-full max-h-[60vh] overflow-hidden rounded-lg">
            <WatermarkedImage
              src={getPhotoUrl(photo.storage_path)}
              alt={photo.title || photo.filename}
              className="max-w-full max-h-full object-contain"
            />
          </div>
          
          {photo.description && (
            <div className="text-slate-300 text-center max-w-md">
              <p className="text-sm">{photo.description}</p>
            </div>
          )}
          
          <div className="text-slate-400 text-xs text-center">
            <p>Uploaded: {new Date(photo.created_at).toLocaleDateString()}</p>
            <p>Filename: {photo.filename}</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PhotoPreviewModal;
