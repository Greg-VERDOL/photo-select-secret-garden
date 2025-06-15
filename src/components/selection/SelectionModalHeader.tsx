
import React from 'react';
import { useTranslation } from 'react-i18next';
import { DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

interface SelectionModalHeaderProps {
  selectedCount: number;
  onClose: () => void;
}

const SelectionModalHeader: React.FC<SelectionModalHeaderProps> = ({
  selectedCount,
  onClose
}) => {
  const { t } = useTranslation();

  return (
    <DialogHeader className="flex-shrink-0 pb-4">
      <DialogTitle className="flex justify-between items-center text-xl">
        {t('selectionModal.title', { count: selectedCount })}
        <Button
          size="sm"
          variant="outline"
          onClick={onClose}
          className="border-slate-600 text-slate-300 hover:bg-slate-700"
        >
          <X className="w-4 h-4" />
        </Button>
      </DialogTitle>
    </DialogHeader>
  );
};

export default SelectionModalHeader;
