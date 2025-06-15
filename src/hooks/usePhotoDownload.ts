
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { ClientSelections } from './useAdminPhotoSelections';

export const usePhotoDownload = () => {
  const [downloadingClient, setDownloadingClient] = useState<string | null>(null);
  const { toast } = useToast();

  const getPhotoUrl = (storagePath: string) => {
    const { data } = supabase.storage
      .from('gallery-photos')
      .getPublicUrl(storagePath);
    return data.publicUrl;
  };

  const downloadClientSelections = async (clientSelections: ClientSelections) => {
    setDownloadingClient(clientSelections.clientName);
    
    try {
      const JSZip = (await import('jszip')).default;
      const zip = new JSZip();
      
      for (const selection of clientSelections.selections) {
        try {
          const photoUrl = getPhotoUrl(selection.photo.storage_path);
          const response = await fetch(photoUrl);
          const blob = await response.blob();
          const filename = selection.photo.title || selection.photo.filename;
          zip.file(`${filename}.jpg`, blob);
        } catch (error) {
          console.error(`Failed to download ${selection.photo.filename}:`, error);
        }
      }
      
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${clientSelections.clientName}-selections.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast({
        title: "Download Complete",
        description: `Downloaded ${clientSelections.selections.length} photos for ${clientSelections.clientName}`,
      });
    } catch (error) {
      toast({
        title: "Download Failed",
        description: "Failed to download selected photos",
        variant: "destructive"
      });
    } finally {
      setDownloadingClient(null);
    }
  };

  return {
    downloadingClient,
    downloadClientSelections,
    getPhotoUrl
  };
};
