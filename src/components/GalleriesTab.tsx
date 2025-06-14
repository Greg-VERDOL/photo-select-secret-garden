
import React, { useState, useEffect } from 'react';
import { FolderPlus, Plus } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import CreateGalleryForm from './CreateGalleryForm';
import GalleryList from './GalleryList';
import GalleryDetails from './GalleryDetails';
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
  const [showCreateForm, setShowCreateForm] = useState(false);
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

  const handleGalleryCreated = () => {
    fetchGalleries();
  };

  const handleGalleryDeleted = () => {
    if (selectedGallery) {
      setSelectedGallery(null);
      setPhotos([]);
    }
    fetchGalleries();
  };

  const handleSelectGallery = (gallery: Gallery) => {
    setSelectedGallery(gallery);
  };

  const handlePhotoUploaded = () => {
    if (selectedGallery) {
      fetchPhotos(selectedGallery.id);
    }
    fetchGalleries();
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

      handlePhotoUploaded();
    } catch (error) {
      toast({
        title: "Delete failed",
        description: "Failed to delete photo",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Section */}
      <div className="bg-white border-b border-gray-200">
        <div className="px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-semibold text-gray-900">Galleries</h1>
              <p className="text-gray-600 mt-1">Manage your photo collections</p>
            </div>
            <Button
              onClick={() => setShowCreateForm(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg font-medium transition-all duration-200 shadow-sm hover:shadow-md"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Gallery
            </Button>
          </div>
        </div>
      </div>

      {/* Create Gallery Modal/Form */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Create New Gallery</h2>
              <CreateGalleryForm
                onGalleryCreated={() => {
                  handleGalleryCreated();
                  setShowCreateForm(false);
                }}
                onCancel={() => setShowCreateForm(false)}
              />
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Gallery List */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-6 border-b border-gray-100">
                <h2 className="text-lg font-semibold text-gray-900">
                  Your Galleries
                  <span className="ml-2 text-sm font-normal text-gray-500">({galleries.length})</span>
                </h2>
              </div>
              <div className="max-h-96 overflow-y-auto">
                {galleries.length === 0 ? (
                  <div className="p-8 text-center">
                    <FolderPlus className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                    <p className="text-gray-500">No galleries yet</p>
                    <p className="text-sm text-gray-400 mt-1">Create your first gallery to get started</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {galleries.map((gallery) => (
                      <div
                        key={gallery.id}
                        className={`p-4 cursor-pointer transition-all duration-200 ${
                          selectedGallery?.id === gallery.id
                            ? 'bg-blue-50 border-r-2 border-blue-600'
                            : 'hover:bg-gray-50'
                        }`}
                        onClick={() => setSelectedGallery(gallery)}
                      >
                        <h3 className="font-medium text-gray-900 mb-1">{gallery.name}</h3>
                        <p className="text-sm text-gray-500">
                          {gallery.photo_count || 0} photos • {new Date(gallery.created_at).toLocaleDateString()}
                        </p>
                        {gallery.client_name && (
                          <p className="text-sm text-blue-600 mt-1">{gallery.client_name}</p>
                        )}
                        <div className="flex items-center gap-2 mt-2">
                          <code className="text-xs bg-gray-100 px-2 py-1 rounded font-mono">
                            {gallery.access_code}
                          </code>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 px-2 text-xs"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigator.clipboard.writeText(gallery.access_code);
                              toast({
                                title: "Copied!",
                                description: "Access code copied to clipboard",
                              });
                            }}
                          >
                            Copy
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Gallery Management */}
          <div className="lg:col-span-2">
            {selectedGallery ? (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200">
                <GalleryDetails
                  gallery={selectedGallery}
                  photos={photos}
                  onPhotoUploaded={handlePhotoUploaded}
                  onPhotoClick={openPhotoPreview}
                  getPhotoUrl={getPhotoUrl}
                  onGalleryDeleted={handleGalleryDeleted}
                />
              </div>
            ) : (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-12 text-center">
                <FolderPlus className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Select a Gallery</h3>
                <p className="text-gray-500">Choose a gallery from the list to manage photos</p>
              </div>
            )}
          </div>
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
