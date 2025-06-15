
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface NotificationSettingsProps {
  adminEmail: string;
  setAdminEmail: (email: string) => void;
  notificationsEnabled: boolean;
  setNotificationsEnabled: (enabled: boolean) => void;
  onTestNotification: () => void;
  isTestingNotification: boolean;
}

const NotificationSettings: React.FC<NotificationSettingsProps> = ({
  adminEmail,
  setAdminEmail,
  notificationsEnabled,
  setNotificationsEnabled,
  onTestNotification,
  isTestingNotification,
}) => {
  const { t } = useTranslation();

  return (
    <Card className="bg-white/5 border-white/10 backdrop-blur-xl rounded-2xl p-6">
      <div className="flex items-center space-x-4 mb-6">
        <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-blue-500 rounded-2xl flex items-center justify-center">
          <Mail className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-white">Email Notifications</h2>
          <p className="text-slate-300">Configure admin email notifications for client actions</p>
        </div>
      </div>

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Label htmlFor="notifications-enabled" className="text-white font-medium">
              Enable Notifications
            </Label>
            <p className="text-sm text-slate-400">
              Receive email notifications when clients submit photo selections
            </p>
          </div>
          <Switch
            id="notifications-enabled"
            checked={notificationsEnabled}
            onCheckedChange={setNotificationsEnabled}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="admin-email" className="text-white font-medium">
            Admin Email Address
          </Label>
          <div className="flex items-center space-x-2">
            <Input
              id="admin-email"
              type="email"
              value={adminEmail}
              onChange={(e) => setAdminEmail(e.target.value)}
              placeholder="admin@yourdomain.com"
              className="bg-slate-700 border-slate-600 text-white placeholder-slate-400 flex-grow"
              disabled={!notificationsEnabled}
            />
            <Button
              onClick={onTestNotification}
              disabled={!notificationsEnabled || isTestingNotification}
              variant="outline"
              className="border-slate-600 text-slate-300 hover:bg-slate-700"
            >
              {isTestingNotification ? 'Sending...' : 'Send Test'}
            </Button>
          </div>
          <p className="text-sm text-slate-400">
            This email will receive notifications about client photo selections
          </p>
        </div>
      </div>
    </Card>
  );
};

export default NotificationSettings;
