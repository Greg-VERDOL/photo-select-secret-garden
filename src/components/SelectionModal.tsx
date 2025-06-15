
import React, { useState, useEffect } from 'react';
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
  const { toast } = useToast();

  const selectedPhotoObjects = photos.filter(photo => selectedPhotos.includes(photo.id));
  const extraPhotosCount = Math.max(0, selectedPhotos.length - freePhotoLimit);
  const totalCost = extraPhotosCount * pricePerPhoto;

  // Fetch pricing from settings
  useEffect(() => {
    const fetchPricing = async () => {
      try {
        const { data, error } = await supabase
          .from('app_settings')
          .select('value')
          .eq('key', 'price_per_extra_photo_cents')
          .single();

        if (!error && data) {
          const priceInEuros = parseInt(data.value) / 100;
          setPricePerPhoto(priceInEuros);
        }
      } catch (error) {
        console.warn('Failed to fetch pricing, using default:', error);
      }
    };

    if (isOpen) {
      fetchPricing();
    }
  }, [isOpen]);

  const handleSubmit = async () => {
    if (!email.trim()) {
      toast({
        title: "Email required",
        description: "Please enter your email address",
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
        title: "Selection saved!",
        description: extraPhotosCount > 0 
          ? "Please complete payment to finalize your selection"
          : "Your photo selection has been saved successfully",
      });

      onClose();
    } catch (error) {
      console.error('Error saving selection:', error);
      toast({
        title: "Error",
        description: "Failed to save your selection. Please try again.",
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
            Review Your Selection ({selectedPhotos.length} photos)
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
            <h3 className="text-lg font-semibold mb-3">Selected Photos</h3>
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
