
import React, { useState } from 'react';
import { Upload, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
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

interface GalleryActionsProps {
  gallery: Gallery;
  photos: Photo[];
  onPhotoUploaded: () => void;
  onGalleryDeleted: () => void;
  onFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

const GalleryActions: React.FC<GalleryActionsProps> = ({
  gallery,
  photos,
  onGalleryDeleted,
  onFileUpload
}) => {
  const { toast } = useToast();
  const [isDeletingGallery, setIsDeletingGallery] = useState(false);

  const deleteGallery = async () => {
    setIsDeletingGallery(true);
    
    try {
      // First, get all photos in the gallery to delete from storage
      const { data: photosData, error: photosError } = await supabase
        .from('photos')
        .select('storage_path')
        .eq('gallery_id', gallery.id);

      if (photosError) throw photosError;

      // Delete photos from storage
      if (photosData && photosData.length > 0) {
        const filePaths = photosData.map(photo => photo.storage_path);
        const { error: storageError } = await supabase.storage
          .from('gallery-photos')
          .remove(filePaths);

        if (storageError) throw storageError;
      }

      // Delete the gallery (this will cascade delete photos and selections due to foreign key constraints)
      const { error: galleryError } = await supabase
        .from('galleries')
        .delete()
        .eq('id', gallery.id);

      if (galleryError) throw galleryError;

      toast({
        title: "Gallery deleted",
        description: `Gallery "${gallery.name}" and all its photos have been deleted.`,
      });

      onGalleryDeleted();
    } catch (error) {
      toast({
        title: "Delete failed",
        description: "Failed to delete gallery",
        variant: "destructive"
      });
    } finally {
      setIsDeletingGallery(false);
    }
  };

  return (
    <div className="flex gap-3">
      <input
        type="file"
        id="photo-upload"
        multiple
        accept="image/*"
        onChange={onFileUpload}
        className="hidden"
      />
      <Button
        asChild
        className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
      >
        <label htmlFor="photo-upload" className="cursor-pointer">
          <Upload className="w-4 h-4 mr-2" />
          Upload Photos
        </label>
      </Button>
      
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="destructive" size="default">
            <Trash2 className="w-4 h-4 mr-2" />
            Delete Gallery
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent className="bg-slate-800 border-slate-600 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Delete Gallery</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-300">
              Are you sure you want to delete the gallery "{gallery.name}" and all its photos? 
              This action cannot be undone and will permanently delete:
              <br />• {photos.length} photos
              <br />• All photo selections
              <br />• All payment records
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-slate-700 border-slate-600 text-white hover:bg-slate-600">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={deleteGallery}
              disabled={isDeletingGallery}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeletingGallery ? "Deleting..." : "Delete Gallery"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default GalleryActions;
