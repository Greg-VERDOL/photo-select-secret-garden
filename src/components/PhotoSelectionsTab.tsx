
import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Heart, Image, Calendar, User, Download, Eye } from 'lucide-react';
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
      // Create a zip file with all selected photos
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
      <div className="flex items-center justify-center py-12">
        <div className="text-white">Loading photo selections...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">Photo Selections</h2>
        <p className="text-slate-400">View and download photos selected by your clients</p>
      </div>

      {groupedSelections.length === 0 ? (
        <Card className="p-12 bg-white/5 border-white/10 text-center">
          <Heart className="w-16 h-16 mx-auto mb-4 text-slate-400" />
          <h3 className="text-xl font-semibold mb-2 text-white">No Selections Yet</h3>
          <p className="text-slate-400">Client photo selections will appear here when they make their choices</p>
        </Card>
      ) : (
        <div className="space-y-8">
          {groupedSelections.map((clientGroup, index) => (
            <Card key={index} className="p-6 bg-white/5 border-white/10">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-xl font-semibold text-white flex items-center gap-2">
                    <User className="w-5 h-5" />
                    {clientGroup.clientName}
                  </h3>
                  <p className="text-slate-400">{clientGroup.clientEmail}</p>
                  <p className="text-sm text-blue-300">Gallery: {clientGroup.galleryName}</p>
                  <p className="text-sm text-slate-500">{clientGroup.selections.length} photos selected</p>
                </div>
                <Button
                  onClick={() => downloadClientSelections(clientGroup)}
                  disabled={downloadingClient === clientGroup.clientName}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Download className="w-4 h-4 mr-2" />
                  {downloadingClient === clientGroup.clientName ? 'Downloading...' : 'Download All'}
                </Button>
              </div>

              <Table>
                <TableHeader>
                  <TableRow className="border-slate-700">
                    <TableHead className="text-slate-300">Photo</TableHead>
                    <TableHead className="text-slate-300">Title</TableHead>
                    <TableHead className="text-slate-300">Selected Date</TableHead>
                    <TableHead className="text-slate-300">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {clientGroup.selections.map((selection) => (
                    <TableRow key={selection.id} className="border-slate-700">
                      <TableCell>
                        <div className="w-16 h-16 rounded-lg overflow-hidden">
                          <img
                            src={getPhotoUrl(selection.photo.storage_path)}
                            alt={selection.photo.title || selection.photo.filename}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      </TableCell>
                      <TableCell className="text-white">
                        {selection.photo.title || selection.photo.filename}
                      </TableCell>
                      <TableCell className="text-slate-300">
                        {new Date(selection.selected_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedPhoto(selection)}
                          className="border-slate-600 text-slate-300 hover:bg-slate-700"
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
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
