
import React from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { DollarSign } from 'lucide-react';

interface PricingSettingsProps {
  pricePerPhoto: string;
  setPricePerPhoto: (value: string) => void;
}

const PricingSettings: React.FC<PricingSettingsProps> = ({
  pricePerPhoto,
  setPricePerPhoto,
}) => {
  return (
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
          </div>
          <p className="text-sm text-slate-400 mt-2">
            Clients will be charged this amount in EUR for each photo selected beyond their free limit
          </p>
        </div>
      </div>
    </Card>
  );
};

export default PricingSettings;
