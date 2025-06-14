
import React, { useState } from 'react';
import { FolderPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface CreateGalleryFormProps {
  onGalleryCreated: () => void;
}

const CreateGalleryForm: React.FC<CreateGalleryFormProps> = ({ onGalleryCreated }) => {
  const [newGalleryData, setNewGalleryData] = useState({
    name: '',
    clientName: '',
    clientEmail: ''
  });
  const { toast } = useToast();

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
      onGalleryCreated();
    } catch (error) {
      toast({
        title: "Error creating gallery",
        description: "Failed to create new gallery",
        variant: "destructive"
      });
    }
  };

  return (
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
  );
};

export default CreateGalleryForm;
