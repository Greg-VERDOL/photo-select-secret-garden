
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Mail, X, ChevronLeft, ChevronRight, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import WatermarkedImage from './WatermarkedImage';
import SelectionModal from './SelectionModal';

interface Photo {
  id: string;
  gallery_id: string;
  filename: string;
  title?: string;
  description?: string;
  storage_path: string;
  thumbnail_path?: string;
}

interface Gallery {
  id: string;
  name: string;
  client_name?: string;
  client_email?: string;
  access_code: string;
  free_photo_limit?: number;
}

const ClientGallery = () => {
  const { accessCode } = useParams<{ accessCode: string }>();
  const navigate = useNavigate();
  const [gallery, setGallery] = useState<Gallery | null>(null);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [selectedPhotos, setSelectedPhotos] = useState<Set<string>>(new Set());
  const [lightboxPhoto, setLightboxPhoto] = useState<Photo | null>(null);
  const [showSelectionModal, setShowSelectionModal] = useState(false);
  const [clientInfo, setClientInfo] = useState({ name: '', email: '' });
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (accessCode) {
      fetchGalleryData();
    }
  }, [accessCode]);

  // Save selections to localStorage whenever they change
  useEffect(() => {
    if (gallery && selectedPhotos.size > 0) {
      const selectionData = {
        galleryId: gallery.id,
        accessCode: gallery.access_code,
        selectedPhotos: Array.from(selectedPhotos),
        timestamp: Date.now()
      };
      localStorage.setItem(`gallery_selections_${gallery.access_code}`, JSON.stringify(selectionData));
    }
  }, [selectedPhotos, gallery]);

  // Load saved selections when gallery is loaded
  useEffect(() => {
    if (gallery) {
      loadSavedSelections();
    }
  }, [gallery]);

  const loadSavedSelections = () => {
    if (!gallery) return;
    
    try {
      const savedData = localStorage.getItem(`gallery_selections_${gallery.access_code}`);
      if (savedData) {
        const selectionData = JSON.parse(savedData);
        
        // Check if the saved data is for the same gallery and not too old (24 hours)
        const isValidData = selectionData.galleryId === gallery.id && 
                           selectionData.accessCode === gallery.access_code &&
                           (Date.now() - selectionData.timestamp) < 24 * 60 * 60 * 1000;
        
        if (isValidData && selectionData.selectedPhotos) {
          const savedSelections = new Set(selectionData.selectedPhotos);
          setSelectedPhotos(savedSelections);
          
          if (savedSelections.size > 0) {
            toast({
              title: "Selections restored",
              description: `Found ${savedSelections.size} previously selected photos`,
            });
          }
        }
      }
    } catch (error) {
      console.error('Error loading saved selections:', error);
    }
  };

  const fetchGalleryData = async () => {
    try {
      // Fetch gallery info
      const { data: galleryData, error: galleryError } = await supabase
        .from('galleries')
        .select('*')
        .eq('access_code', accessCode)
        .single();

      if (galleryError || !galleryData) {
        toast({
          title: "Gallery not found",
          description: "Invalid access code or gallery doesn't exist.",
          variant: "destructive"
        });
        navigate('/');
        return;
      }

      setGallery(galleryData);

      // Fetch photos
      const { data: photosData, error: photosError } = await supabase
        .from('photos')
        .select('*')
        .eq('gallery_id', galleryData.id)
        .order('created_at', { ascending: false });

      if (photosError) throw photosError;

      // Transform photos with public URLs
      const photosWithUrls = photosData.map(photo => ({
        ...photo,
        url: getPhotoUrl(photo.storage_path),
        thumbnail: getPhotoUrl(photo.thumbnail_path || photo.storage_path)
      }));

      setPhotos(photosWithUrls as any);

      // Pre-fill client info if available
      if (galleryData.client_name || galleryData.client_email) {
        setClientInfo({
          name: galleryData.client_name || '',
          email: galleryData.client_email || ''
        });
      }
    } catch (error) {
      toast({
        title: "Error loading gallery",
        description: "Failed to load gallery data.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getPhotoUrl = (storagePath: string) => {
    const { data } = supabase.storage
      .from('gallery-photos')
      .getPublicUrl(storagePath);
    return data.publicUrl;
  };

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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 flex items-center justify-center text-white">
        <div className="text-xl">Loading gallery...</div>
      </div>
    );
  }

  if (!gallery) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 flex items-center justify-center text-white">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Gallery Not Found</h1>
          <Button onClick={() => navigate('/')} className="bg-blue-600 hover:bg-blue-700">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Access Form
          </Button>
        </div>
      </div>
    );
  }

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
              {gallery.name}
            </h1>
            <p className="text-slate-300 mt-1">
              {gallery.client_name ? `Welcome ${gallery.client_name}! ` : ''}
              Select your favorite photos
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            <Button 
              variant="outline" 
              onClick={() => navigate('/')}
              className="border-slate-600 text-slate-300 hover:bg-slate-700"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Exit
            </Button>
            
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
        {photos.length > 0 ? (
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
                      src={(photo as any).thumbnail}
                      alt={photo.title || photo.filename}
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
                    <h3 className="font-semibold text-white">{photo.title || photo.filename}</h3>
                    {photo.description && (
                      <p className="text-sm text-slate-300 mt-1">{photo.description}</p>
                    )}
                  </div>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <div className="text-center py-20">
            <h2 className="text-2xl font-bold text-white mb-4">No Photos Yet</h2>
            <p className="text-slate-300">This gallery is empty. Please check back later.</p>
          </div>
        )}
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
                src={(lightboxPhoto as any).url}
                alt={lightboxPhoto.title || lightboxPhoto.filename}
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
        selectedPhotos={Array.from(selectedPhotos)}
        photos={photos}
        onPhotoToggle={togglePhotoSelection}
        galleryId={gallery.id}
        clientEmail={clientInfo.email || gallery.client_email || ''}
        freePhotoLimit={gallery.free_photo_limit || 5}
        getPhotoUrl={getPhotoUrl}
      />
    </div>
  );
};

export default ClientGallery;
