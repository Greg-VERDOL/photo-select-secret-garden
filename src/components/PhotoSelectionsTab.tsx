
import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Heart, Image, Calendar, User } from 'lucide-react';
import WatermarkedImage from './WatermarkedImage';

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

const PhotoSelectionsTab: React.FC = () => {
  const [selections, setSelections] = useState<PhotoSelection[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchSelections();
  }, []);

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

  const getPhotoUrl = (storagePath: string) => {
    const { data } = supabase.storage
      .from('gallery-photos')
      .getPublicUrl(storagePath);
    return data.publicUrl;
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
        <p className="text-slate-400">View photos selected by your clients</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {selections.map((selection) => (
          <Card key={selection.id} className="p-4 bg-white/5 border-white/10">
            <div className="space-y-4">
              <div className="aspect-square rounded-lg overflow-hidden">
                <WatermarkedImage
                  src={getPhotoUrl(selection.photo.storage_path)}
                  alt={selection.photo.title || selection.photo.filename}
                  className="w-full h-full object-cover"
                />
              </div>
              
              <div className="space-y-2">
                <h3 className="font-semibold text-white truncate">
                  {selection.photo.title || selection.photo.filename}
                </h3>
                
                <div className="flex items-center space-x-2 text-sm text-slate-300">
                  <Image className="w-4 h-4" />
                  <span>From: {selection.gallery.name}</span>
                </div>
                
                <div className="flex items-center space-x-2 text-sm text-slate-300">
                  <User className="w-4 h-4" />
                  <span>{selection.gallery.client_name}</span>
                </div>
                
                <div className="flex items-center space-x-2 text-sm text-slate-300">
                  <Calendar className="w-4 h-4" />
                  <span>Selected {new Date(selection.selected_at).toLocaleDateString()}</span>
                </div>
                
                <div className="flex items-center space-x-2 text-sm text-blue-300">
                  <Heart className="w-4 h-4 fill-current" />
                  <span>Client favorite</span>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {selections.length === 0 && (
        <Card className="p-12 bg-white/5 border-white/10 text-center">
          <Heart className="w-16 h-16 mx-auto mb-4 text-slate-400" />
          <h3 className="text-xl font-semibold mb-2 text-white">No Selections Yet</h3>
          <p className="text-slate-400">Client photo selections will appear here when they make their choices</p>
        </Card>
      )}
    </div>
  );
};

export default PhotoSelectionsTab;
