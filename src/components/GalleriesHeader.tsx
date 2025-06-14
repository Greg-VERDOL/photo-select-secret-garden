
import React from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface GalleriesHeaderProps {
  onCreateGallery: () => void;
}

const GalleriesHeader: React.FC<GalleriesHeaderProps> = ({ onCreateGallery }) => {
  return (
    <div className="bg-white border-b border-gray-200">
      <div className="px-8 py-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-semibold text-gray-900">Galleries</h1>
            <p className="text-gray-600 mt-1">Manage your photo collections</p>
          </div>
          <Button
            onClick={onCreateGallery}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg font-medium transition-all duration-200 shadow-sm hover:shadow-md"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Gallery
          </Button>
        </div>
      </div>
    </div>
  );
};

export default GalleriesHeader;
