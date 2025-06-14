import React from 'react';
import { Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import PhotoGrid from './PhotoGrid';

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

  return (
    <Card className="p-6 bg-white/5 border-white/10">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-semibold">{gallery.name}</h2>
          <p className="text-slate-400">{photos.length} photos</p>
          <p className="text-sm text-blue-300">Access Code: {gallery.access_code}</p>
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
            className="bg-green-600 hover:bg-green-700"
          >
            <label htmlFor="photo-upload" className="cursor-pointer">
              <Upload className="w-4 h-4 mr-2" />
              Upload Photos
            </label>
          </Button>
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
