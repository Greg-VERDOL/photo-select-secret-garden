
import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useTranslation } from 'react-i18next';

interface ClientInfoFormProps {
  email: string;
  message: string;
  onEmailChange: (email: string) => void;
  onMessageChange: (message: string) => void;
}

const ClientInfoForm: React.FC<ClientInfoFormProps> = ({
  email,
  message,
  onEmailChange,
  onMessageChange,
}) => {
  const { t } = useTranslation();

  return (
    <div className="space-y-4 bg-slate-700/30 p-4 rounded-lg">
      <h3 className="text-lg font-semibold">{t('clientInfoForm.title')}</h3>
      
      <div className="grid grid-cols-1 gap-4">
        <div>
          <Label htmlFor="email" className="text-slate-300">{t('clientInfoForm.emailLabel')}</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => onEmailChange(e.target.value)}
            placeholder={t('clientInfoForm.emailPlaceholder')}
            className="bg-slate-700 border-slate-600 text-white"
            required
          />
        </div>
        
        <div>
          <Label htmlFor="message" className="text-slate-300">{t('clientInfoForm.messageLabel')}</Label>
          <Textarea
            id="message"
            value={message}
            onChange={(e) => onMessageChange(e.target.value)}
            placeholder={t('clientInfoForm.messagePlaceholder')}
            className="bg-slate-700 border-slate-600 text-white"
            rows={3}
          />
        </div>
      </div>
    </div>
  );
};

export default ClientInfoForm;
