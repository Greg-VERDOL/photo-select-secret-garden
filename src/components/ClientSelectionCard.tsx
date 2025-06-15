
import React from 'react';
import { motion } from 'framer-motion';
import { Download, CreditCard, User, Mail, Calendar, Eye, ShieldOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import PhotoThumbnail from './PhotoThumbnail';
import PaymentInfo from './PaymentInfo';
import { ClientSelections, PhotoSelection } from '@/hooks/useAdminPhotoSelections';

interface ClientSelectionCardProps {
  clientGroup: ClientSelections;
  getPhotoUrl: (storagePath: string) => string;
  onPhotoClick: (selection: PhotoSelection) => void;
  onDownloadAll: (clientGroup: ClientSelections, unwatermarked?: boolean) => void;
  downloadingClient: string | null;
}

const ClientSelectionCard: React.FC<ClientSelectionCardProps> = ({
  clientGroup,
  getPhotoUrl,
  onPhotoClick,
  onDownloadAll,
  downloadingClient
}) => {
  const isDownloading = downloadingClient === clientGroup.clientName;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full"
    >
      <Card className="bg-slate-800 border-slate-700 overflow-hidden">
        <div className="p-6 space-y-6">
          {/* Client Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <User className="w-5 h-5 text-blue-400" />
                <h3 className="text-xl font-bold text-white">{clientGroup.clientName}</h3>
                <Badge variant="secondary" className="bg-slate-700 text-slate-300">
                  {clientGroup.selections.length} photo{clientGroup.selections.length !== 1 ? 's' : ''}
                </Badge>
              </div>
              
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm text-slate-400">
                <div className="flex items-center gap-1">
                  <Mail className="w-4 h-4" />
                  <span>{clientGroup.clientEmail}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Eye className="w-4 h-4" />
                  <span>Gallery: {clientGroup.galleryName}</span>
                </div>
                {clientGroup.selections.length > 0 && (
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    <span>
                      Last selected: {new Date(clientGroup.selections[0].selected_at).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <Button
                onClick={() => onDownloadAll(clientGroup, false)}
                disabled={isDownloading}
                variant="outline"
                className="border-slate-600 text-slate-300 hover:bg-slate-700"
              >
                <Download className="w-4 h-4 mr-2" />
                {isDownloading ? 'Downloading...' : 'Download (Watermarked)'}
              </Button>
              
              <Button
                onClick={() => onDownloadAll(clientGroup, true)}
                disabled={isDownloading}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                <ShieldOff className="w-4 h-4 mr-2" />
                {isDownloading ? 'Downloading...' : 'Download Original'}
              </Button>
            </div>
          </div>

          {/* Payment Information */}
          {clientGroup.paymentInfo && (
            <div className="bg-slate-700/50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <CreditCard className="w-4 h-4 text-green-400" />
                <span className="text-sm font-medium text-white">Payment Information</span>
              </div>
              <div className="text-sm text-slate-300">
                <p>Extra photos: {clientGroup.paymentInfo.extraPhotosCount}</p>
                <p>Amount paid: €{(clientGroup.paymentInfo.amountPaid / 100).toFixed(2)}</p>
              </div>
            </div>
          )}

          {/* Photo Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {clientGroup.selections.map((selection) => (
              <PhotoThumbnail
                key={selection.id}
                selection={selection}
                photoUrl={getPhotoUrl(selection.photo.storage_path)}
                onPhotoClick={onPhotoClick}
              />
            ))}
          </div>
        </div>
      </Card>
    </motion.div>
  );
};

export default ClientSelectionCard;
