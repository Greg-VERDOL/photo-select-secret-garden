
import React, { useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import PhotoSelectionsHeader from './PhotoSelectionsHeader';
import EmptySelectionsState from './EmptySelectionsState';
import ClientSelectionCard from './ClientSelectionCard';
import PhotoSelectionModal from './PhotoSelectionModal';
import { useAdminPhotoSelections, PhotoSelection } from '@/hooks/useAdminPhotoSelections';
import { usePhotoDownload } from '@/hooks/usePhotoDownload';

const PhotoSelectionsTab: React.FC = () => {
  const [selectedPhoto, setSelectedPhoto] = useState<PhotoSelection | null>(null);
  
  const { groupedSelections, loading, refreshing, handleManualRefresh } = useAdminPhotoSelections();
  const { downloadingClient, downloadClientSelections, getPhotoUrl } = usePhotoDownload();

  const handlePhotoClick = (selection: PhotoSelection) => {
    setSelectedPhoto(selection);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-400">Loading selections...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <PhotoSelectionsHeader />
        <Button
          onClick={handleManualRefresh}
          variant="outline"
          className="border-slate-600 text-slate-300 hover:bg-slate-700"
          disabled={refreshing}
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {groupedSelections.length === 0 ? (
        <EmptySelectionsState />
      ) : (
        <div className="space-y-8">
          {groupedSelections.map((clientGroup, index) => (
            <ClientSelectionCard
              key={index}
              clientGroup={clientGroup}
              getPhotoUrl={getPhotoUrl}
              onPhotoClick={handlePhotoClick}
              onDownloadAll={downloadClientSelections}
              downloadingClient={downloadingClient}
            />
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
