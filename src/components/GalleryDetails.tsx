
import React, { useState } from 'react';
import { Upload, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import PhotoGrid from './PhotoGrid';
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
  const { toast } = useToast();
  const [isDeletingGallery, setIsDeletingGallery] = useState(false);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    const uploadPromises = Array.from(files).map(async (file) => {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${gallery.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('gallery-photos')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { error: dbError } = await supabase
        .from('photos')
        .insert({
          gallery_id: gallery.id,
          filename: file.name,
          title: file.name.split('.')[0],
          storage_path: filePath,
          thumbnail_path: filePath
        });

      if (dbError) throw dbError;
    });

    try {
      await Promise.all(uploadPromises);
      toast({
        title: "Photos uploaded successfully",
        description: `Added ${files.length} photos to ${gallery.name}`,
      });
      onPhotoUploaded();
    } catch (error) {
      toast({
        title: "Upload failed",
        description: "Some photos failed to upload",
        variant: "destructive"
      });
    }
  };

  const deletePhoto = async (photoId: string, storagePath: string) => {
    try {
      const { error: storageError } = await supabase.storage
        .from('gallery-photos')
        .remove([storagePath]);

      if (storageError) throw storageError;

      const { error: dbError } = await supabase
        .from('photos')
        .delete()
        .eq('id', photoId);

      if (dbError) throw dbError;

      toast({
        title: "Photo deleted",
        description: "Photo removed from gallery.",
      });

      onPhotoUploaded();
    } catch (error) {
      toast({
        title: "Delete failed",
        description: "Failed to delete photo",
        variant: "destructive"
      });
    }
  };

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
    <Card className="p-6 bg-transparent border-none">
      <div className="flex justify-between items-start mb-6">
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
        
        <div className="flex gap-3">
          <input
            type="file"
            id="photo-upload"
            multiple
            accept="image/*"
            onChange={handleFileUpload}
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
      </div>

      <PhotoGrid
        photos={photos}
        getPhotoUrl={getPhotoUrl}
        onPhotoClick={onPhotoClick}
        onDeletePhoto={deletePhoto}
      />
    </Card>
  );
};

export default GalleryDetails;
