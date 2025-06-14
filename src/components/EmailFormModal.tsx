
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Mail, CreditCard } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface EmailFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEmailSubmit: (email: string) => Promise<void>;
  extraPhotosCount: number;
  totalCost: number;
}

const EmailFormModal: React.FC<EmailFormModalProps> = ({
  isOpen,
  onClose,
  onEmailSubmit,
  extraPhotosCount,
  totalCost,
}) => {
  const [tempClientEmail, setTempClientEmail] = useState('');
  const { toast } = useToast();

  const handleEmailSubmit = async () => {
    if (!tempClientEmail || tempClientEmail.trim() === '') {
      toast({
        title: "Email required",
        description: "Please enter your email address to proceed with payment.",
        variant: "destructive"
      });
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(tempClientEmail.trim())) {
      toast({
        title: "Invalid email",
        description: "Please enter a valid email address.",
        variant: "destructive"
      });
      return;
    }

    await onEmailSubmit(tempClientEmail.trim());
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md bg-white">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Mail className="w-5 h-5 text-blue-500" />
            <span>Email Required for Payment</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <p className="text-sm text-blue-800">
              We need your email address to process the payment for {extraPhotosCount} extra photo{extraPhotosCount > 1 ? 's' : ''} (€{totalCost.toFixed(2)}).
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="client-email">Email Address</Label>
            <Input
              id="client-email"
              type="email"
              placeholder="your.email@example.com"
              value={tempClientEmail}
              onChange={(e) => setTempClientEmail(e.target.value)}
              className="w-full"
            />
          </div>

          <div className="flex justify-between items-center pt-4">
            <Button variant="outline" onClick={onClose}>
              Back
            </Button>
            <Button 
              onClick={handleEmailSubmit}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <CreditCard className="w-4 h-4 mr-2" />
              Continue to Payment
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EmailFormModal;
