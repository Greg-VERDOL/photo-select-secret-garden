
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Mail, Heart, CreditCard, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import WatermarkedImage from './WatermarkedImage';

interface Photo {
  id: string;
  url?: string;
  thumbnail?: string;
  title?: string;
  description?: string;
  filename: string;
}

interface Gallery {
  id: string;
  name: string;
  free_photo_limit: number;
}

interface SelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedPhotos: Set<string>;
  photos: Photo[];
  clientInfo: { name: string; email: string };
  setClientInfo: (info: { name: string; email: string }) => void;
  galleryId: string;
}

const SelectionModal: React.FC<SelectionModalProps> = ({
  isOpen,
  onClose,
  selectedPhotos,
  photos,
  clientInfo,
  setClientInfo,
  galleryId
}) => {
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [gallery, setGallery] = useState<Gallery | null>(null);
  const [pricePerPhoto, setPricePerPhoto] = useState(0);
  const { toast } = useToast();

  const selectedPhotosList = photos.filter(photo => selectedPhotos.has(photo.id));
  const freeLimit = gallery?.free_photo_limit || 5;
  const extraPhotos = Math.max(0, selectedPhotos.size - freeLimit);
  const totalCost = extraPhotos * pricePerPhoto;

  useEffect(() => {
    if (isOpen && galleryId) {
      fetchGalleryAndPricing();
    }
  }, [isOpen, galleryId]);

  const fetchGalleryAndPricing = async () => {
    try {
      // Fetch gallery info
      const { data: galleryData, error: galleryError } = await supabase
        .from('galleries')
        .select('id, name, free_photo_limit')
        .eq('id', galleryId)
        .single();

      if (galleryError) throw galleryError;
      setGallery(galleryData);

      // Fetch price per photo
      const { data: priceData, error: priceError } = await supabase
        .from('app_settings')
        .select('value')
        .eq('key', 'price_per_extra_photo_cents')
        .single();

      if (priceError) throw priceError;
      setPricePerPhoto(parseInt(priceData.value) / 100);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!clientInfo.name || !clientInfo.email) {
      toast({
        title: "Missing information",
        description: "Please provide your name and email address.",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // If extra photos need payment, redirect to Stripe
      if (extraPhotos > 0) {
        const { data, error } = await supabase.functions.invoke('create-payment', {
          body: {
            galleryId,
            clientEmail: clientInfo.email,
            extraPhotosCount: extraPhotos
          }
        });

        if (error) throw error;

        // Store selections temporarily (we'll complete after payment)
        const selections = Array.from(selectedPhotos).map(photoId => ({
          gallery_id: galleryId,
          photo_id: photoId,
          client_email: clientInfo.email
        }));

        // Store in localStorage to complete after payment
        localStorage.setItem('pendingSelections', JSON.stringify({
          selections,
          clientInfo,
          message
        }));

        // Redirect to Stripe
        window.open(data.url, '_blank');
        
        toast({
          title: "Redirecting to payment",
          description: "Complete your payment to finalize your selection.",
        });
      } else {
        // No payment needed, save selections directly
        const selections = Array.from(selectedPhotos).map(photoId => ({
          gallery_id: galleryId,
          photo_id: photoId,
          client_email: clientInfo.email
        }));

        const { error } = await supabase
          .from('photo_selections')
          .upsert(selections, { 
            onConflict: 'gallery_id,photo_id',
            ignoreDuplicates: false 
          });

        if (error) throw error;

        toast({
          title: "Selection sent successfully!",
          description: "We've received your photo selection and will be in touch soon.",
        });

        onClose();
        setMessage('');
      }
    } catch (error) {
      console.error('Error processing selection:', error);
      toast({
        title: "Error processing selection",
        description: "Please try again or contact us directly.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-slate-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden"
      >
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-slate-700">
          <div>
            <h2 className="text-2xl font-bold text-white">Send Your Selection</h2>
            <p className="text-slate-300 mt-1">{selectedPhotos.size} photos selected</p>
            {freeLimit > 0 && (
              <p className="text-sm text-slate-400">
                {Math.min(selectedPhotos.size, freeLimit)} free • {extraPhotos} extra photos
              </p>
            )}
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-6 h-6" />
          </Button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {/* Payment Summary */}
          {extraPhotos > 0 && (
            <Card className="bg-blue-900/20 border-blue-400/30 p-4 mb-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <CreditCard className="w-5 h-5 text-blue-400" />
                  <div>
                    <h3 className="font-semibold text-white">Payment Required</h3>
                    <p className="text-sm text-slate-300">
                      {extraPhotos} extra photo{extraPhotos > 1 ? 's' : ''} × ${pricePerPhoto.toFixed(2)} each
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center text-xl font-bold text-white">
                    <DollarSign className="w-5 h-5" />
                    {totalCost.toFixed(2)}
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* Selected Photos Preview */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
              <Heart className="w-5 h-5 text-red-400 mr-2" />
              Selected Photos
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {selectedPhotosList.map((photo, index) => (
                <Card key={photo.id} className="overflow-hidden bg-slate-700 border-slate-600 relative">
                  <WatermarkedImage
                    src={photo.thumbnail || photo.url || ''}
                    alt={photo.title || photo.filename}
                    className="w-full aspect-square object-cover"
                  />
                  <div className="p-2">
                    <p className="text-xs text-slate-300 truncate">{photo.title || photo.filename}</p>
                  </div>
                  {index >= freeLimit && (
                    <div className="absolute top-2 right-2 bg-blue-600 text-white text-xs px-2 py-1 rounded">
                      ${pricePerPhoto.toFixed(2)}
                    </div>
                  )}
                </Card>
              ))}
            </div>
          </div>

          {/* Contact Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Your Name *
                </label>
                <Input
                  type="text"
                  value={clientInfo.name}
                  onChange={(e) => setClientInfo({ ...clientInfo, name: e.target.value })}
                  placeholder="Enter your name"
                  className="bg-slate-700 border-slate-600 text-white"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Email Address *
                </label>
                <Input
                  type="email"
                  value={clientInfo.email}
                  onChange={(e) => setClientInfo({ ...clientInfo, email: e.target.value })}
                  placeholder="Enter your email"
                  className="bg-slate-700 border-slate-600 text-white"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Message (Optional)
              </label>
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Any special requests or comments..."
                className="bg-slate-700 border-slate-600 text-white min-h-[100px]"
              />
            </div>

            <div className="flex justify-end gap-4 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="border-slate-600 text-slate-300 hover:bg-slate-700"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className={`${extraPhotos > 0 ? 'bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700' : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700'}`}
              >
                {extraPhotos > 0 ? <CreditCard className="w-4 h-4 mr-2" /> : <Mail className="w-4 h-4 mr-2" />}
                {isSubmitting ? 'Processing...' : extraPhotos > 0 ? `Pay $${totalCost.toFixed(2)}` : 'Send Selection'}
              </Button>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  );
};

export default SelectionModal;
