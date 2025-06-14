
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { XCircle, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

const PaymentCancelled: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 flex items-center justify-center p-4">
      <Card className="bg-white/10 border-white/20 backdrop-blur-xl rounded-2xl p-8 max-w-md w-full text-center">
        <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
          <XCircle className="w-8 h-8 text-white" />
        </div>
        
        <h1 className="text-2xl font-bold text-white mb-4">Payment Cancelled</h1>
        
        <p className="text-slate-300 mb-6">
          Your payment was cancelled. No charges were made to your account. You can try again anytime.
        </p>

        <Button
          onClick={() => navigate('/')}
          className="bg-blue-600 hover:bg-blue-700 w-full"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Home
        </Button>
      </Card>
    </div>
  );
};

export default PaymentCancelled;
