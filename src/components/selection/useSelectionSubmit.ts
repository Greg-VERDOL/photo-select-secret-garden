
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';

interface Photo {
  id: string;
  filename: string;
  title?: string;
  storage_path: string;
}

interface GalleryInfo {
  name: string;
  access_code: string;
  client_name?: string;
}

interface UseSelectionSubmitProps {
  galleryId: string;
  selectedPhotos: string[];
  photos: Photo[];
  galleryInfo: GalleryInfo | null;
  freePhotoLimit: number;
  pricePerPhoto: number;
  onClose: () => void;
}

export const useSelectionSubmit = ({
  galleryId,
  selectedPhotos,
  photos,
  galleryInfo,
  freePhotoLimit,
  pricePerPhoto,
  onClose
}: UseSelectionSubmitProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const { t } = useTranslation();

  const selectedPhotoObjects = photos.filter(photo => selectedPhotos.includes(photo.id));
  const extraPhotosCount = Math.max(0, selectedPhotos.length - freePhotoLimit);
  const totalCost = extraPhotosCount * pricePerPhoto;

  const sendAdminNotification = async (email: string) => {
    try {
      const { error } = await supabase.functions.invoke('send-admin-notification', {
        body: {
          galleryId,
          clientEmail: email.trim(),
          clientName: galleryInfo?.client_name,
          selectedPhotosCount: selectedPhotos.length,
          extraPhotosCount,
          totalCost,
          galleryName: galleryInfo?.name || 'Unknown Gallery',
          accessCode: galleryInfo?.access_code || '',
          selectedPhotos: selectedPhotoObjects.map(photo => ({
            id: photo.id,
            filename: photo.filename,
            title: photo.title
          }))
        }
      });

      if (error) {
        console.warn('Failed to send admin notification:', error);
      } else {
        console.log('Admin notification sent successfully');
      }
    } catch (error) {
      console.warn('Failed to send admin notification:', error);
    }
  };

  const handleSubmit = async (email: string) => {
    if (!email.trim()) {
      toast({
        title: t('selectionModal.emailRequired'),
        description: t('selectionModal.emailRequiredDescription'),
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Use the database function to handle photo selections with proper transaction
      const { error: transactionError } = await supabase.rpc('handle_photo_selections' as any, {
        p_gallery_id: galleryId,
        p_client_email: email.trim(),
        p_photo_ids: selectedPhotos
      });

      if (transactionError) {
        // Fallback to manual transaction if the RPC fails
        console.log('RPC failed, using manual transaction:', transactionError);
        
        // First, delete all existing selections for this client and gallery
        const { error: deleteError } = await supabase
          .from('photo_selections')
          .delete()
          .eq('gallery_id', galleryId)
          .eq('client_email', email.trim());

        if (deleteError) throw deleteError;

        // Then, insert new selections if any photos are selected
        if (selectedPhotos.length > 0) {
          const selections = selectedPhotos.map(photoId => ({
            photo_id: photoId,
            gallery_id: galleryId,
            client_email: email.trim()
          }));

          const { error: insertError } = await supabase
            .from('photo_selections')
            .insert(selections);

          if (insertError) throw insertError;
        }
      }

      // Send admin notification (don't await to avoid blocking)
      sendAdminNotification(email);

      // Handle payment if needed
      if (extraPhotosCount > 0) {
        const { data, error } = await supabase.functions.invoke('create-payment', {
          body: {
            galleryId,
            clientEmail: email.trim(),
            extraPhotosCount,
            totalAmount: totalCost * 100, // Convert to cents
          }
        });

        if (error) throw error;

        // Redirect to Stripe Checkout
        if (data?.url) {
          window.location.href = data.url;
          return;
        }
      }

      toast({
        title: t('selectionModal.selectionSaved'),
        description: extraPhotosCount > 0 
          ? t('selectionModal.paymentDescription')
          : t('selectionModal.selectionSavedSuccess'),
      });

      onClose();
    } catch (error) {
      console.error('Error saving selection:', error);
      toast({
        title: t('selectionModal.error'),
        description: t('selectionModal.errorDescription'),
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    isSubmitting,
    extraPhotosCount,
    totalCost,
    handleSubmit
  };
};
