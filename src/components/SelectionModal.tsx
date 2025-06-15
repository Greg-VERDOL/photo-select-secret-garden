
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { X, Send, Download, CreditCard } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import SelectedPhotosGrid from './SelectedPhotosGrid';
import PricingInfo from './PricingInfo';

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
            selectedPhotos={selectedPhotoObjects}
            onPhotoToggle={onPhotoToggle}
            getPhotoUrl={getPhotoUrl}
          />

          {/* Pricing Information */}
          <PricingInfo
            selectedCount={selectedPhotos.length}
            freePhotoLimit={freePhotoLimit}
            extraPhotosCount={extraPhotosCount}
            totalCost={totalCost}
          />

          {/* Client Information Form */}
          <div className="space-y-4 bg-slate-700/30 p-4 rounded-lg">
            <h3 className="text-lg font-semibold">Your Information</h3>
            
            <div className="grid grid-cols-1 gap-4">
              <div>
                <Label htmlFor="email" className="text-slate-300">Email Address *</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your.email@example.com"
                  className="bg-slate-700 border-slate-600 text-white"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="message" className="text-slate-300">Message (optional)</Label>
                <Textarea
                  id="message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Any special requests or notes..."
                  className="bg-slate-700 border-slate-600 text-white"
                  rows={3}
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-slate-600">
            <Button
              onClick={handleDownload}
              disabled={isDownloading || selectedPhotos.length === 0}
              variant="outline"
              className="border-slate-600 text-slate-300 hover:bg-slate-700"
            >
              <Download className="w-4 h-4 mr-2" />
              {isDownloading ? 'Downloading...' : 'Download Photos'}
            </Button>
            
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting || selectedPhotos.length === 0}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              {extraPhotosCount > 0 ? (
                <>
                  <CreditCard className="w-4 h-4 mr-2" />
                  {isSubmitting ? 'Processing...' : `Pay €${totalCost} & Send Selection`}
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  {isSubmitting ? 'Sending...' : 'Send Selection'}
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SelectionModal;
