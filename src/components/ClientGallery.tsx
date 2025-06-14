
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Mail, X, ChevronLeft, ChevronRight, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import WatermarkedImage from './WatermarkedImage';
import SelectionModal from './SelectionModal';

interface Photo {
  id: string;
  url: string;
  thumbnail: string;
  title: string;
  description?: string;
}

const ClientGallery = () => {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [selectedPhotos, setSelectedPhotos] = useState<Set<string>>(new Set());
  const [lightboxPhoto, setLightboxPhoto] = useState<Photo | null>(null);
  const [showSelectionModal, setShowSelectionModal] = useState(false);
  const [clientInfo, setClientInfo] = useState({ name: '', email: '' });
  const { toast } = useToast();

  // Mock data - in real app, this would come from your backend
  useEffect(() => {
    const mockPhotos: Photo[] = Array.from({ length: 24 }, (_, i) => ({
      id: `photo-${i + 1}`,
      url: `https://images.unsplash.com/photo-${[
        '1649972904349-6e44c42644a7',
        '1488590528505-98d2b5aba04b',
        '1518770660439-4636190af475',
        '1461749280684-dccba630e2f6',
        '1486312338219-ce68d2c6f44d',
        '1581091226825-a6a2a5aee158'
      ][i % 6]}?w=1200&h=800&fit=crop`,
      thumbnail: `https://images.unsplash.com/photo-${[
        '1649972904349-6e44c42644a7',
        '1488590528505-98d2b5aba04b',
        '1518770660439-4636190af475',
        '1461749280684-dccba630e2f6',
        '1486312338219-ce68d2c6f44d',
        '1581091226825-a6a2a5aee158'
      ][i % 6]}?w=400&h=300&fit=crop`,
      title: `Photo ${i + 1}`,
      description: `Beautiful shot number ${i + 1}`
    }));
    setPhotos(mockPhotos);
  }, []);

  const togglePhotoSelection = (photoId: string) => {
    const newSelected = new Set(selectedPhotos);
    if (newSelected.has(photoId)) {
      newSelected.delete(photoId);
    } else {
      newSelected.add(photoId);
    }
    setSelectedPhotos(newSelected);
    
    toast({
      title: newSelected.has(photoId) ? "Photo added to selection" : "Photo removed from selection",
      duration: 2000,
    });
  };

  const handleSendSelection = () => {
    if (selectedPhotos.size === 0) {
      toast({
        title: "No photos selected",
        description: "Please select at least one photo before sending.",
        variant: "destructive"
      });
      return;
    }
    setShowSelectionModal(true);
  };

  const currentPhotoIndex = lightboxPhoto ? photos.findIndex(p => p.id === lightboxPhoto.id) : -1;

  const navigateLightbox = (direction: 'prev' | 'next') => {
    if (currentPhotoIndex === -1) return;
    
    const newIndex = direction === 'prev' 
      ? (currentPhotoIndex - 1 + photos.length) % photos.length
      : (currentPhotoIndex + 1) % photos.length;
    
    setLightboxPhoto(photos[newIndex]);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 text-white">
      {/* Header */}
      <motion.header 
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="p-6 border-b border-white/10 backdrop-blur-sm bg-white/5"
      >
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              Your Photo Gallery
            </h1>
            <p className="text-slate-300 mt-1">Select your favorite photos</p>
          </div>
          
          <div className="flex items-center gap-4">
            {selectedPhotos.size > 0 && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="flex items-center gap-2 bg-blue-600/20 px-4 py-2 rounded-full border border-blue-400/30"
              >
                <Heart className="w-4 h-4 text-red-400" />
                <span>{selectedPhotos.size} selected</span>
              </motion.div>
            )}
            
            <Button 
              onClick={handleSendSelection}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transition-all duration-300"
              disabled={selectedPhotos.size === 0}
            >
              <Mail className="w-4 h-4 mr-2" />
              Send Selection
            </Button>
          </div>
        </div>
      </motion.header>

      {/* Gallery Grid */}
      <div className="max-w-7xl mx-auto p-6">
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          {photos.map((photo, index) => (
            <motion.div
              key={photo.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="group"
            >
              <Card className="overflow-hidden bg-white/5 border-white/10 hover:border-blue-400/30 transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/10">
                <div className="relative aspect-[4/3] overflow-hidden">
                  <WatermarkedImage
                    src={photo.thumbnail}
                    alt={photo.title}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105 cursor-pointer"
                    onClick={() => setLightboxPhoto(photo)}
                  />
                  
                  {/* Selection overlay */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        togglePhotoSelection(photo.id);
                      }}
                      className={`absolute top-3 right-3 p-2 rounded-full transition-all duration-300 ${
                        selectedPhotos.has(photo.id)
                          ? 'bg-red-500 text-white'
                          : 'bg-white/80 text-slate-700 hover:bg-white'
                      }`}
                    >
                      <Heart className={`w-5 h-5 ${selectedPhotos.has(photo.id) ? 'fill-current' : ''}`} />
                    </button>
                  </div>
                </div>
                
                <div className="p-4">
                  <h3 className="font-semibold text-white">{photo.title}</h3>
                  {photo.description && (
                    <p className="text-sm text-slate-300 mt-1">{photo.description}</p>
                  )}
                </div>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {lightboxPhoto && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4"
            onClick={() => setLightboxPhoto(null)}
          >
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.8 }}
              className="relative max-w-4xl max-h-full"
              onClick={(e) => e.stopPropagation()}
            >
              <WatermarkedImage
                src={lightboxPhoto.url}
                alt={lightboxPhoto.title}
                className="max-w-full max-h-[80vh] object-contain rounded-lg"
              />
              
              {/* Controls */}
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-4 right-4 bg-black/50 hover:bg-black/70 text-white"
                onClick={() => setLightboxPhoto(null)}
              >
                <X className="w-6 h-6" />
              </Button>
              
              <Button
                variant="ghost"
                size="icon"
                className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white"
                onClick={() => navigateLightbox('prev')}
              >
                <ChevronLeft className="w-6 h-6" />
              </Button>
              
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white"
                onClick={() => navigateLightbox('next')}
              >
                <ChevronRight className="w-6 h-6" />
              </Button>

              {/* Selection button */}
              <Button
                onClick={() => togglePhotoSelection(lightboxPhoto.id)}
                className={`absolute bottom-4 right-4 ${
                  selectedPhotos.has(lightboxPhoto.id)
                    ? 'bg-red-500 hover:bg-red-600'
                    : 'bg-white/20 hover:bg-white/30'
                }`}
              >
                <Heart className={`w-4 h-4 mr-2 ${selectedPhotos.has(lightboxPhoto.id) ? 'fill-current' : ''}`} />
                {selectedPhotos.has(lightboxPhoto.id) ? 'Selected' : 'Select'}
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Selection Modal */}
      <SelectionModal
        isOpen={showSelectionModal}
        onClose={() => setShowSelectionModal(false)}
        selectedPhotos={selectedPhotos}
        photos={photos}
        clientInfo={clientInfo}
        setClientInfo={setClientInfo}
      />
    </div>
  );
};

export default ClientGallery;
