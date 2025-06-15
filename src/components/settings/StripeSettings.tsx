
import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CreditCard, CheckCircle, XCircle } from 'lucide-react';

interface StripeSettingsProps {
  isStripeConnected: boolean;
  testingStripe: boolean;
  onTestConnection: () => void;
}

const StripeSettings: React.FC<StripeSettingsProps> = ({
  isStripeConnected,
  testingStripe,
  onTestConnection,
}) => {
  return (
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
          onClick={onTestConnection}
          disabled={testingStripe}
          variant="outline"
          className="border-slate-600 text-slate-300 hover:bg-slate-700"
        >
          {testingStripe ? 'Testing...' : 'Test Stripe Connection'}
        </Button>
      </div>
    </Card>
  );
};

export default StripeSettings;
