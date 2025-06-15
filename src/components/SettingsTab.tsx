
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Settings } from 'lucide-react';
import WatermarkSettings from './settings/WatermarkSettings';
import PricingSettings from './settings/PricingSettings';
import StripeSettings from './settings/StripeSettings';

const SettingsTab: React.FC = () => {
  const [pricePerPhoto, setPricePerPhoto] = useState<string>('5.00');
  const [isStripeConnected, setIsStripeConnected] = useState(false);
  const [watermarkText, setWatermarkText] = useState<string>('© PHOTO STUDIO');
  const [watermarkStyle, setWatermarkStyle] = useState<string>('corners');
  const [centerWatermarkText, setCenterWatermarkText] = useState<string>('PROOF');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testingStripe, setTestingStripe] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('app_settings')
        .select('key, value')
        .in('key', ['price_per_extra_photo_cents', 'stripe_connected', 'watermark_text', 'watermark_style', 'center_watermark_text']);

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
        { key: 'center_watermark_text', value: centerWatermarkText }
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
      // Test Stripe connection by creating a simple test payment session
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
    } catch (error) {
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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-400">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-500 rounded-2xl flex items-center justify-center">
          <Settings className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-white">Settings</h1>
          <p className="text-slate-300">Configure your photo gallery pricing and integrations</p>
        </div>
      </div>

      {/* Watermark Settings */}
      <WatermarkSettings
        watermarkText={watermarkText}
        setWatermarkText={setWatermarkText}
        centerWatermarkText={centerWatermarkText}
        setCenterWatermarkText={setCenterWatermarkText}
        watermarkStyle={watermarkStyle}
        setWatermarkStyle={setWatermarkStyle}
      />

      {/* Pricing Settings */}
      <PricingSettings
        pricePerPhoto={pricePerPhoto}
        setPricePerPhoto={setPricePerPhoto}
      />

      {/* Stripe Integration */}
      <StripeSettings
        isStripeConnected={isStripeConnected}
        testingStripe={testingStripe}
        onTestConnection={testStripeConnection}
      />

      {/* Save Button */}
      <div className="flex justify-center">
        <Button
          onClick={saveSettings}
          disabled={saving}
          className="bg-blue-600 hover:bg-blue-700 px-8 py-3"
        >
          {saving ? 'Saving...' : 'Save All Settings'}
        </Button>
      </div>
    </div>
  );
};

export default SettingsTab;
