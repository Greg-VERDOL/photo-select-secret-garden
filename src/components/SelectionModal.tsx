
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Heart, CreditCard } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import EmailFormModal from './EmailFormModal';
import PricingInfo from './PricingInfo';
import SelectedPhotosGrid from './SelectedPhotosGrid';
import EmptySelectionState from './EmptySelectionState';

interface Photo {
  id: string;
  filename: string;
  storage_path: string;
}

interface SelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  photos: Photo[];
  selectedPhotos: string[];
  onPhotoToggle: (photoId: string) => void;
  galleryId: string;
  clientEmail: string;
  freePhotoLimit: number;
  getPhotoUrl: (storagePath: string) => string;
}

const SelectionModal: React.FC<SelectionModalProps> = ({
  isOpen,
  onClose,
  photos,
  selectedPhotos,
  onPhotoToggle,
  galleryId,
  clientEmail,
  freePhotoLimit,
  getPhotoUrl,
}) => {
  const [pricePerPhoto, setPricePerPhoto] = useState(5.00);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [showEmailForm, setShowEmailForm] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchPricing();
  }, []);

  const fetchPricing = async () => {
    try {
      const { data, error } = await supabase
        .from('app_settings')
        .select('value')
        .eq('key', 'price_per_extra_photo_cents')
        .single();

      if (error) throw error;
      setPricePerPhoto(parseInt(data.value) / 100);
    } catch (error) {
      console.error('Error fetching pricing:', error);
    }
  };

  const extraPhotosCount = Math.max(0, selectedPhotos.length - freePhotoLimit);
  const totalCost = extraPhotosCount * pricePerPhoto;
  const needsPayment = extraPhotosCount > 0;
  const needsEmail = needsPayment && (!clientEmail || clientEmail.trim() === '');

  const handleSubmit = async () => {
    if (needsEmail) {
      setShowEmailForm(true);
      return;
    }

    if (needsPayment) {
      await handlePayment();
    } else {
      await saveSelections();
    }
  };

  const handleEmailSubmit = async (email: string) => {
    setShowEmailForm(false);
    await handlePayment(email);
  };

  const handlePayment = async (emailToUse?: string) => {
    setIsProcessingPayment(true);
    const paymentEmail = emailToUse || clientEmail;
    
    try {
      // Store pending selections in localStorage before payment
      const pendingSelections = {
        galleryId,
        clientEmail: paymentEmail,
        selections: selectedPhotos.map(photoId => ({
          gallery_id: galleryId,
          photo_id: photoId,
          client_email: paymentEmail,
        }))
      };
      
      localStorage.setItem('pendingSelections', JSON.stringify(pendingSelections));
      
      const { data, error } = await supabase.functions.invoke('create-payment', {
        body: {
          galleryId,
          clientEmail: paymentEmail,
          extraPhotosCount
        }
      });

      if (error) throw error;

      if (data?.url) {
        // Open payment in new tab
        window.open(data.url, '_blank');
        
        toast({
          title: "Payment processing",
          description: "Complete your payment in the new tab to finalize your selection.",
        });
        
        // Close the modal but don't clear selections yet
        onClose();
      } else {
        throw new Error('No payment URL received');
      }
    } catch (error) {
      // Clear pending selections on error
      localStorage.removeItem('pendingSelections');
      toast({
        title: "Payment failed",
        description: error.message || "Failed to create payment session",
        variant: "destructive"
      });
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const saveSelections = async () => {
    try {
      // Delete existing selections for this client and gallery
      await supabase
        .from('photo_selections')
        .delete()
        .eq('gallery_id', galleryId)
        .eq('client_email', clientEmail);

      // Insert new selections
      if (selectedPhotos.length > 0) {
        const selections = selectedPhotos.map(photoId => ({
          gallery_id: galleryId,
          photo_id: photoId,
          client_email: clientEmail,
        }));

        const { error } = await supabase
          .from('photo_selections')
          .insert(selections);

        if (error) throw error;
      }

      toast({
        title: "Selections saved!",
        description: `You've selected ${selectedPhotos.length} photo(s).`,
      });

      onClose();
    } catch (error) {
      toast({
        title: "Error saving selections",
        description: "Failed to save your photo selections.",
        variant: "destructive"
      });
    }
  };

  if (showEmailForm) {
    return (
      <EmailFormModal
        isOpen={isOpen}
        onClose={() => setShowEmailForm(false)}
        onEmailSubmit={handleEmailSubmit}
        extraPhotosCount={extraPhotosCount}
        totalCost={totalCost}
      />
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-white">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Heart className="w-5 h-5 text-red-500" />
            <span>Your Photo Selection</span>
            <Badge variant="secondary">{selectedPhotos.length} selected</Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <PricingInfo
            freePhotoLimit={freePhotoLimit}
            pricePerPhoto={pricePerPhoto}
            selectedPhotosCount={selectedPhotos.length}
            extraPhotosCount={extraPhotosCount}
            totalCost={totalCost}
          />

          {selectedPhotos.length === 0 ? (
            <EmptySelectionState />
          ) : (
            <SelectedPhotosGrid
              photos={photos}
              selectedPhotos={selectedPhotos}
              onPhotoToggle={onPhotoToggle}
              getPhotoUrl={getPhotoUrl}
            />
          )}

          {/* Action Buttons */}
          <div className="flex justify-between items-center pt-4 border-t">
            <div className="text-sm text-gray-600">
              {needsPayment && (
                <span className="text-red-600 font-semibold">
                  Total cost: €{totalCost.toFixed(2)}
                </span>
              )}
              {!needsPayment && selectedPhotos.length > 0 && (
                <span className="text-green-600 font-semibold">
                  All photos are free!
                </span>
              )}
            </div>
            
            <div className="space-x-3">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button 
                onClick={handleSubmit}
                disabled={selectedPhotos.length === 0 || isProcessingPayment}
                className={needsPayment ? "bg-blue-600 hover:bg-blue-700" : "bg-green-600 hover:bg-green-700"}
              >
                {isProcessingPayment ? (
                  "Processing..."
                ) : needsEmail ? (
                  "Enter Email for Payment"
                ) : needsPayment ? (
                  <>
                    <CreditCard className="w-4 h-4 mr-2" />
                    Pay €{totalCost.toFixed(2)}
                  </>
                ) : (
                  "Confirm Selection"
                )}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SelectionModal;
