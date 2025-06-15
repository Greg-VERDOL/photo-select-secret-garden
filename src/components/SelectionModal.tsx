
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import SelectedPhotosGrid from './SelectedPhotosGrid';
import PricingInfo from './PricingInfo';
import ClientInfoForm from './ClientInfoForm';
import SelectionActions from './SelectionActions';

interface Photo {
  id: string;
  filename: string;
  title?: string;
  storage_path: string;
}

interface SelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedPhotos: string[];
  photos: Photo[];
  onPhotoToggle: (photoId: string) => void;
  galleryId: string;
  clientEmail: string;
  freePhotoLimit: number;
  getPhotoUrl: (storagePath: string) => string;
}

const SelectionModal: React.FC<SelectionModalProps> = ({
  isOpen,
  onClose,
  selectedPhotos,
  photos,
  onPhotoToggle,
  galleryId,
  clientEmail,
  freePhotoLimit,
  getPhotoUrl
}) => {
  const [email, setEmail] = useState(clientEmail);
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pricePerPhoto, setPricePerPhoto] = useState(5.00);
  const [galleryInfo, setGalleryInfo] = useState<any>(null);
  const { toast } = useToast();
  const { t } = useTranslation();

  const selectedPhotoObjects = photos.filter(photo => selectedPhotos.includes(photo.id));
  const extraPhotosCount = Math.max(0, selectedPhotos.length - freePhotoLimit);
  const totalCost = extraPhotosCount * pricePerPhoto;

  // Fetch pricing and gallery info
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch pricing
        const { data: pricingData, error: pricingError } = await supabase
          .from('app_settings')
          .select('value')
          .eq('key', 'price_per_extra_photo_cents')
          .single();

        if (!pricingError && pricingData) {
          const priceInEuros = parseInt(pricingData.value) / 100;
          setPricePerPhoto(priceInEuros);
        }

        // Fetch gallery info for notifications
        const { data: gallery, error: galleryError } = await supabase
          .from('galleries')
          .select('name, access_code, client_name')
          .eq('id', galleryId)
          .single();

        if (!galleryError && gallery) {
          setGalleryInfo(gallery);
        }
      } catch (error) {
        console.warn('Failed to fetch data:', error);
      }
    };

    if (isOpen) {
      fetchData();
    }
  }, [isOpen, galleryId]);

  const sendAdminNotification = async () => {
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
      // Don't block the main flow if notification fails
    }
  };

  const handleSubmit = async () => {
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
      // Save photo selections
      const selections = selectedPhotos.map(photoId => ({
        photo_id: photoId,
        gallery_id: galleryId,
        client_email: email.trim()
      }));

      const { error: selectionsError } = await supabase
        .from('photo_selections')
        .upsert(selections, { 
          onConflict: 'photo_id,gallery_id,client_email',
          ignoreDuplicates: false 
        });

      if (selectionsError) throw selectionsError;

      // Send admin notification (don't await to avoid blocking)
      sendAdminNotification();

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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-[90vh] bg-slate-800 border-slate-600 text-white flex flex-col">
        <DialogHeader className="flex-shrink-0 pb-4">
          <DialogTitle className="flex justify-between items-center text-xl">
            {t('selectionModal.title', { count: selectedPhotos.length })}
            <Button
              size="sm"
              variant="outline"
              onClick={onClose}
              className="border-slate-600 text-slate-300 hover:bg-slate-700"
            >
              <X className="w-4 h-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-6 pr-2">
          {/* Selected Photos Grid */}
          <div>
            <h3 className="text-lg font-semibold mb-3">{t('selectionModal.selectedPhotos')}</h3>
            <SelectedPhotosGrid
              photos={photos}
              selectedPhotos={selectedPhotos}
              onPhotoToggle={onPhotoToggle}
              getPhotoUrl={getPhotoUrl}
            />
          </div>

          {/* Pricing Information */}
          <PricingInfo
            freePhotoLimit={freePhotoLimit}
            pricePerPhoto={pricePerPhoto}
            selectedPhotosCount={selectedPhotos.length}
            extraPhotosCount={extraPhotosCount}
            totalCost={totalCost}
          />

          {/* Client Information Form */}
          <ClientInfoForm
            email={email}
            message={message}
            onEmailChange={setEmail}
            onMessageChange={setMessage}
          />
        </div>

        {/* Action Buttons - Fixed at bottom */}
        <div className="flex-shrink-0 pt-4 border-t border-slate-600">
          <SelectionActions
            selectedPhotosCount={selectedPhotos.length}
            extraPhotosCount={extraPhotosCount}
            totalCost={totalCost}
            isSubmitting={isSubmitting}
            onSubmit={handleSubmit}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SelectionModal;
