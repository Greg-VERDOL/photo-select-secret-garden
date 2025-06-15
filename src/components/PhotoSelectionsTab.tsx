import React, { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
    free_photo_limit: number;
  };
}

interface PaymentInfo {
  extraPhotosCount: number;
  amountPaid: number;
  currency: string;
}

interface ClientSelections {
  clientName: string;
  clientEmail: string;
  galleryName: string;
  galleryId: string;
  freePhotoLimit: number;
  selections: PhotoSelection[];
  paymentInfo?: PaymentInfo;
}

const PhotoSelectionsTab: React.FC = () => {
  const [selections, setSelections] = useState<PhotoSelection[]>([]);
  const [groupedSelections, setGroupedSelections] = useState<ClientSelections[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<PhotoSelection | null>(null);
  const [downloadingClient, setDownloadingClient] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchSelections();
    
    // Set up automatic refresh every 30 seconds
    const interval = setInterval(() => {
      fetchSelections(true);
    }, 30000);

    // Set up real-time subscription for new photo selections
    const channel = supabase
      .channel('photo-selections-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'photo_selections'
        },
        () => {
          fetchSelections(true);
        }
      )
      .subscribe();

    return () => {
      clearInterval(interval);
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    if (selections.length > 0) {
      groupSelectionsByClient();
    } else {
      setGroupedSelections([]);
    }
  }, [selections]);

  const fetchSelections = async (silent = false) => {
    if (!silent) {
      setLoading(true);
    } else {
      setRefreshing(true);
    }

    try {
      const { data, error } = await supabase
        .from('photo_selections')
        .select(`
          id,
          selected_at,
          client_email,
          photo:photos(id, filename, title, storage_path),
          gallery:galleries(id, name, client_name, free_photo_limit)
        `)
        .order('selected_at', { ascending: false });

      if (error) throw error;
      setSelections(data || []);
    } catch (error) {
      if (!silent) {
        toast({
          title: "Error fetching selections",
          description: "Failed to load photo selections",
          variant: "destructive"
        });
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchPaymentInfo = async (galleryId: string, clientEmail: string): Promise<PaymentInfo | undefined> => {
    try {
      const { data, error } = await supabase
        .from('payment_sessions')
        .select('extra_photos_count, amount_cents')
        .eq('gallery_id', galleryId)
        .eq('client_email', clientEmail)
        .eq('status', 'completed')
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) throw error;
      
      if (data && data.length > 0) {
        return {
          extraPhotosCount: data[0].extra_photos_count,
          amountPaid: data[0].amount_cents,
          currency: 'EUR'
        };
      }
    } catch (error) {
      console.error('Error fetching payment info:', error);
    }
    return undefined;
  };

  const handleManualRefresh = () => {
    fetchSelections();
    toast({
      title: "Refreshed",
      description: "Photo selections have been updated",
    });
  };

  const handlePhotoClick = (selection: PhotoSelection) => {
    setSelectedPhoto(selection);
  };

  const groupSelectionsByClient = async () => {
    const grouped = selections.reduce((acc, selection) => {
      const key = `${selection.gallery.client_name}-${selection.client_email}-${selection.gallery.id}`;
      
      if (!acc[key]) {
        acc[key] = {
          clientName: selection.gallery.client_name,
          clientEmail: selection.client_email,
          galleryName: selection.gallery.name,
          galleryId: selection.gallery.id,
          freePhotoLimit: selection.gallery.free_photo_limit || 5,
          selections: []
        };
      }
      
      acc[key].selections.push(selection);
      return acc;
    }, {} as Record<string, ClientSelections>);

    // Fetch payment information for each client group
    const groupsWithPaymentInfo = await Promise.all(
      Object.values(grouped).map(async (group) => {
        const paymentInfo = await fetchPaymentInfo(group.galleryId, group.clientEmail);
        return { ...group, paymentInfo };
      })
    );

    setGroupedSelections(groupsWithPaymentInfo);
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
      <div className="flex items-center justify-between">
        <PhotoSelectionsHeader />
        <Button
          onClick={handleManualRefresh}
          variant="outline"
          className="border-slate-600 text-slate-300 hover:bg-slate-700"
          disabled={refreshing}
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {groupedSelections.length === 0 ? (
        <EmptySelectionsState />
      ) : (
        <div className="space-y-8">
          {groupedSelections.map((clientGroup, index) => (
            <ClientSelectionCard
              key={index}
              clientGroup={clientGroup}
              getPhotoUrl={getPhotoUrl}
              onPhotoClick={handlePhotoClick}
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
