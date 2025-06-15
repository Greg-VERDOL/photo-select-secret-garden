
import React from 'react';
import { motion } from 'framer-motion';
import { CreditCard, User, Mail, Calendar, Eye, Download } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import PhotoThumbnail from './PhotoThumbnail';
import { ClientSelections, PhotoSelection } from '@/hooks/useAdminPhotoSelections';
import { usePhotoDownload } from '@/hooks/usePhotoDownload';
import { useTranslation } from 'react-i18next';

interface ClientSelectionCardProps {
  clientGroup: ClientSelections;
  getPhotoUrl: (storagePath: string) => string;
  onPhotoClick: (selection: PhotoSelection) => void;
}

const ClientSelectionCard: React.FC<ClientSelectionCardProps> = ({
  clientGroup,
  getPhotoUrl,
  onPhotoClick
}) => {
  const { downloadingClient, downloadClientSelections } = usePhotoDownload();
  const isDownloading = downloadingClient === clientGroup.clientName;
  const { t } = useTranslation();

  const handleDownload = () => {
    downloadClientSelections(clientGroup, true);
  };

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
                  {t('clientSelectionCard.photoCount', { count: clientGroup.selections.length })}
                </Badge>
              </div>
              
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm text-slate-400">
                <div className="flex items-center gap-1">
                  <Mail className="w-4 h-4" />
                  <span>{clientGroup.clientEmail}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Eye className="w-4 h-4" />
                  <span>{t('clientSelectionCard.gallery', { galleryName: clientGroup.galleryName })}</span>
                </div>
                {clientGroup.selections.length > 0 && (
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    <span>
                      {t('clientSelectionCard.lastSelected', { date: new Date(clientGroup.selections[0].selected_at).toLocaleDateString() })}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Download Button */}
            <Button
              onClick={handleDownload}
              disabled={isDownloading}
              size="sm"
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Download className="w-4 h-4 mr-2" />
              {isDownloading ? t('clientSelectionCard.downloadingButton') : t('clientSelectionCard.downloadButton')}
            </Button>
          </div>

          {/* Payment Information */}
          {clientGroup.paymentInfo && (
            <div className="bg-slate-700/50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <CreditCard className="w-4 h-4 text-green-400" />
                <span className="text-sm font-medium text-white">{t('clientSelectionCard.paymentInfo')}</span>
              </div>
              <div className="text-sm text-slate-300">
                <p>{t('clientSelectionCard.extraPhotos', { count: clientGroup.paymentInfo.extraPhotosCount })}</p>
                <p>{t('clientSelectionCard.amountPaid', { amount: (clientGroup.paymentInfo.amountPaid / 100).toFixed(2) })}</p>
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
