
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface GalleriesHeaderProps {
  onCreateGallery: () => void;
}

const GalleriesHeader: React.FC<GalleriesHeaderProps> = ({ onCreateGallery }) => {
  const { t } = useTranslation();

  return (
    <div className="bg-slate-800/50 border-b border-slate-600">
      <div className="px-8 py-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-semibold text-white">{t('galleriesHeader.title')}</h1>
            <p className="text-slate-300 mt-1">{t('galleriesHeader.subtitle')}</p>
          </div>
          <Button
            onClick={onCreateGallery}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-2.5 rounded-lg font-medium transition-all duration-200 shadow-sm hover:shadow-md"
          >
            <Plus className="w-4 h-4 mr-2" />
            {t('galleriesHeader.newGalleryButton')}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default GalleriesHeader;
