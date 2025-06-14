
import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { User, Calendar, Image as ImageIcon, Heart, Download } from 'lucide-react';
import PhotoThumbnail from './PhotoThumbnail';

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

interface ClientSelections {
  clientName: string;
  clientEmail: string;
  galleryName: string;
  selections: PhotoSelection[];
}

interface ClientSelectionCardProps {
  clientGroup: ClientSelections;
  getPhotoUrl: (storagePath: string) => string;
  onPhotoClick: (selection: PhotoSelection) => void;
  onDownloadAll: (clientSelections: ClientSelections) => void;
  downloadingClient: string | null;
}

const ClientSelectionCard: React.FC<ClientSelectionCardProps> = ({
  clientGroup,
  getPhotoUrl,
  onPhotoClick,
  onDownloadAll,
  downloadingClient
}) => {
  return (
    <Card className="bg-white/3 border-white/10 backdrop-blur-xl rounded-2xl overflow-hidden">
      {/* Client Header */}
      <div className="p-8 border-b border-white/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center">
              <User className="w-8 h-8 text-white" />
            </div>
            <div>
              <h3 className="text-2xl font-medium text-white mb-1">{clientGroup.clientName}</h3>
              <p className="text-slate-400 mb-1">{clientGroup.clientEmail}</p>
              <div className="flex items-center space-x-4 text-sm text-slate-500">
                <span className="flex items-center space-x-1">
                  <ImageIcon className="w-4 h-4" />
                  <span>{clientGroup.galleryName}</span>
                </span>
                <span className="flex items-center space-x-1">
                  <Heart className="w-4 h-4" />
                  <span>{clientGroup.selections.length} selected</span>
                </span>
              </div>
            </div>
          </div>
          
          <Button
            onClick={() => onDownloadAll(clientGroup)}
            disabled={downloadingClient === clientGroup.clientName}
            className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-6 py-3 font-medium transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50"
          >
            <Download className="w-4 h-4 mr-2" />
            {downloadingClient === clientGroup.clientName ? 'Preparing...' : 'Download All'}
          </Button>
        </div>
      </div>

      {/* Photos Grid */}
      <div className="p-8">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
          {clientGroup.selections.map((selection) => (
            <PhotoThumbnail
              key={selection.id}
              selection={selection}
              photoUrl={getPhotoUrl(selection.photo.storage_path)}
              onClick={() => onPhotoClick(selection)}
            />
          ))}
        </div>
      </div>
    </Card>
  );
};

export default ClientSelectionCard;
