
import React from 'react';
import { motion } from 'framer-motion';
import { Heart, Mail, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { Gallery } from '@/hooks/useGalleryData';

interface GalleryHeaderProps {
  gallery: Gallery;
  selectedPhotosCount: number;
  onSendSelection: () => void;
}

const GalleryHeader: React.FC<GalleryHeaderProps> = ({
  gallery,
  selectedPhotosCount,
  onSendSelection
}) => {
  const navigate = useNavigate();

  return (
    <motion.header 
      initial={{ y: -50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="p-6 border-b border-white/10 backdrop-blur-sm bg-white/5"
    >
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            {gallery.name}
          </h1>
          <p className="text-slate-300 mt-1">
            {gallery.client_name ? `Welcome ${gallery.client_name}! ` : ''}
            Select your favorite photos
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <Button 
            variant="outline" 
            onClick={() => navigate('/')}
            className="border-slate-600 text-slate-300 hover:bg-slate-700"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Exit
          </Button>
          
          {selectedPhotosCount > 0 && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="flex items-center gap-2 bg-blue-600/20 px-4 py-2 rounded-full border border-blue-400/30"
            >
              <Heart className="w-4 h-4 text-red-400" />
              <span>{selectedPhotosCount} selected</span>
            </motion.div>
          )}
          
          <Button 
            onClick={onSendSelection}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transition-all duration-300"
            disabled={selectedPhotosCount === 0}
          >
            <Mail className="w-4 h-4 mr-2" />
            Send Selection
          </Button>
        </div>
      </div>
    </motion.header>
  );
};

export default GalleryHeader;
