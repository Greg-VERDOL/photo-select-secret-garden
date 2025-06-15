
import React from 'react';
import { Button } from '@/components/ui/button';
import { Send, CreditCard } from 'lucide-react';

interface SelectionActionsProps {
  selectedPhotosCount: number;
  extraPhotosCount: number;
  totalCost: number;
  isSubmitting: boolean;
  onSubmit: () => void;
}

const SelectionActions: React.FC<SelectionActionsProps> = ({
  selectedPhotosCount,
  extraPhotosCount,
  totalCost,
  isSubmitting,
  onSubmit,
}) => {
  return (
    <div className="flex justify-center">
      <Button
        onClick={onSubmit}
        disabled={isSubmitting || selectedPhotosCount === 0}
        className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 min-w-[200px]"
      >
        {extraPhotosCount > 0 ? (
          <>
            <CreditCard className="w-4 h-4 mr-2" />
            {isSubmitting ? 'Processing...' : `Pay €${totalCost.toFixed(2)} & Send Selection`}
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
