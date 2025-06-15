
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Mail, CreditCard, Heart } from 'lucide-react';
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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const isPaymentRequired = extraPhotosCount > 0;

  const handleEmailSubmit = async () => {
    if (!tempClientEmail || tempClientEmail.trim() === '') {
      toast({
        title: "Email required",
        description: "Please enter your email address to proceed.",
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

    setIsSubmitting(true);
    try {
      await onEmailSubmit(tempClientEmail.trim());
    } catch (error) {
      console.error('Error submitting email:', error);
      toast({
        title: "Error",
        description: "Failed to process your request. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md bg-white">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            {isPaymentRequired ? (
              <>
                <Mail className="w-5 h-5 text-blue-500" />
                <span>Email Required for Payment</span>
              </>
            ) : (
              <>
                <Heart className="w-5 h-5 text-red-500" />
                <span>Email Required</span>
              </>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className={`p-4 rounded-lg ${isPaymentRequired ? 'bg-blue-50' : 'bg-green-50'}`}>
            <p className={`text-sm ${isPaymentRequired ? 'text-blue-800' : 'text-green-800'}`}>
              {isPaymentRequired ? (
                <>We need your email address to process the payment for {extraPhotosCount} extra photo{extraPhotosCount > 1 ? 's' : ''} (€{totalCost.toFixed(2)}).</>
              ) : (
                <>We need your email address to save your photo selection.</>
              )}
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
              disabled={isSubmitting}
            />
          </div>

          <div className="flex justify-between items-center pt-4">
            <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
              Back
            </Button>
            <Button 
              onClick={handleEmailSubmit}
              className={isPaymentRequired ? "bg-blue-600 hover:bg-blue-700" : "bg-green-600 hover:bg-green-700"}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                "Processing..."
              ) : isPaymentRequired ? (
                <>
                  <CreditCard className="w-4 h-4 mr-2" />
                  Continue to Payment
                </>
              ) : (
                <>
                  <Heart className="w-4 h-4 mr-2" />
                  Save Selection
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EmailFormModal;
