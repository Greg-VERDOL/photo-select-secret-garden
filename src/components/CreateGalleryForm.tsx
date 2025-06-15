
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();
  const [newGalleryData, setNewGalleryData] = useState({
    name: '',
    clientName: '',
    clientEmail: '',
    freePhotoLimit: 5
  });
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const createNewGallery = async () => {
    if (!newGalleryData.name.trim()) {
      toast({
        title: t('createGalleryForm.galleryNameRequired'),
        description: t('createGalleryForm.galleryNameRequiredDescription'),
        variant: "destructive"
      });
      return;
    }

    if (newGalleryData.freePhotoLimit < 0) {
      toast({
        title: t('createGalleryForm.invalidFreePhotoLimit'),
        description: t('createGalleryForm.invalidFreePhotoLimitDescription'),
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
          access_code: codeData,
          free_photo_limit: newGalleryData.freePhotoLimit
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: t('createGalleryForm.galleryCreated'),
        description: t('createGalleryForm.galleryCreatedDescription', {
          accessCode: data.access_code,
          freePhotoLimit: newGalleryData.freePhotoLimit
        }),
      });

      setNewGalleryData({ name: '', clientName: '', clientEmail: '', freePhotoLimit: 5 });
      onGalleryCreated();
    } catch (error) {
      toast({
        title: t('createGalleryForm.errorCreatingGallery'),
        description: t('createGalleryForm.errorCreatingGalleryDescription'),
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
            {t('createGalleryForm.galleryNameLabel')}
          </label>
          <Input
            value={newGalleryData.name}
            onChange={(e) => setNewGalleryData({ ...newGalleryData, name: e.target.value })}
            placeholder={t('createGalleryForm.galleryNamePlaceholder')}
            className="w-full bg-white text-gray-900 border-gray-300 placeholder:text-gray-500 focus-visible:ring-slate-950 ring-offset-white"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t('createGalleryForm.clientNameLabel')}
          </label>
          <Input
            value={newGalleryData.clientName}
            onChange={(e) => setNewGalleryData({ ...newGalleryData, clientName: e.target.value })}
            placeholder={t('createGalleryForm.clientNamePlaceholder')}
            className="w-full bg-white text-gray-900 border-gray-300 placeholder:text-gray-500 focus-visible:ring-slate-950 ring-offset-white"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t('createGalleryForm.clientEmailLabel')}
          </label>
          <Input
            type="email"
            value={newGalleryData.clientEmail}
            onChange={(e) => setNewGalleryData({ ...newGalleryData, clientEmail: e.target.value })}
            placeholder={t('createGalleryForm.clientEmailPlaceholder')}
            className="w-full bg-white text-gray-900 border-gray-300 placeholder:text-gray-500 focus-visible:ring-slate-950 ring-offset-white"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t('createGalleryForm.freePhotoLimitLabel')}
          </label>
          <Input
            type="number"
            min="0"
            value={newGalleryData.freePhotoLimit}
            onChange={(e) => setNewGalleryData({ ...newGalleryData, freePhotoLimit: parseInt(e.target.value) || 0 })}
            placeholder="5"
            className="w-full bg-white text-gray-900 border-gray-300 placeholder:text-gray-500 focus-visible:ring-slate-950 ring-offset-white"
          />
          <p className="text-xs text-gray-500 mt-1">
            {t('createGalleryForm.freePhotoLimitDescription')}
          </p>
        </div>
      </div>
      
      <div className="flex gap-3 mt-6">
        {onCancel && (
          <Button
            variant="outline"
            onClick={onCancel}
            className="flex-1 bg-white text-gray-900 border-gray-300 hover:bg-gray-50"
            disabled={isLoading}
          >
            {t('createGalleryForm.cancelButton')}
          </Button>
        )}
        <Button
          onClick={createNewGallery}
          className="flex-1 bg-blue-600 hover:bg-blue-700"
          disabled={isLoading}
        >
          {isLoading ? t('createGalleryForm.creatingGalleryButton') : t('createGalleryForm.createGalleryButton')}
        </Button>
      </div>
    </div>
  );
};

export default CreateGalleryForm;
