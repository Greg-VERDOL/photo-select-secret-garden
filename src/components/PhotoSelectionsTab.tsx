
import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Heart, Download, Eye, User, Calendar, Image as ImageIcon } from 'lucide-react';
import PhotoSelectionModal from './PhotoSelectionModal';

interface PhotoSelection {
  id: string;
  selected_at: string;
  client_email: string;
  photo: {
    id: string;
    filename: string;
    title: string;
    storage_path: string;
  };
  gallery: {
    id: string;
    name: string;
    client_name: string;
  };
}

interface ClientSelections {
  clientName: string;
  clientEmail: string;
  galleryName: string;
  selections: PhotoSelection[];
}

const PhotoSelectionsTab: React.FC = () => {
  const [selections, setSelections] = useState<PhotoSelection[]>([]);
  const [groupedSelections, setGroupedSelections] = useState<ClientSelections[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPhoto, setSelectedPhoto] = useState<PhotoSelection | null>(null);
  const [downloadingClient, setDownloadingClient] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchSelections();
  }, []);

  useEffect(() => {
    if (selections.length > 0) {
      groupSelectionsByClient();
    }
  }, [selections]);

  const fetchSelections = async () => {
    try {
      const { data, error } = await supabase
        .from('photo_selections')
        .select(`
          id,
          selected_at,
          client_email,
          photo:photos(id, filename, title, storage_path),
          gallery:galleries(id, name, client_name)
        `)
        .order('selected_at', { ascending: false });

      if (error) throw error;
      setSelections(data || []);
    } catch (error) {
      toast({
        title: "Error fetching selections",
        description: "Failed to load photo selections",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const groupSelectionsByClient = () => {
    const grouped = selections.reduce((acc, selection) => {
      const key = `${selection.gallery.client_name}-${selection.client_email}`;
      
      if (!acc[key]) {
        acc[key] = {
          clientName: selection.gallery.client_name,
          clientEmail: selection.client_email,
          galleryName: selection.gallery.name,
          selections: []
        };
      }
      
      acc[key].selections.push(selection);
      return acc;
    }, {} as Record<string, ClientSelections>);

    setGroupedSelections(Object.values(grouped));
  };

  const getPhotoUrl = (storagePath: string) => {
    const { data } = supabase.storage
      .from('gallery-photos')
      .getPublicUrl(storagePath);
    return data.publicUrl;
  };

  const downloadClientSelections = async (clientSelections: ClientSelections) => {
    setDownloadingClient(clientSelections.clientName);
    
    try {
      const JSZip = (await import('jszip')).default;
      const zip = new JSZip();
      
      for (const selection of clientSelections.selections) {
        try {
          const photoUrl = getPhotoUrl(selection.photo.storage_path);
          const response = await fetch(photoUrl);
          const blob = await response.blob();
          const filename = selection.photo.title || selection.photo.filename;
          zip.file(`${filename}.jpg`, blob);
        } catch (error) {
          console.error(`Failed to download ${selection.photo.filename}:`, error);
        }
      }
      
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${clientSelections.clientName}-selections.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast({
        title: "Download Complete",
        description: `Downloaded ${clientSelections.selections.length} photos for ${clientSelections.clientName}`,
      });
    } catch (error) {
      toast({
        title: "Download Failed",
        description: "Failed to download selected photos",
        variant: "destructive"
      });
    } finally {
      setDownloadingClient(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-400">Loading selections...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center py-8">
        <h2 className="text-4xl font-light text-white mb-3">Photo Selections</h2>
        <p className="text-slate-400 text-lg">Beautifully curated by your clients</p>
      </div>

      {groupedSelections.length === 0 ? (
        <div className="flex items-center justify-center py-20">
          <div className="text-center max-w-md">
            <div className="w-24 h-24 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6">
              <Heart className="w-12 h-12 text-slate-400" />
            </div>
            <h3 className="text-2xl font-light mb-3 text-white">No Selections Yet</h3>
            <p className="text-slate-400 text-lg leading-relaxed">
              Client photo selections will appear here when they make their choices
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-8">
          {groupedSelections.map((clientGroup, index) => (
            <Card key={index} className="bg-white/3 border-white/10 backdrop-blur-xl rounded-2xl overflow-hidden">
              {/* Client Header */}
              <div className="p-8 border-b border-white/10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center">
                      <User className="w-8 h-8 text-white" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-medium text-white mb-1">{clientGroup.clientName}</h3>
                      <p className="text-slate-400 mb-1">{clientGroup.clientEmail}</p>
                      <div className="flex items-center space-x-4 text-sm text-slate-500">
                        <span className="flex items-center space-x-1">
                          <ImageIcon className="w-4 h-4" />
                          <span>{clientGroup.galleryName}</span>
                        </span>
                        <span className="flex items-center space-x-1">
                          <Heart className="w-4 h-4" />
                          <span>{clientGroup.selections.length} selected</span>
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <Button
                    onClick={() => downloadClientSelections(clientGroup)}
                    disabled={downloadingClient === clientGroup.clientName}
                    className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-6 py-3 font-medium transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    {downloadingClient === clientGroup.clientName ? 'Preparing...' : 'Download All'}
                  </Button>
                </div>
              </div>

              {/* Photos Grid */}
              <div className="p-8">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                  {clientGroup.selections.map((selection) => (
                    <div
                      key={selection.id}
                      className="group relative aspect-square rounded-xl overflow-hidden bg-slate-800 cursor-pointer hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-2xl"
                      onClick={() => setSelectedPhoto(selection)}
                    >
                      <img
                        src={getPhotoUrl(selection.photo.storage_path)}
                        alt={selection.photo.title || selection.photo.filename}
                        className="w-full h-full object-cover"
                      />
                      
                      {/* Overlay */}
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-300 flex items-center justify-center">
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                          <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                            <Eye className="w-6 h-6 text-white" />
                          </div>
                        </div>
                      </div>

                      {/* Selection Date Badge */}
                      <div className="absolute bottom-2 left-2 right-2">
                        <div className="bg-black/60 backdrop-blur-sm rounded-lg px-2 py-1 text-xs text-white">
                          <div className="flex items-center space-x-1">
                            <Calendar className="w-3 h-3" />
                            <span>{new Date(selection.selected_at).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {selectedPhoto && (
        <PhotoSelectionModal
          isOpen={!!selectedPhoto}
          onClose={() => setSelectedPhoto(null)}
          photoUrl={getPhotoUrl(selectedPhoto.photo.storage_path)}
          photoTitle={selectedPhoto.photo.title || selectedPhoto.photo.filename}
          clientName={selectedPhoto.gallery.client_name}
        />
      )}
    </div>
  );
};

export default PhotoSelectionsTab;
