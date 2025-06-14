
import React, { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import PhotoSelectionsHeader from './PhotoSelectionsHeader';
import EmptySelectionsState from './EmptySelectionsState';
import ClientSelectionCard from './ClientSelectionCard';
import PhotoSelectionModal from './PhotoSelectionModal';

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

interface ClientSelections {
  clientName: string;
  clientEmail: string;
  galleryName: string;
  selections: PhotoSelection[];
}

const PhotoSelectionsTab: React.FC = () => {
  const [selections, setSelections] = useState<PhotoSelection[]>([]);
  const [groupedSelections, setGroupedSelections] = useState<ClientSelections[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPhoto, setSelectedPhoto] = useState<PhotoSelection | null>(null);
  const [downloadingClient, setDownloadingClient] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchSelections();
  }, []);

  useEffect(() => {
    if (selections.length > 0) {
      groupSelectionsByClient();
    }
  }, [selections]);

  const fetchSelections = async () => {
    try {
      const { data, error } = await supabase
        .from('photo_selections')
        .select(`
          id,
          selected_at,
          client_email,
          photo:photos(id, filename, title, storage_path),
          gallery:galleries(id, name, client_name)
        `)
        .order('selected_at', { ascending: false });

      if (error) throw error;
      setSelections(data || []);
    } catch (error) {
      toast({
        title: "Error fetching selections",
        description: "Failed to load photo selections",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const groupSelectionsByClient = () => {
    const grouped = selections.reduce((acc, selection) => {
      const key = `${selection.gallery.client_name}-${selection.client_email}`;
      
      if (!acc[key]) {
        acc[key] = {
          clientName: selection.gallery.client_name,
          clientEmail: selection.client_email,
          galleryName: selection.gallery.name,
          selections: []
        };
      }
      
      acc[key].selections.push(selection);
      return acc;
    }, {} as Record<string, ClientSelections>);

    setGroupedSelections(Object.values(grouped));
  };

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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-400">Loading selections...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <PhotoSelectionsHeader />

      {groupedSelections.length === 0 ? (
        <EmptySelectionsState />
      ) : (
        <div className="space-y-8">
          {groupedSelections.map((clientGroup, index) => (
            <ClientSelectionCard
              key={index}
              clientGroup={clientGroup}
              getPhotoUrl={getPhotoUrl}
              onPhotoClick={setSelectedPhoto}
              onDownloadAll={downloadClientSelections}
              downloadingClient={downloadingClient}
            />
          ))}
        </div>
      )}

      {selectedPhoto && (
        <PhotoSelectionModal
          isOpen={!!selectedPhoto}
          onClose={() => setSelectedPhoto(null)}
          photoUrl={getPhotoUrl(selectedPhoto.photo.storage_path)}
          photoTitle={selectedPhoto.photo.title || selectedPhoto.photo.filename}
          clientName={selectedPhoto.gallery.client_name}
        />
      )}
    </div>
  );
};

export default PhotoSelectionsTab;
