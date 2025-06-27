
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Check, Square, CheckSquare, X } from 'lucide-react';
import { motion } from 'framer-motion';
import SecureImage from './SecureImage';
import { supabase } from '@/integrations/supabase/client';
import { useTranslation } from 'react-i18next';

interface Photo {
  id: string;
  storage_path: string;
  filename: string;
  title?: string;
}

interface SecurePhotoGridProps {
  photos: Photo[];
  selectedPhotos: Set<string>;
  galleryId: string;
  clientEmail: string;
  onPhotoClick: (photo: Photo) => void;
  onToggleSelection: (photoId: string) => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  isSessionValid: boolean;
  generateSecureImageUrl: (photoId: string, storagePath: string) => Promise<string | null>;
  logDownloadAttempt: (photoId: string, attemptType: string) => void;
}

const SecurePhotoGrid: React.FC<SecurePhotoGridProps> = ({
  photos,
  selectedPhotos,
  galleryId,
  clientEmail,
  onPhotoClick,
  onToggleSelection,
  onSelectAll,
  onDeselectAll,
  isSessionValid,
  generateSecureImageUrl,
  logDownloadAttempt
}) => {
  const { t } = useTranslation();

  const allSelected = photos.length > 0 && photos.every(photo => selectedPhotos.has(photo.id));

  return (
    <div className="space-y-6">
      {/* Selection Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-4 bg-white/5 rounded-xl backdrop-blur-sm border border-white/10">
        <div className="text-white">
          <h3 className="text-lg font-semibold">
            {selectedPhotos.size} of {photos.length} photos selected
          </h3>
          <p className="text-sm text-slate-300">
            Click photos to select them for your collection
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button
            onClick={allSelected ? onDeselectAll : onSelectAll}
            variant="outline"
            size="sm"
            className="border-blue-500 text-blue-400 hover:bg-blue-500/20"
          >
            {allSelected ? (
              <>
                <X className="w-4 h-4 mr-2" />
                Deselect All
              </>
            ) : (
              <>
                <CheckSquare className="w-4 h-4 mr-2" />
                Select All
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Security Notice */}
      <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl">
        <p className="text-amber-200 text-sm">
          <strong>🔒 Protected Gallery:</strong> These photos are protected against unauthorized downloading. 
          Screenshots and download attempts are monitored. Please respect copyright.
        </p>
      </div>

      {/* Photo Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4">
        {photos.map((photo, index) => {
          const isSelected = selectedPhotos.has(photo.id);
          
          return (
            <motion.div
              key={photo.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="group relative"
            >
              {/* Selection Overlay */}
              <div 
                className={`absolute inset-0 z-10 rounded-lg transition-all duration-200 ${
                  isSelected 
                    ? 'bg-blue-500/20 border-2 border-blue-500' 
                    : 'border-2 border-transparent hover:border-blue-400/50'
                }`}
              />
              
              {/* Selection Checkbox */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleSelection(photo.id);
                }}
                className="absolute top-2 right-2 z-20 w-6 h-6 rounded bg-black/60 backdrop-blur-sm border border-white/30 flex items-center justify-center transition-all duration-200 hover:bg-black/80"
              >
                {isSelected ? (
                  <Check className="w-4 h-4 text-blue-400" />
                ) : (
                  <Square className="w-4 h-4 text-white/70" />
                )}
              </button>

              {/* Secure Image */}
              <div className="aspect-square overflow-hidden rounded-lg bg-slate-800">
                <SecureImage
                  photoId={photo.id}
                  storagePath={photo.storage_path}
                  alt={photo.title || photo.filename}
                  galleryId={galleryId}
                  clientEmail={clientEmail}
                  className="w-full h-full object-cover"
                  onClick={() => onPhotoClick(photo)}
                />
              </div>

              {/* Photo Info */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2 rounded-b-lg">
                <p className="text-white text-xs truncate">
                  Photo {index + 1}
                </p>
              </div>
            </motion.div>
          );
        })}
      </div>

      {photos.length === 0 && (
        <div className="text-center py-20">
          <p className="text-slate-400 text-lg">No photos in this gallery yet.</p>
        </div>
      )}
    </div>
  );
};

export default SecurePhotoGrid;
