
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Heart, X, CreditCard, Mail } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

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
  const [tempClientEmail, setTempClientEmail] = useState('');
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

  const handleEmailSubmit = async () => {
    if (!tempClientEmail || tempClientEmail.trim() === '') {
      toast({
        title: "Email required",
        description: "Please enter your email address to proceed with payment.",
        variant: "destructive"
      });
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(tempClientEmail.trim())) {
      toast({
        title: "Invalid email",
        description: "Please enter a valid email address.",
        variant: "destructive"
      });
      return;
    }

    setShowEmailForm(false);
    await handlePayment(tempClientEmail.trim());
  };

  const handlePayment = async (emailToUse?: string) => {
    setIsProcessingPayment(true);
    const paymentEmail = emailToUse || clientEmail;
    
    try {
      const { data, error } = await supabase.functions.invoke('create-payment', {
        body: {
          galleryId,
          clientEmail: paymentEmail,
          extraPhotosCount
        }
      });

      if (error) throw error;

      if (data?.url) {
        window.open(data.url, '_blank');
        toast({
          title: "Payment processing",
          description: "Redirected to payment page. Complete your payment to finalize your selection.",
        });
      } else {
        throw new Error('No payment URL received');
      }
    } catch (error) {
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
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-md bg-white">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Mail className="w-5 h-5 text-blue-500" />
              <span>Email Required for Payment</span>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm text-blue-800">
                We need your email address to process the payment for {extraPhotosCount} extra photo{extraPhotosCount > 1 ? 's' : ''} (€{totalCost.toFixed(2)}).
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="client-email">Email Address</Label>
              <Input
                id="client-email"
                type="email"
                placeholder="your.email@example.com"
                value={tempClientEmail}
                onChange={(e) => setTempClientEmail(e.target.value)}
                className="w-full"
              />
            </div>

            <div className="flex justify-between items-center pt-4">
              <Button variant="outline" onClick={() => setShowEmailForm(false)}>
                Back
              </Button>
              <Button 
                onClick={handleEmailSubmit}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <CreditCard className="w-4 h-4 mr-2" />
                Continue to Payment
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
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
          {/* Pricing Information */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-semibold text-blue-900 mb-2">Pricing Information</h3>
            <div className="text-sm text-blue-800 space-y-1">
              <p>• Free photos included: {freePhotoLimit}</p>
              <p>• Price per extra photo: €{pricePerPhoto.toFixed(2)}</p>
              <p>• Photos selected: {selectedPhotos.length}</p>
              {extraPhotosCount > 0 && (
                <p className="font-semibold">• Extra photos: {extraPhotosCount} (€{totalCost.toFixed(2)})</p>
              )}
            </div>
          </div>

          {/* Selected Photos Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {photos
              .filter(photo => selectedPhotos.includes(photo.id))
              .map((photo) => (
                <div key={photo.id} className="relative group">
                  <img
                    src={getPhotoUrl(photo.storage_path)}
                    alt={photo.filename}
                    className="w-full h-32 object-cover rounded-lg"
                  />
                  <button
                    onClick={() => onPhotoToggle(photo.id)}
                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-4 h-4" />
                  </button>
                  <div className="absolute bottom-2 left-2">
                    <Badge variant="secondary" className="text-xs">
                      {selectedPhotos.indexOf(photo.id) + 1}
                    </Badge>
                  </div>
                </div>
              ))}
          </div>

          {selectedPhotos.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <Heart className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No photos selected yet</p>
              <p className="text-sm">Go back and select your favorite photos</p>
            </div>
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
