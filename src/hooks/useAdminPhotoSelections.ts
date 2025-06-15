
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

export interface PhotoSelection {
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

export interface PaymentInfo {
  extraPhotosCount: number;
  amountPaid: number;
  currency: string;
}

export interface ClientSelections {
  clientName: string;
  clientEmail: string;
  galleryName: string;
  galleryId: string;
  freePhotoLimit: number;
  selections: PhotoSelection[];
  paymentInfo?: PaymentInfo;
}

export const useAdminPhotoSelections = () => {
  const [groupedSelections, setGroupedSelections] = useState<ClientSelections[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { toast } = useToast();

  const fetchPhotoSelections = async () => {
    try {
      const { data: selections, error } = await supabase
        .from('photo_selections')
        .select(`
          id,
          selected_at,
          client_email,
          photo:photos(
            id,
            filename,
            title,
            storage_path
          ),
          gallery:galleries(
            id,
            name,
            client_name,
            free_photo_limit
          )
        `)
        .order('selected_at', { ascending: false });

      if (error) throw error;

      // Group selections by client and gallery
      const grouped = selections?.reduce((acc: ClientSelections[], selection: any) => {
        const key = `${selection.client_email}-${selection.gallery.id}`;
        let clientGroup = acc.find(g => 
          g.clientEmail === selection.client_email && 
          g.galleryId === selection.gallery.id
        );

        if (!clientGroup) {
          clientGroup = {
            clientName: selection.gallery.client_name || 'Unknown Client',
            clientEmail: selection.client_email,
            galleryName: selection.gallery.name,
            galleryId: selection.gallery.id,
            freePhotoLimit: selection.gallery.free_photo_limit || 5,
            selections: [],
          };
          acc.push(clientGroup);
        }

        clientGroup.selections.push(selection);
        return acc;
      }, []) || [];

      setGroupedSelections(grouped);
    } catch (error) {
      console.error('Error fetching photo selections:', error);
      toast({
        title: "Error loading selections",
        description: "Failed to load photo selections",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleManualRefresh = async () => {
    setRefreshing(true);
    await fetchPhotoSelections();
  };

  useEffect(() => {
    fetchPhotoSelections();

    // Set up real-time subscription
    const subscription = supabase
      .channel('photo_selections_changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'photo_selections'
      }, () => {
        fetchPhotoSelections();
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return {
    groupedSelections,
    loading,
    refreshing,
    handleManualRefresh
  };
};
