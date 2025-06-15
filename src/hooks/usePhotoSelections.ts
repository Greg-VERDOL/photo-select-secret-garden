
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

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

export const usePhotoSelections = () => {
  const [selections, setSelections] = useState<PhotoSelection[]>([]);
  const [groupedSelections, setGroupedSelections] = useState<ClientSelections[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { toast } = useToast();

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

    const groupsWithPaymentInfo = await Promise.all(
      Object.values(grouped).map(async (group) => {
        const paymentInfo = await fetchPaymentInfo(group.galleryId, group.clientEmail);
        return { ...group, paymentInfo };
      })
    );

    setGroupedSelections(groupsWithPaymentInfo);
  };

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

  const handleManualRefresh = () => {
    fetchSelections();
    toast({
      title: "Refreshed",
      description: "Photo selections have been updated",
    });
  };

  useEffect(() => {
    fetchSelections();
    
    const interval = setInterval(() => {
      fetchSelections(true);
    }, 30000);

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

  return {
    groupedSelections,
    loading,
    refreshing,
    handleManualRefresh
  };
};

export type { PhotoSelection, ClientSelections, PaymentInfo };
