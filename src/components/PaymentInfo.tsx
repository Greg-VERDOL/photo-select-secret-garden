
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { CreditCard, Gift } from 'lucide-react';

interface PaymentInfoProps {
  extraPhotosCount: number;
  amountPaid?: number;
  currency?: string;
}

const PaymentInfo: React.FC<PaymentInfoProps> = ({ 
  extraPhotosCount, 
  amountPaid, 
  currency = 'EUR' 
}) => {
  if (extraPhotosCount === 0) {
    return (
      <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-200">
        <Gift className="w-3 h-3 mr-1" />
        Free Selection
      </Badge>
    );
  }

  const displayAmount = amountPaid ? (amountPaid / 100).toFixed(2) : '0.00';

  return (
    <Badge variant="secondary" className="bg-blue-100 text-blue-800 border-blue-200">
      <CreditCard className="w-3 h-3 mr-1" />
      Paid €{displayAmount} for {extraPhotosCount} extra photos
    </Badge>
  );
};

export default PaymentInfo;
