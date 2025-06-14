
import React from 'react';
import { FolderPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

interface Gallery {
  id: string;
  name: string;
  client_name?: string;
  client_email?: string;
  access_code: string;
  created_at: string;
  photo_count?: number;
}

interface GalleriesSidebarProps {
  galleries: Gallery[];
  selectedGallery: Gallery | null;
  onSelectGallery: (gallery: Gallery) => void;
}

const GalleriesSidebar: React.FC<GalleriesSidebarProps> = ({
  galleries,
  selectedGallery,
  onSelectGallery
}) => {
  const { toast } = useToast();

  return (
    <div className="lg:col-span-1">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">
            Your Galleries
            <span className="ml-2 text-sm font-normal text-gray-500">({galleries.length})</span>
          </h2>
        </div>
        <div className="max-h-96 overflow-y-auto">
          {galleries.length === 0 ? (
            <div className="p-8 text-center">
              <FolderPlus className="w-12 h-12 mx-auto text-gray-300 mb-3" />
              <p className="text-gray-500">No galleries yet</p>
              <p className="text-sm text-gray-400 mt-1">Create your first gallery to get started</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {galleries.map((gallery) => (
                <div
                  key={gallery.id}
                  className={`p-4 cursor-pointer transition-all duration-200 ${
                    selectedGallery?.id === gallery.id
                      ? 'bg-blue-50 border-r-2 border-blue-600'
                      : 'hover:bg-gray-50'
                  }`}
                  onClick={() => onSelectGallery(gallery)}
                >
                  <h3 className="font-medium text-gray-900 mb-1">{gallery.name}</h3>
                  <p className="text-sm text-gray-500">
                    {gallery.photo_count || 0} photos • {new Date(gallery.created_at).toLocaleDateString()}
                  </p>
                  {gallery.client_name && (
                    <p className="text-sm text-blue-600 mt-1">{gallery.client_name}</p>
                  )}
                  <div className="flex items-center gap-2 mt-2">
                    <code className="text-xs bg-gray-100 px-2 py-1 rounded font-mono">
                      {gallery.access_code}
                    </code>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 px-2 text-xs"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigator.clipboard.writeText(gallery.access_code);
                        toast({
                          title: "Copied!",
                          description: "Access code copied to clipboard",
                        });
                      }}
                    >
                      Copy
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GalleriesSidebar;
