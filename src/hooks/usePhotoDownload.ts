
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

  const getUnwatermarkedPhotoUrl = (storagePath: string) => {
    // For unwatermarked photos, we'll use the original storage path
    // This assumes the original photos are stored without watermarks
    const { data } = supabase.storage
      .from('gallery-photos')
      .getPublicUrl(storagePath);
    return data.publicUrl;
  };

  const downloadClientSelections = async (clientSelections: ClientSelections, unwatermarked: boolean = false) => {
    setDownloadingClient(clientSelections.clientName);
    
    try {
      const JSZip = (await import('jszip')).default;
      const zip = new JSZip();
      
      for (const selection of clientSelections.selections) {
        try {
          const photoUrl = unwatermarked 
            ? getUnwatermarkedPhotoUrl(selection.photo.storage_path)
            : getPhotoUrl(selection.photo.storage_path);
          
          const response = await fetch(photoUrl);
          const blob = await response.blob();
          const filename = selection.photo.title || selection.photo.filename;
          const extension = filename.includes('.') ? '' : '.jpg';
          zip.file(`${filename}${extension}`, blob);
        } catch (error) {
          console.error(`Failed to download ${selection.photo.filename}:`, error);
        }
      }
      
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement('a');
      a.href = url;
      const suffix = unwatermarked ? '-unwatermarked' : '';
      a.download = `${clientSelections.clientName}-selections${suffix}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast({
        title: "Download Complete",
        description: `Downloaded ${clientSelections.selections.length} ${unwatermarked ? 'unwatermarked ' : ''}photos for ${clientSelections.clientName}`,
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
    getPhotoUrl,
    getUnwatermarkedPhotoUrl
  };
};
