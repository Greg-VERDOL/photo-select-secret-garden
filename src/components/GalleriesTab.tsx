
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Upload, Trash2, Eye, FolderPlus, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import WatermarkedImage from './WatermarkedImage';
import PhotoPreviewModal from './PhotoPreviewModal';

interface Gallery {
  id: string;
  name: string;
  client_name?: string;
  client_email?: string;
  access_code: string;
  created_at: string;
  photo_count?: number;
}

interface Photo {
  id: string;
  gallery_id: string;
  filename: string;
  title?: string;
  description?: string;
  storage_path: string;
  thumbnail_path?: string;
  created_at: string;
}

const GalleriesTab: React.FC = () => {
  const [galleries, setGalleries] = useState<Gallery[]>([]);
  const [selectedGallery, setSelectedGallery] = useState<Gallery | null>(null);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [newGalleryData, setNewGalleryData] = useState({
    name: '',
    clientName: '',
    clientEmail: ''
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchGalleries();
  }, []);

  useEffect(() => {
    if (selectedGallery) {
      fetchPhotos(selectedGallery.id);
    }
  }, [selectedGallery]);

  const fetchGalleries = async () => {
    try {
      const { data, error } = await supabase
        .from('galleries')
        .select(`
          *,
          photos(count)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const galleriesWithCount = data.map(gallery => ({
        ...gallery,
        photo_count: gallery.photos?.[0]?.count || 0
      }));

      setGalleries(galleriesWithCount);
    } catch (error) {
      toast({
        title: "Error fetching galleries",
        description: "Failed to load galleries",
        variant: "destructive"
      });
    }
  };

  const fetchPhotos = async (galleryId: string) => {
    try {
      const { data, error } = await supabase
        .from('photos')
        .select('*')
        .eq('gallery_id', galleryId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPhotos(data || []);
    } catch (error) {
      toast({
        title: "Error fetching photos",
        description: "Failed to load photos",
        variant: "destructive"
      });
    }
  };

  const createNewGallery = async () => {
    if (!newGalleryData.name.trim()) {
      toast({
        title: "Gallery name required",
        description: "Please enter a name for the new gallery.",
        variant: "destructive"
      });
      return;
    }

    try {
      const { data: codeData, error: codeError } = await supabase
        .rpc('generate_access_code');

      if (codeError) throw codeError;

      const { data, error } = await supabase
        .from('galleries')
        .insert({
          name: newGalleryData.name,
          client_name: newGalleryData.clientName || null,
          client_email: newGalleryData.clientEmail || null,
          access_code: codeData
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Gallery created",
        description: `Created new gallery with access code: ${data.access_code}`,
      });

      setNewGalleryData({ name: '', clientName: '', clientEmail: '' });
      fetchGalleries();
    } catch (error) {
      toast({
        title: "Error creating gallery",
        description: "Failed to create new gallery",
        variant: "destructive"
      });
    }
  };

  const deleteGallery = async (galleryId: string, galleryName: string) => {
    if (!window.confirm(`Are you sure you want to delete the gallery "${galleryName}" and all its photos? This action cannot be undone.`)) {
      return;
    }

    try {
      // First, get all photos in the gallery to delete from storage
      const { data: photosData, error: photosError } = await supabase
        .from('photos')
        .select('storage_path')
        .eq('gallery_id', galleryId);

      if (photosError) throw photosError;

      // Delete photos from storage
      if (photosData && photosData.length > 0) {
        const filePaths = photosData.map(photo => photo.storage_path);
        const { error: storageError } = await supabase.storage
          .from('gallery-photos')
          .remove(filePaths);

        if (storageError) throw storageError;
      }

      // Delete the gallery (this will cascade delete photos and selections due to foreign key constraints)
      const { error: galleryError } = await supabase
        .from('galleries')
        .delete()
        .eq('id', galleryId);

      if (galleryError) throw galleryError;

      toast({
        title: "Gallery deleted",
        description: `Gallery "${galleryName}" and all its photos have been deleted.`,
      });

      if (selectedGallery?.id === galleryId) {
        setSelectedGallery(null);
        setPhotos([]);
      }

      fetchGalleries();
    } catch (error) {
      toast({
        title: "Delete failed",
        description: "Failed to delete gallery",
        variant: "destructive"
      });
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || !selectedGallery) return;

    const uploadPromises = Array.from(files).map(async (file) => {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${selectedGallery.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('gallery-photos')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { error: dbError } = await supabase
        .from('photos')
        .insert({
          gallery_id: selectedGallery.id,
          filename: file.name,
          title: file.name.split('.')[0],
          storage_path: filePath,
          thumbnail_path: filePath
        });

      if (dbError) throw dbError;
    });

    try {
      await Promise.all(uploadPromises);
      toast({
        title: "Photos uploaded successfully",
        description: `Added ${files.length} photos to ${selectedGallery.name}`,
      });
      fetchPhotos(selectedGallery.id);
      fetchGalleries();
    } catch (error) {
      toast({
        title: "Upload failed",
        description: "Some photos failed to upload",
        variant: "destructive"
      });
    }
  };

  const deletePhoto = async (photoId: string, storagePath: string) => {
    try {
      const { error: storageError } = await supabase.storage
        .from('gallery-photos')
        .remove([storagePath]);

      if (storageError) throw storageError;

      const { error: dbError } = await supabase
        .from('photos')
        .delete()
        .eq('id', photoId);

      if (dbError) throw dbError;

      toast({
        title: "Photo deleted",
        description: "Photo removed from gallery.",
      });

      fetchPhotos(selectedGallery!.id);
      fetchGalleries();
    } catch (error) {
      toast({
        title: "Delete failed",
        description: "Failed to delete photo",
        variant: "destructive"
      });
    }
  };

  const copyAccessCode = (accessCode: string) => {
    navigator.clipboard.writeText(accessCode);
    toast({
      title: "Access code copied",
      description: "Access code copied to clipboard.",
    });
  };

  const getPhotoUrl = (storagePath: string) => {
    const { data } = supabase.storage
      .from('gallery-photos')
      .getPublicUrl(storagePath);
    return data.publicUrl;
  };

  const openPhotoPreview = (photo: Photo) => {
    setSelectedPhoto(photo);
    setIsPreviewOpen(true);
  };

  const closePhotoPreview = () => {
    setSelectedPhoto(null);
    setIsPreviewOpen(false);
  };

  const navigatePhoto = (direction: 'prev' | 'next') => {
    if (!selectedPhoto) return;
    
    const currentIndex = photos.findIndex(p => p.id === selectedPhoto.id);
    let newIndex;
    
    if (direction === 'prev') {
      newIndex = currentIndex > 0 ? currentIndex - 1 : photos.length - 1;
    } else {
      newIndex = currentIndex < photos.length - 1 ? currentIndex + 1 : 0;
    }
    
    setSelectedPhoto(photos[newIndex]);
  };

  return (
    <div className="space-y-6">
      {/* Create New Gallery */}
      <Card className="p-6 bg-white/5 border-white/10">
        <h2 className="text-xl font-semibold mb-4">Create New Gallery</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input
            value={newGalleryData.name}
            onChange={(e) => setNewGalleryData({ ...newGalleryData, name: e.target.value })}
            placeholder="Gallery name (e.g., Wedding - Johnson Family)"
            className="bg-slate-700 border-slate-600 text-white"
          />
          <Input
            value={newGalleryData.clientName}
            onChange={(e) => setNewGalleryData({ ...newGalleryData, clientName: e.target.value })}
            placeholder="Client name (optional)"
            className="bg-slate-700 border-slate-600 text-white"
          />
          <Input
            value={newGalleryData.clientEmail}
            onChange={(e) => setNewGalleryData({ ...newGalleryData, clientEmail: e.target.value })}
            placeholder="Client email (optional)"
            className="bg-slate-700 border-slate-600 text-white"
          />
        </div>
        <Button onClick={createNewGallery} className="mt-4 bg-blue-600 hover:bg-blue-700">
          <FolderPlus className="w-4 h-4 mr-2" />
          Create Gallery
        </Button>
      </Card>

      {/* Galleries Management */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Gallery List */}
        <div className="lg:col-span-1">
          <Card className="p-6 bg-white/5 border-white/10">
            <h2 className="text-xl font-semibold mb-4">Your Galleries ({galleries.length})</h2>
            <div className="space-y-3 max-h-96 overflow-y-auto scrollbar-hide">
              {galleries.map((gallery) => (
                <motion.div
                  key={gallery.id}
                  whileHover={{ scale: 1.02 }}
                  className={`p-4 rounded-lg border cursor-pointer transition-all ${
                    selectedGallery?.id === gallery.id
                      ? 'bg-blue-600/20 border-blue-400/50'
                      : 'bg-slate-700/50 border-slate-600 hover:border-slate-500'
                  }`}
                  onClick={() => setSelectedGallery(gallery)}
                >
                  <h3 className="font-medium">{gallery.name}</h3>
                  <p className="text-sm text-slate-400">
                    {gallery.photo_count} photos • {new Date(gallery.created_at).toLocaleDateString()}
                  </p>
                  {gallery.client_name && (
                    <p className="text-sm text-blue-300">{gallery.client_name}</p>
                  )}
                  <div className="flex gap-2 mt-3">
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-slate-600 text-slate-300 hover:bg-slate-700"
                      onClick={(e) => {
                        e.stopPropagation();
                        copyAccessCode(gallery.access_code);
                      }}
                    >
                      <Copy className="w-3 h-3 mr-1" />
                      {gallery.access_code}
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteGallery(gallery.id, gallery.name);
                      }}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </motion.div>
              ))}
            </div>
          </Card>
        </div>

        {/* Gallery Management */}
        <div className="lg:col-span-2">
          {selectedGallery ? (
            <Card className="p-6 bg-white/5 border-white/10">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-xl font-semibold">{selectedGallery.name}</h2>
                  <p className="text-slate-400">{photos.length} photos</p>
                  <p className="text-sm text-blue-300">Access Code: {selectedGallery.access_code}</p>
                </div>
                
                <div className="flex gap-3">
                  <input
                    type="file"
                    id="photo-upload"
                    multiple
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <Button
                    asChild
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <label htmlFor="photo-upload" className="cursor-pointer">
                      <Upload className="w-4 h-4 mr-2" />
                      Upload Photos
                    </label>
                  </Button>
                </div>
              </div>

              {/* Photos Grid */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 max-h-96 overflow-y-auto scrollbar-hide">
                {photos.map((photo) => (
                  <motion.div
                    key={photo.id}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="group relative"
                  >
                    <Card className="overflow-hidden bg-slate-700 border-slate-600 cursor-pointer hover:scale-105 transition-transform">
                      <div onClick={() => openPhotoPreview(photo)}>
                        <WatermarkedImage
                          src={getPhotoUrl(photo.storage_path)}
                          alt={photo.title || photo.filename}
                          className="w-full aspect-square object-cover hover:opacity-80 transition-opacity"
                        />
                        <div className="p-2">
                          <p className="text-xs text-slate-300 truncate">{photo.title || photo.filename}</p>
                        </div>
                      </div>
                      
                      <Button
                        size="sm"
                        variant="outline"
                        className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity border-slate-600 text-slate-300 hover:bg-slate-700"
                        onClick={() => openPhotoPreview(photo)}
                      >
                        <Eye className="w-3 h-3" />
                      </Button>
                      
                      <Button
                        size="sm"
                        variant="destructive"
                        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => {
                          e.stopPropagation();
                          deletePhoto(photo.id, photo.storage_path);
                        }}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </Card>
                  </motion.div>
                ))}
              </div>

              {photos.length === 0 && (
                <div className="text-center py-12 text-slate-400">
                  <Upload className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No photos uploaded yet. Click "Upload Photos" to get started.</p>
                </div>
              )}
            </Card>
          ) : (
            <Card className="p-12 bg-white/5 border-white/10 text-center">
              <FolderPlus className="w-16 h-16 mx-auto mb-4 text-slate-400" />
              <h3 className="text-xl font-semibold mb-2">Select a Gallery</h3>
              <p className="text-slate-400">Choose a gallery from the list to manage photos</p>
            </Card>
          )}
        </div>
      </div>

      {/* Photo Preview Modal */}
      <PhotoPreviewModal
        photo={selectedPhoto}
        isOpen={isPreviewOpen}
        onClose={closePhotoPreview}
        onDelete={deletePhoto}
        getPhotoUrl={getPhotoUrl}
        photos={photos}
        onNavigate={navigatePhoto}
      />
    </div>
  );
};

export default GalleriesTab;
