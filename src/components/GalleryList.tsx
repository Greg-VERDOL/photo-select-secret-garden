
import React from 'react';
import { motion } from 'framer-motion';
import { Trash2, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useTranslation } from 'react-i18next';

interface Gallery {
  id: string;
  name: string;
  client_name?: string;
  client_email?: string;
  access_code: string;
  created_at: string;
  photo_count?: number;
}

interface GalleryListProps {
  galleries: Gallery[];
  selectedGallery: Gallery | null;
  onSelectGallery: (gallery: Gallery) => void;
  onGalleryDeleted: () => void;
}

const GalleryList: React.FC<GalleryListProps> = ({
  galleries,
  selectedGallery,
  onSelectGallery,
  onGalleryDeleted
}) => {
  const { toast } = useToast();
  const { t } = useTranslation();

  const deleteGallery = async (galleryId: string, galleryName: string) => {
    if (!window.confirm(t('galleryList.deleteConfirmation', { galleryName }))) {
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
        title: t('galleryList.galleryDeleted'),
        description: t('galleryList.galleryDeletedDescription', { galleryName }),
      });

      onGalleryDeleted();
    } catch (error) {
      toast({
        title: t('galleryList.deleteFailed'),
        description: t('galleryList.deleteFailedDescription'),
        variant: "destructive"
      });
    }
  };

  const copyAccessCode = (accessCode: string) => {
    navigator.clipboard.writeText(accessCode);
    toast({
      title: t('galleryList.accessCodeCopied'),
      description: t('galleryList.accessCodeCopiedDescription'),
    });
  };

  return (
    <Card className="p-6 bg-white/5 border-white/10">
      <h2 className="text-xl font-semibold mb-4">{t('galleryList.title', { count: galleries.length })}</h2>
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
            onClick={() => onSelectGallery(gallery)}
          >
            <h3 className="font-medium">{gallery.name}</h3>
            <p className="text-sm text-slate-400">
              {t('galleryList.photoCount', { count: gallery.photo_count || 0 })} • {new Date(gallery.created_at).toLocaleDateString()}
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
  );
};

export default GalleryList;
