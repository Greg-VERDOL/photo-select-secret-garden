
import React from 'react';
import { Button } from '@/components/ui/button';
import { Settings } from 'lucide-react';
import WatermarkSettings from './settings/WatermarkSettings';
import PricingSettings from './settings/PricingSettings';
import StripeSettings from './settings/StripeSettings';
import NotificationSettings from './settings/NotificationSettings';
import { useSettings } from '@/hooks/useSettings';

const SettingsTab: React.FC = () => {
  const {
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
  } = useSettings();

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
          <p className="text-slate-300">Configure your photo gallery pricing, integrations, and notifications</p>
        </div>
      </div>

      {/* Notification Settings */}
      <NotificationSettings
        adminEmail={adminEmail}
        setAdminEmail={setAdminEmail}
        notificationsEnabled={notificationsEnabled}
        setNotificationsEnabled={setNotificationsEnabled}
        onTestNotification={testNotification}
        isTestingNotification={testingNotification}
      />

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
