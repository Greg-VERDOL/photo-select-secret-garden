
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
      <div className="bg-slate-800/30 backdrop-blur-sm rounded-2xl border border-slate-600 overflow-hidden">
        <div className="p-6 border-b border-slate-600">
          <h2 className="text-lg font-semibold text-white">
            Your Galleries
            <span className="ml-2 text-sm font-normal text-slate-300">({galleries.length})</span>
          </h2>
        </div>
        <div className="max-h-96 overflow-y-auto">
          {galleries.length === 0 ? (
            <div className="p-8 text-center">
              <FolderPlus className="w-12 h-12 mx-auto text-slate-400 mb-3" />
              <p className="text-slate-300">No galleries yet</p>
              <p className="text-sm text-slate-400 mt-1">Create your first gallery to get started</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-600">
              {galleries.map((gallery) => (
                <div
                  key={gallery.id}
                  className={`p-4 cursor-pointer transition-all duration-200 ${
                    selectedGallery?.id === gallery.id
                      ? 'bg-blue-600/20 border-r-2 border-blue-400'
                      : 'hover:bg-slate-700/30'
                  }`}
                  onClick={() => onSelectGallery(gallery)}
                >
                  <h3 className="font-medium text-white mb-1">{gallery.name}</h3>
                  <p className="text-sm text-slate-300">
                    {gallery.photo_count || 0} photos • {new Date(gallery.created_at).toLocaleDateString()}
                  </p>
                  {gallery.client_name && (
                    <p className="text-sm text-blue-300 mt-1">{gallery.client_name}</p>
                  )}
                  <div className="flex items-center gap-2 mt-2">
                    <code className="text-xs bg-slate-700 px-2 py-1 rounded font-mono text-slate-300">
                      {gallery.access_code}
                    </code>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 px-2 text-xs text-slate-300 hover:bg-slate-600"
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
