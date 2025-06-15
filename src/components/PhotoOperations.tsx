
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface Gallery {
  id: string;
  name: string;
  client_name?: string;
  client_email?: string;
  access_code: string;
  created_at: string;
  photo_count?: number;
}

export const usePhotoOperations = () => {
  const { toast } = useToast();

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
    gallery: Gallery,
    onPhotoUploaded: () => void
  ) => {
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

  const deletePhoto = async (photoId: string, storagePath: string, onPhotoUploaded: () => void) => {
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

  return {
    handleFileUpload,
    deletePhoto
  };
};
