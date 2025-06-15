
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Key, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useTranslation } from 'react-i18next';

const ClientAccessForm: React.FC = () => {
  const [accessCode, setAccessCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
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
      console.error('Error verifying access code:', error);
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
    <div className="min-h-screen flex items-center justify-center p-4 relative">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-full max-w-md"
      >
        <Card className="p-8 bg-white/10 border-white/20 backdrop-blur-sm">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600/20 rounded-full mb-4">
              <Key className="w-8 h-8 text-blue-400" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">{t('clientAccessForm.title')}</h1>
            <p className="text-slate-300">{t('clientAccessForm.subtitle')}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="accessCode" className="block text-sm font-medium text-slate-300 mb-2">
                {t('clientAccessForm.accessCodeLabel')}
              </label>
              <Input
                id="accessCode"
                type="text"
                value={accessCode}
                onChange={(e) => setAccessCode(e.target.value.toUpperCase())}
                placeholder={t('clientAccessForm.accessCodePlaceholder')}
                className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-400"
                maxLength={8}
                required
              />
            </div>

            <Button
              type="submit"
              disabled={isLoading || !accessCode.trim()}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transition-all duration-300"
            >
              {isLoading ? t('clientAccessForm.verifyingButton') : t('clientAccessForm.accessGalleryButton')}
            </Button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-slate-400 text-sm">
              {t('clientAccessForm.noAccessCode')}{' '}
              <button className="text-blue-400 hover:text-blue-300 underline">
                {t('clientAccessForm.contactPhotographer')}
              </button>
            </p>
          </div>
        </Card>
      </motion.div>

      {/* Admin link */}
      <div className="absolute bottom-4 right-4">
        <Button
          variant="ghost"
          onClick={() => navigate('/admin')}
          className="text-slate-400 hover:text-white text-xs"
        >
          <Lock className="w-3 h-3 mr-1" />
          Admin
        </Button>
      </div>
    </div>
  );
};

export default ClientAccessForm;
