
import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Settings, DollarSign, CreditCard, CheckCircle, XCircle } from 'lucide-react';

const SettingsTab: React.FC = () => {
  const [pricePerPhoto, setPricePerPhoto] = useState<string>('5.00');
  const [isStripeConnected, setIsStripeConnected] = useState(false);
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
        .in('key', ['price_per_extra_photo_cents', 'stripe_connected']);

      if (error) throw error;

      data.forEach(setting => {
        if (setting.key === 'price_per_extra_photo_cents') {
          setPricePerPhoto((parseInt(setting.value) / 100).toFixed(2));
        } else if (setting.key === 'stripe_connected') {
          setIsStripeConnected(setting.value === 'true');
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
      
      const { error } = await supabase
        .from('app_settings')
        .upsert({
          key: 'price_per_extra_photo_cents',
          value: priceInCents.toString()
        }, { onConflict: 'key' });

      if (error) throw error;

      toast({
        title: "Settings saved",
        description: "Pricing settings have been updated successfully",
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

      {/* Pricing Settings */}
      <Card className="bg-white/5 border-white/10 backdrop-blur-xl rounded-2xl p-8">
        <div className="flex items-center space-x-3 mb-6">
          <DollarSign className="w-6 h-6 text-green-400" />
          <h2 className="text-xl font-semibold text-white">Pricing Configuration</h2>
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Price per Extra Photo (EUR)
            </label>
            <div className="flex items-center space-x-4">
              <div className="flex-1 max-w-xs">
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400">€</span>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={pricePerPhoto}
                    onChange={(e) => setPricePerPhoto(e.target.value)}
                    className="bg-slate-700 border-slate-600 text-white pl-8"
                    placeholder="5.00"
                  />
                </div>
              </div>
              <Button
                onClick={saveSettings}
                disabled={saving}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {saving ? 'Saving...' : 'Save'}
              </Button>
            </div>
            <p className="text-sm text-slate-400 mt-2">
              Clients will be charged this amount in EUR for each photo selected beyond their free limit
            </p>
          </div>
        </div>
      </Card>

      {/* Stripe Integration */}
      <Card className="bg-white/5 border-white/10 backdrop-blur-xl rounded-2xl p-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <CreditCard className="w-6 h-6 text-blue-400" />
            <h2 className="text-xl font-semibold text-white">Stripe Integration</h2>
          </div>
          <div className="flex items-center space-x-2">
            {isStripeConnected ? (
              <CheckCircle className="w-5 h-5 text-green-400" />
            ) : (
              <XCircle className="w-5 h-5 text-red-400" />
            )}
            <span className={`text-sm font-medium ${isStripeConnected ? 'text-green-400' : 'text-red-400'}`}>
              {isStripeConnected ? 'Connected' : 'Not Connected'}
            </span>
          </div>
        </div>
        
        <div className="space-y-4">
          <p className="text-slate-300">
            Stripe is used to process payments in EUR when clients select more photos than their free limit.
            Make sure your Stripe secret key is configured in the edge function secrets.
          </p>
          
          <Button
            onClick={testStripeConnection}
            disabled={testingStripe}
            variant="outline"
            className="border-slate-600 text-slate-300 hover:bg-slate-700"
          >
            {testingStripe ? 'Testing...' : 'Test Stripe Connection'}
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default SettingsTab;
