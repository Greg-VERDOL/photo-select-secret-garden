
import React, { useState } from 'react';
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
  const [isDownloading, setIsDownloading] = useState(false);
  const { toast } = useToast();

  const selectedPhotoObjects = photos.filter(photo => selectedPhotos.includes(photo.id));
  const extraPhotosCount = Math.max(0, selectedPhotos.length - freePhotoLimit);
  const totalCost = extraPhotosCount * 3; // €3 per extra photo

  const handleDownload = async () => {
    setIsDownloading(true);
    
    try {
      const JSZip = (await import('jszip')).default;
      const zip = new JSZip();
      
      for (const photo of selectedPhotoObjects) {
        try {
          const photoUrl = getPhotoUrl(photo.storage_path);
          const response = await fetch(photoUrl);
          const blob = await response.blob();
          const filename = photo.title || photo.filename;
          const extension = filename.includes('.') ? '' : '.jpg';
          zip.file(`${filename}${extension}`, blob);
        } catch (error) {
          console.error(`Failed to download ${photo.filename}:`, error);
        }
      }
      
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `selected-photos.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast({
        title: "Download Complete",
        description: `Downloaded ${selectedPhotos.length} photos`,
      });
    } catch (error) {
      toast({
        title: "Download Failed",
        description: "Failed to download selected photos",
        variant: "destructive"
      });
    } finally {
      setIsDownloading(false);
    }
  };

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
      <DialogContent className="max-w-4xl max-h-[90vh] bg-slate-800 border-slate-600 text-white overflow-hidden">
        <DialogHeader>
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

        <div className="space-y-6 overflow-y-auto">
          {/* Selected Photos Grid */}
          <SelectedPhotosGrid
            photos={photos}
            selectedPhotos={selectedPhotos}
            onPhotoToggle={onPhotoToggle}
            getPhotoUrl={getPhotoUrl}
          />

          {/* Pricing Information */}
          <PricingInfo
            freePhotoLimit={freePhotoLimit}
            pricePerPhoto={3}
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

          {/* Action Buttons */}
          <SelectionActions
            selectedPhotosCount={selectedPhotos.length}
            extraPhotosCount={extraPhotosCount}
            totalCost={totalCost}
            isDownloading={isDownloading}
            isSubmitting={isSubmitting}
            onDownload={handleDownload}
            onSubmit={handleSubmit}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SelectionModal;
