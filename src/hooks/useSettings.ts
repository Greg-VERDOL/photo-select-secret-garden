
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export function useSettings() {
  const [pricePerPhoto, setPricePerPhoto] = useState<string>('5.00');
  const [isStripeConnected, setIsStripeConnected] = useState(false);
  const [watermarkText, setWatermarkText] = useState<string>('© PHOTO STUDIO');
  const [watermarkStyle, setWatermarkStyle] = useState<string>('corners');
  const [centerWatermarkText, setCenterWatermarkText] = useState<string>('PROOF');
  const [adminEmail, setAdminEmail] = useState<string>('admin@example.com');
  const [notificationsEnabled, setNotificationsEnabled] = useState<boolean>(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testingStripe, setTestingStripe] = useState(false);
  const [testingNotification, setTestingNotification] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('app_settings')
        .select('key, value')
        .in('key', [
          'price_per_extra_photo_cents', 
          'stripe_connected', 
          'watermark_text', 
          'watermark_style', 
          'center_watermark_text',
          'admin_notification_email',
          'notifications_enabled'
        ]);

      if (error) throw error;

      data.forEach(setting => {
        if (setting.key === 'price_per_extra_photo_cents') {
          setPricePerPhoto((parseInt(setting.value) / 100).toFixed(2));
        } else if (setting.key === 'stripe_connected') {
          setIsStripeConnected(setting.value === 'true');
        } else if (setting.key === 'watermark_text') {
          setWatermarkText(setting.value);
        } else if (setting.key === 'watermark_style') {
          setWatermarkStyle(setting.value);
        } else if (setting.key === 'center_watermark_text') {
          setCenterWatermarkText(setting.value);
        } else if (setting.key === 'admin_notification_email') {
          setAdminEmail(setting.value);
        } else if (setting.key === 'notifications_enabled') {
          setNotificationsEnabled(setting.value === 'true');
        }
      });
    } catch (error) {
      toast({
        title: "Error fetching settings",
        description: "Failed to load app settings",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      const priceInCents = Math.round(parseFloat(pricePerPhoto) * 100);
      
      const settingsToUpdate = [
        { key: 'price_per_extra_photo_cents', value: priceInCents.toString() },
        { key: 'watermark_text', value: watermarkText },
        { key: 'watermark_style', value: watermarkStyle },
        { key: 'center_watermark_text', value: centerWatermarkText },
        { key: 'admin_notification_email', value: adminEmail },
        { key: 'notifications_enabled', value: notificationsEnabled.toString() }
      ];

      for (const setting of settingsToUpdate) {
        const { error } = await supabase
          .from('app_settings')
          .upsert(setting, { onConflict: 'key' });

        if (error) throw error;
      }

      toast({
        title: "Settings saved",
        description: "All settings have been updated successfully",
      });
    } catch (error) {
      toast({
        title: "Error saving settings",
        description: "Failed to save settings",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const testStripeConnection = async () => {
    setTestingStripe(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-payment', {
        body: {
          galleryId: 'test-gallery-id',
          clientEmail: 'test@example.com',
          extraPhotosCount: 1
        }
      });
      
      if (error) throw error;
      
      if (data?.url) {
        setIsStripeConnected(true);
        await supabase
          .from('app_settings')
          .upsert({
            key: 'stripe_connected',
            value: 'true'
          }, { onConflict: 'key' });
        
        toast({
          title: "Stripe connected",
          description: "Stripe integration is working correctly",
        });
      } else {
        throw new Error('No checkout URL returned');
      }
    } catch (error: any) {
      setIsStripeConnected(false);
      await supabase
        .from('app_settings')
        .upsert({
          key: 'stripe_connected',
          value: 'false'
        }, { onConflict: 'key' });
      
      toast({
        title: "Stripe connection failed",
        description: error.message || "Please check your Stripe configuration",
        variant: "destructive"
      });
    } finally {
      setTestingStripe(false);
    }
  };

  const testNotification = async () => {
    if (!adminEmail) {
      toast({
        title: 'Admin email required',
        description: 'Please enter an email address before sending a test.',
        variant: 'destructive',
      });
      return;
    }

    setTestingNotification(true);
    toast({
      title: 'Sending test email...',
      description: `A test notification will be sent to ${adminEmail}.`,
    });

    try {
      await supabase
        .from('app_settings')
        .upsert({ key: 'admin_notification_email', value: adminEmail }, { onConflict: 'key' });
      
      await supabase
        .from('app_settings')
        .upsert({ key: 'notifications_enabled', value: notificationsEnabled.toString() }, { onConflict: 'key' });

      const { error } = await supabase.functions.invoke('send-admin-notification', {
        body: {
          galleryId: 'test-notification',
          clientEmail: `test-client-${Date.now()}@example.com`,
          clientName: 'Test Client',
          selectedPhotosCount: 3,
          extraPhotosCount: 1,
          totalCost: 5.0,
          galleryName: 'Test Gallery',
          accessCode: 'TESTCODE',
          selectedPhotos: [{ id: '1', filename: 'test-photo-1.jpg', title: 'Test Photo 1' }],
        },
      });

      if (error) throw error;

      toast({
        title: 'Test email sent!',
        description: 'Please check your inbox (and spam folder). It might take a minute to arrive.',
      });
    } catch (error: any) {
      toast({
        title: 'Failed to send test email',
        description:
          error.message ||
          'Please check your Resend configuration and the edge function logs for more details.',
        variant: 'destructive',
      });
    } finally {
      setTestingNotification(false);
    }
  };

  return {
    pricePerPhoto,
    setPricePerPhoto,
    isStripeConnected,
    watermarkText,
    setWatermarkText,
    watermarkStyle,
    setWatermarkStyle,
    centerWatermarkText,
    setCenterWatermarkText,
    adminEmail,
    setAdminEmail,
    notificationsEnabled,
    setNotificationsEnabled,
    loading,
    saving,
    testingStripe,
    testingNotification,
    saveSettings,
    testStripeConnection,
    testNotification,
  };
}
