
import React from 'react';
import { Button } from '@/components/ui/button';
import { Download, Send, CreditCard } from 'lucide-react';

interface SelectionActionsProps {
  selectedPhotosCount: number;
  extraPhotosCount: number;
  totalCost: number;
  isDownloading: boolean;
  isSubmitting: boolean;
  onDownload: () => void;
  onSubmit: () => void;
}

const SelectionActions: React.FC<SelectionActionsProps> = ({
  selectedPhotosCount,
  extraPhotosCount,
  totalCost,
  isDownloading,
  isSubmitting,
  onDownload,
  onSubmit,
}) => {
  return (
    <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-slate-600">
      <Button
        onClick={onDownload}
        disabled={isDownloading || selectedPhotosCount === 0}
        variant="outline"
        className="border-slate-600 text-slate-300 hover:bg-slate-700"
      >
        <Download className="w-4 h-4 mr-2" />
        {isDownloading ? 'Downloading...' : 'Download Photos'}
      </Button>
      
      <Button
        onClick={onSubmit}
        disabled={isSubmitting || selectedPhotosCount === 0}
        className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
      >
        {extraPhotosCount > 0 ? (
          <>
            <CreditCard className="w-4 h-4 mr-2" />
            {isSubmitting ? 'Processing...' : `Pay €${totalCost} & Send Selection`}
          </>
        ) : (
          <>
            <Send className="w-4 h-4 mr-2" />
            {isSubmitting ? 'Sending...' : 'Send Selection'}
          </>
        )}
      </Button>
    </div>
  );
};

export default SelectionActions;
