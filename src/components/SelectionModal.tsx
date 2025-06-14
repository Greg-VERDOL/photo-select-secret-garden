
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Mail, Heart } from 'lucide-react';
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
  const { toast } = useToast();

  const selectedPhotosList = photos.filter(photo => selectedPhotos.has(photo.id));

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
      // Save photo selections to database
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

      // Here you would typically send an email notification to the admin
      // For now, we'll just show a success message
      const emailData = {
        clientName: clientInfo.name,
        clientEmail: clientInfo.email,
        message: message,
        galleryId: galleryId,
        selectedPhotos: selectedPhotosList.map(photo => ({
          id: photo.id,
          title: photo.title || photo.filename,
          filename: photo.filename
        })),
        timestamp: new Date().toISOString()
      };

      console.log('Photo selection data saved:', emailData);

      toast({
        title: "Selection sent successfully!",
        description: "We've received your photo selection and will be in touch soon.",
      });

      onClose();
      // Reset form
      setMessage('');
      
    } catch (error) {
      console.error('Error saving selection:', error);
      toast({
        title: "Error sending selection",
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
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-6 h-6" />
          </Button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {/* Selected Photos Preview */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
              <Heart className="w-5 h-5 text-red-400 mr-2" />
              Selected Photos
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {selectedPhotosList.map((photo) => (
                <Card key={photo.id} className="overflow-hidden bg-slate-700 border-slate-600">
                  <WatermarkedImage
                    src={photo.thumbnail || photo.url || ''}
                    alt={photo.title || photo.filename}
                    className="w-full aspect-square object-cover"
                  />
                  <div className="p-2">
                    <p className="text-xs text-slate-300 truncate">{photo.title || photo.filename}</p>
                  </div>
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
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                <Mail className="w-4 h-4 mr-2" />
                {isSubmitting ? 'Sending...' : 'Send Selection'}
              </Button>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  );
};

export default SelectionModal;
