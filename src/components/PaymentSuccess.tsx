
import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { CheckCircle, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

const PaymentSuccess: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [paymentDetails, setPaymentDetails] = useState<any>(null);
  const [selectionsSaved, setSelectionsSaved] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const sessionId = searchParams.get('session_id');
    console.log('PaymentSuccess loaded with session_id:', sessionId);
    
    if (sessionId) {
      verifyPaymentAndCompleteSelection(sessionId);
    } else {
      // Check for pending selections even without session ID
      completePendingSelections();
    }
  }, [searchParams]);

  const savePendingSelections = async (pendingData: any) => {
    const { galleryId, clientEmail, selectedPhotos } = pendingData;
    
    console.log('Saving pending selections after payment:', { galleryId, clientEmail, selectedPhotos: selectedPhotos?.length });
    
    if (!clientEmail || !galleryId || !selectedPhotos || selectedPhotos.length === 0) {
      console.error('Invalid pending selection data');
      return false;
    }

    try {
      // Delete existing selections for this client and gallery to avoid duplicates
      const { error: deleteError } = await supabase
        .from('photo_selections')
        .delete()
        .eq('gallery_id', galleryId)
        .eq('client_email', clientEmail.trim());

      if (deleteError) {
        console.error('Error deleting existing selections:', deleteError);
        // Continue anyway, as this might just mean no existing selections
      }

      // Insert new selections
      const selections = selectedPhotos.map(photoId => ({
        gallery_id: galleryId,
        photo_id: photoId,
        client_email: clientEmail.trim(),
      }));

      console.log('Inserting selections after payment:', selections);
      const { error: insertError } = await supabase
        .from('photo_selections')
        .insert(selections);

      if (insertError) {
        console.error('Error inserting selections after payment:', insertError);
        throw insertError;
      }

      console.log('Successfully saved selections after payment:', selections.length);
      setSelectionsSaved(true);
      
      // Store completion confirmation
      const completedSelections = {
        ...pendingData,
        completed: true,
        completedAt: Date.now()
      };
      localStorage.setItem('completedSelections', JSON.stringify(completedSelections));
      
      return true;
    } catch (error) {
      console.error('Error saving selections after payment:', error);
      return false;
    }
  };

  const completePendingSelections = async () => {
    try {
      const pendingData = localStorage.getItem('pendingSelections');
      console.log('Checking for pending selections:', pendingData);
      
      if (pendingData) {
        const parsed = JSON.parse(pendingData);
        const { timestamp } = parsed;
        
        // Check if data is not too old (within 1 hour)
        const isRecent = Date.now() - timestamp < 3600000;
        if (!isRecent) {
          console.log('Pending selections too old, clearing...');
          localStorage.removeItem('pendingSelections');
          setLoading(false);
          return;
        }
        
        const success = await savePendingSelections(parsed);
        
        if (success) {
          // Clear pending data only after successful save
          localStorage.removeItem('pendingSelections');
          
          toast({
            title: "Payment successful!",
            description: `Your ${parsed.selectedPhotos.length} photo selection(s) have been completed.`,
          });
        } else {
          toast({
            title: "Payment successful, but...",
            description: "There was an issue saving your selections. Please contact us.",
            variant: "destructive"
          });
        }
      }
    } catch (error) {
      console.error('Error completing pending selections:', error);
      toast({
        title: "Error processing selections",
        description: "Please contact us if your selections weren't processed.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const verifyPaymentAndCompleteSelection = async (sessionId: string) => {
    try {
      console.log('Verifying payment with session ID:', sessionId);
      
      // Verify payment with Stripe
      const { data: paymentData, error: paymentError } = await supabase.functions.invoke('verify-payment', {
        body: { sessionId }
      });

      if (paymentError) {
        console.error('Payment verification error:', paymentError);
        throw paymentError;
      }

      console.log('Payment verification result:', paymentData);
      setPaymentDetails(paymentData);

      // Complete the photo selections if payment was successful
      if (paymentData.status === 'completed' || paymentData.payment_status === 'paid') {
        console.log('Payment successful, completing selections...');
        await completePendingSelections();
      } else {
        console.log('Payment not completed, status:', paymentData.status, paymentData.payment_status);
        toast({
          title: "Payment verification failed",
          description: "Please contact us if you were charged.",
          variant: "destructive"
        });
        setLoading(false);
      }
    } catch (error) {
      console.error('Error verifying payment:', error);
      toast({
        title: "Error verifying payment",
        description: "Please contact us if you were charged but your selection wasn't processed.",
        variant: "destructive"
      });
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white">Processing your payment and selections...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 flex items-center justify-center p-4">
      <Card className="bg-white/10 border-white/20 backdrop-blur-xl rounded-2xl p-8 max-w-md w-full text-center">
        <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-8 h-8 text-white" />
        </div>
        
        <h1 className="text-2xl font-bold text-white mb-4">
          {paymentDetails ? 'Payment Successful!' : 'Selection Complete!'}
        </h1>
        
        <p className="text-slate-300 mb-6">
          {paymentDetails 
            ? 'Thank you for your payment. Your photo selection has been processed and we\'ll be in touch soon.'
            : selectionsSaved 
              ? 'Your photo selection has been completed successfully.'
              : 'Your request has been processed.'
          }
        </p>

        {paymentDetails && (
          <div className="bg-slate-800/50 rounded-lg p-4 mb-6 text-left">
            <h3 className="font-semibold text-white mb-2">Payment Details</h3>
            <p className="text-sm text-slate-300">
              Amount: €{(paymentDetails.amount_total / 100).toFixed(2)}
            </p>
            <p className="text-sm text-slate-300">
              Status: {paymentDetails.payment_status}
            </p>
          </div>
        )}

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

export default PaymentSuccess;
