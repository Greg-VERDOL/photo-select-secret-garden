
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Upload, Trash2, Eye, Mail, Settings, LogOut, FolderPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import WatermarkedImage from './WatermarkedImage';

interface Gallery {
  id: string;
  name: string;
  photos: Photo[];
  createdAt: string;
  clientEmail?: string;
}

interface Photo {
  id: string;
  url: string;
  thumbnail: string;
  title: string;
  description?: string;
}

const AdminDashboard = () => {
  const [galleries, setGalleries] = useState<Gallery[]>([
    {
      id: 'gallery-1',
      name: 'Wedding - Smith Family',
      photos: [],
      createdAt: '2024-01-15',
      clientEmail: 'smith@example.com'
    }
  ]);
  const [selectedGallery, setSelectedGallery] = useState<Gallery | null>(null);
  const [newGalleryName, setNewGalleryName] = useState('');
  const { toast } = useToast();

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || !selectedGallery) return;

    const newPhotos: Photo[] = [];
    Array.from(files).forEach((file, index) => {
      const url = URL.createObjectURL(file);
      newPhotos.push({
        id: `photo-${Date.now()}-${index}`,
        url: url,
        thumbnail: url,
        title: file.name,
        description: `Uploaded ${new Date().toLocaleDateString()}`
      });
    });

    const updatedGalleries = galleries.map(gallery => 
      gallery.id === selectedGallery.id 
        ? { ...gallery, photos: [...gallery.photos, ...newPhotos] }
        : gallery
    );
    
    setGalleries(updatedGalleries);
    setSelectedGallery({ ...selectedGallery, photos: [...selectedGallery.photos, ...newPhotos] });
    
    toast({
      title: "Photos uploaded successfully",
      description: `Added ${newPhotos.length} photos to ${selectedGallery.name}`,
    });
  };

  const createNewGallery = () => {
    if (!newGalleryName.trim()) {
      toast({
        title: "Gallery name required",
        description: "Please enter a name for the new gallery.",
        variant: "destructive"
      });
      return;
    }

    const newGallery: Gallery = {
      id: `gallery-${Date.now()}`,
      name: newGalleryName,
      photos: [],
      createdAt: new Date().toISOString().split('T')[0]
    };

    setGalleries([...galleries, newGallery]);
    setNewGalleryName('');
    
    toast({
      title: "Gallery created",
      description: `Created new gallery: ${newGallery.name}`,
    });
  };

  const deletePhoto = (photoId: string) => {
    if (!selectedGallery) return;

    const updatedPhotos = selectedGallery.photos.filter(photo => photo.id !== photoId);
    const updatedGallery = { ...selectedGallery, photos: updatedPhotos };
    
    const updatedGalleries = galleries.map(gallery => 
      gallery.id === selectedGallery.id ? updatedGallery : gallery
    );
    
    setGalleries(updatedGalleries);
    setSelectedGallery(updatedGallery);
    
    toast({
      title: "Photo deleted",
      description: "Photo removed from gallery.",
    });
  };

  const copyGalleryLink = (galleryId: string) => {
    const link = `${window.location.origin}/gallery/${galleryId}`;
    navigator.clipboard.writeText(link);
    
    toast({
      title: "Link copied",
      description: "Gallery link copied to clipboard.",
    });
  };

  return (
    <div className="min-h-screen text-white">
      {/* Header */}
      <motion.header 
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="p-6 border-b border-white/10 backdrop-blur-sm bg-white/5"
      >
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              Admin Dashboard
            </h1>
            <p className="text-slate-300 mt-1">Manage your photo galleries</p>
          </div>
          
          <Button variant="outline" className="border-slate-600 text-slate-300 hover:bg-slate-700">
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>
      </motion.header>

      <div className="max-w-7xl mx-auto p-6">
        <Tabs defaultValue="galleries" className="space-y-6">
          <TabsList className="bg-slate-800 border-slate-700">
            <TabsTrigger value="galleries" className="data-[state=active]:bg-blue-600">
              Galleries
            </TabsTrigger>
            <TabsTrigger value="settings" className="data-[state=active]:bg-blue-600">
              Settings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="galleries" className="space-y-6">
            {/* Create New Gallery */}
            <Card className="p-6 bg-white/5 border-white/10">
              <h2 className="text-xl font-semibold mb-4">Create New Gallery</h2>
              <div className="flex gap-4">
                <Input
                  value={newGalleryName}
                  onChange={(e) => setNewGalleryName(e.target.value)}
                  placeholder="Enter gallery name (e.g., Wedding - Johnson Family)"
                  className="bg-slate-700 border-slate-600 text-white"
                />
                <Button onClick={createNewGallery} className="bg-blue-600 hover:bg-blue-700">
                  <FolderPlus className="w-4 h-4 mr-2" />
                  Create
                </Button>
              </div>
            </Card>

            {/* Galleries List */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Gallery List */}
              <div className="lg:col-span-1">
                <Card className="p-6 bg-white/5 border-white/10">
                  <h2 className="text-xl font-semibold mb-4">Your Galleries</h2>
                  <div className="space-y-3">
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
                          {gallery.photos.length} photos • Created {gallery.createdAt}
                        </p>
                        <div className="flex gap-2 mt-3">
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-slate-600 text-slate-300 hover:bg-slate-700"
                            onClick={(e) => {
                              e.stopPropagation();
                              copyGalleryLink(gallery.id);
                            }}
                          >
                            <Eye className="w-3 h-3 mr-1" />
                            Share
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
                        <p className="text-slate-400">{selectedGallery.photos.length} photos</p>
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
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {selectedGallery.photos.map((photo) => (
                        <motion.div
                          key={photo.id}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="group relative"
                        >
                          <Card className="overflow-hidden bg-slate-700 border-slate-600">
                            <WatermarkedImage
                              src={photo.thumbnail}
                              alt={photo.title}
                              className="w-full aspect-square object-cover"
                            />
                            <div className="p-2">
                              <p className="text-xs text-slate-300 truncate">{photo.title}</p>
                            </div>
                            
                            {/* Delete button */}
                            <Button
                              size="sm"
                              variant="destructive"
                              className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={() => deletePhoto(photo.id)}
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </Card>
                        </motion.div>
                      ))}
                    </div>

                    {selectedGallery.photos.length === 0 && (
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
          </TabsContent>

          <TabsContent value="settings">
            <Card className="p-6 bg-white/5 border-white/10">
              <h2 className="text-xl font-semibold mb-4">Settings</h2>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Watermark Text
                  </label>
                  <Input
                    defaultValue="© PHOTO STUDIO"
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Admin Email
                  </label>
                  <Input
                    type="email"
                    defaultValue="admin@photostudio.com"
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>
                
                <Button className="bg-blue-600 hover:bg-blue-700">
                  <Settings className="w-4 h-4 mr-2" />
                  Save Settings
                </Button>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminDashboard;
