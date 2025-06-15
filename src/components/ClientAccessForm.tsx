
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Key, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useTranslation } from 'react-i18next';

const ClientAccessForm: React.FC = () => {
  const [accessCode, setAccessCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessCode.trim()) return;

    setIsLoading(true);

    try {
      const { data, error } = await supabase
        .from('galleries')
        .select('id, name, client_name')
        .eq('access_code', accessCode.toUpperCase())
        .single();

      if (error || !data) {
        toast({
          title: t('clientAccessForm.invalidAccessCode'),
          description: t('clientAccessForm.invalidAccessCodeDescription'),
          variant: "destructive"
        });
        return;
      }

      toast({
        title: t('clientAccessForm.accessGranted'),
        description: t('clientAccessForm.accessGrantedDescription', { galleryName: data.name }),
      });

      navigate(`/gallery/${accessCode.toUpperCase()}`);
    } catch (error) {
      toast({
        title: t('clientAccessForm.error'),
        description: t('clientAccessForm.errorDescription'),
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-full max-w-sm md:max-w-md"
      >
        <Card className="p-6 md:p-8 bg-white/10 border-white/20 backdrop-blur-sm">
          <div className="text-center mb-6 md:mb-8">
            <div className="inline-flex items-center justify-center w-12 h-12 md:w-16 md:h-16 bg-blue-600/20 rounded-full mb-4">
              <Key className="w-6 h-6 md:w-8 md:h-8 text-blue-400" />
            </div>
            <h1 className="text-xl md:text-2xl font-bold text-white">{t('clientAccessForm.title')}</h1>
            <p className="text-slate-300 mt-2 text-sm md:text-base">{t('clientAccessForm.subtitle')}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                {t('clientAccessForm.accessCodeLabel')}
              </label>
              <Input
                type="text"
                value={accessCode}
                onChange={(e) => setAccessCode(e.target.value.toUpperCase())}
                placeholder={t('clientAccessForm.accessCodePlaceholder')}
                className="bg-slate-700/50 border-slate-600 text-white text-center text-base md:text-lg tracking-widest h-12 md:h-14"
                maxLength={8}
                required
              />
            </div>

            <Button
              type="submit"
              disabled={isLoading || accessCode.length !== 8}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transition-all duration-300 h-12 md:h-14 text-base font-medium"
            >
              {isLoading ? t('clientAccessForm.verifyingButton') : t('clientAccessForm.accessGalleryButton')}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </form>

          <div className="mt-6 md:mt-8 text-center">
            <p className="text-xs md:text-sm text-slate-400">
              {t('clientAccessForm.noAccessCode')}{' '}
              <span className="text-blue-400">{t('clientAccessForm.contactPhotographer')}</span>
            </p>
          </div>
        </Card>
      </motion.div>
    </div>
  );
};

export default ClientAccessForm;
