
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Mail, CreditCard, Heart } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';

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
  const { t } = useTranslation();

  const isPaymentRequired = extraPhotosCount > 0;

  const handleEmailSubmit = async () => {
    if (!tempClientEmail || tempClientEmail.trim() === '') {
      toast({
        title: t('emailFormModal.emailRequired'),
        description: t('emailFormModal.emailRequiredDescription'),
        variant: "destructive"
      });
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(tempClientEmail.trim())) {
      toast({
        title: t('emailFormModal.invalidEmail'),
        description: t('emailFormModal.invalidEmailDescription'),
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
        title: t('emailFormModal.error'),
        description: t('emailFormModal.errorDescription'),
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
                <span>{t('emailFormModal.emailForPaymentTitle')}</span>
              </>
            ) : (
              <>
                <Heart className="w-5 h-5 text-red-500" />
                <span>{t('emailFormModal.emailRequiredTitle')}</span>
              </>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className={`p-4 rounded-lg ${isPaymentRequired ? 'bg-blue-50' : 'bg-green-50'}`}>
            <p className={`text-sm ${isPaymentRequired ? 'text-blue-800' : 'text-green-800'}`}>
              {isPaymentRequired ? 
                t('emailFormModal.paymentDescription', { count: extraPhotosCount, extraPhotosCount: extraPhotosCount, totalCost: totalCost.toFixed(2) })
               : 
                t('emailFormModal.selectionDescription')
              }
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="client-email">{t('emailFormModal.emailLabel')}</Label>
            <Input
              id="client-email"
              type="email"
              placeholder={t('emailFormModal.emailPlaceholder')}
              value={tempClientEmail}
              onChange={(e) => setTempClientEmail(e.target.value)}
              className="w-full"
              disabled={isSubmitting}
            />
          </div>

          <div className="flex justify-between items-center pt-4">
            <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
              {t('emailFormModal.backButton')}
            </Button>
            <Button 
              onClick={handleEmailSubmit}
              className={isPaymentRequired ? "bg-blue-600 hover:bg-blue-700" : "bg-green-600 hover:bg-green-700"}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                t('emailFormModal.processingButton')
              ) : isPaymentRequired ? (
                <>
                  <CreditCard className="w-4 h-4 mr-2" />
                  {t('emailFormModal.continueToPaymentButton')}
                </>
              ) : (
                <>
                  <Heart className="w-4 h-4 mr-2" />
                  {t('emailFormModal.saveSelectionButton')}
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
