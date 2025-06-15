
import React from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Image } from 'lucide-react';

interface WatermarkSettingsProps {
  watermarkText: string;
  setWatermarkText: (value: string) => void;
  centerWatermarkText: string;
  setCenterWatermarkText: (value: string) => void;
  watermarkStyle: string;
  setWatermarkStyle: (value: string) => void;
}

const WatermarkSettings: React.FC<WatermarkSettingsProps> = ({
  watermarkText,
  setWatermarkText,
  centerWatermarkText,
  setCenterWatermarkText,
  watermarkStyle,
  setWatermarkStyle,
}) => {
  return (
    <Card className="bg-white/5 border-white/10 backdrop-blur-xl rounded-2xl p-8">
      <div className="flex items-center space-x-3 mb-6">
        <Image className="w-6 h-6 text-purple-400" />
        <h2 className="text-xl font-semibold text-white">Watermark Configuration</h2>
      </div>
      
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Corner Watermark Text
          </label>
          <Input
            type="text"
            value={watermarkText}
            onChange={(e) => setWatermarkText(e.target.value)}
            className="bg-slate-700 border-slate-600 text-white"
            placeholder="© PHOTO STUDIO"
          />
          <p className="text-sm text-slate-400 mt-2">
            This text will appear in the corners of gallery images
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Center Watermark Text
          </label>
          <Input
            type="text"
            value={centerWatermarkText}
            onChange={(e) => setCenterWatermarkText(e.target.value)}
            className="bg-slate-700 border-slate-600 text-white"
            placeholder="PROOF"
          />
          <p className="text-sm text-slate-400 mt-2">
            This text will appear in the center of gallery images when center watermark is enabled
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Watermark Style
          </label>
          <select
            value={watermarkStyle}
            onChange={(e) => setWatermarkStyle(e.target.value)}
            className="w-full h-10 px-3 py-2 rounded-md border border-slate-600 bg-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="corners">Corners Only</option>
            <option value="center">Center Only</option>
            <option value="full">Full (Corners + Center)</option>
            <option value="none">No Watermark</option>
          </select>
          <p className="text-sm text-slate-400 mt-2">
            Choose how the watermark appears on images
          </p>
        </div>
      </div>
    </Card>
  );
};

export default WatermarkSettings;
