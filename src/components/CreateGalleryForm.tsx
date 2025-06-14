
import React, { useState } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface CreateGalleryFormProps {
  onGalleryCreated: () => void;
  onCancel?: () => void;
}

const CreateGalleryForm: React.FC<CreateGalleryFormProps> = ({ onGalleryCreated, onCancel }) => {
  const [newGalleryData, setNewGalleryData] = useState({
    name: '',
    clientName: '',
    clientEmail: ''
  });
  const [isLoading, setIsLoading] = useState(false);
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

    setIsLoading(true);
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
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      {onCancel && (
        <Button
          variant="ghost"
          size="sm"
          className="absolute top-4 right-4 p-1"
          onClick={onCancel}
        >
          <X className="w-4 h-4" />
        </Button>
      )}
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Gallery Name *
          </label>
          <Input
            value={newGalleryData.name}
            onChange={(e) => setNewGalleryData({ ...newGalleryData, name: e.target.value })}
            placeholder="Wedding - Johnson Family"
            className="w-full"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Client Name
          </label>
          <Input
            value={newGalleryData.clientName}
            onChange={(e) => setNewGalleryData({ ...newGalleryData, clientName: e.target.value })}
            placeholder="John & Jane Johnson"
            className="w-full"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Client Email
          </label>
          <Input
            type="email"
            value={newGalleryData.clientEmail}
            onChange={(e) => setNewGalleryData({ ...newGalleryData, clientEmail: e.target.value })}
            placeholder="client@example.com"
            className="w-full"
          />
        </div>
      </div>
      
      <div className="flex gap-3 mt-6">
        {onCancel && (
          <Button
            variant="outline"
            onClick={onCancel}
            className="flex-1"
            disabled={isLoading}
          >
            Cancel
          </Button>
        )}
        <Button
          onClick={createNewGallery}
          className="flex-1 bg-blue-600 hover:bg-blue-700"
          disabled={isLoading}
        >
          {isLoading ? 'Creating...' : 'Create Gallery'}
        </Button>
      </div>
    </div>
  );
};

export default CreateGalleryForm;
