
import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface ClientInfoFormProps {
  email: string;
  message: string;
  onEmailChange: (email: string) => void;
  onMessageChange: (message: string) => void;
}

const ClientInfoForm: React.FC<ClientInfoFormProps> = ({
  email,
  message,
  onEmailChange,
  onMessageChange,
}) => {
  return (
    <div className="space-y-4 bg-slate-700/30 p-4 rounded-lg">
      <h3 className="text-lg font-semibold">Your Information</h3>
      
      <div className="grid grid-cols-1 gap-4">
        <div>
          <Label htmlFor="email" className="text-slate-300">Email Address *</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => onEmailChange(e.target.value)}
            placeholder="your.email@example.com"
            className="bg-slate-700 border-slate-600 text-white"
            required
          />
        </div>
        
        <div>
          <Label htmlFor="message" className="text-slate-300">Message (optional)</Label>
          <Textarea
            id="message"
            value={message}
            onChange={(e) => onMessageChange(e.target.value)}
            placeholder="Any special requests or notes..."
            className="bg-slate-700 border-slate-600 text-white"
            rows={3}
          />
        </div>
      </div>
    </div>
  );
};

export default ClientInfoForm;
