
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Key, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

const ClientAccessForm: React.FC = () => {
  const [accessCode, setAccessCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessCode.trim()) return;

    setIsLoading(true);

    try {
      const { data, error } = await supabase
        .from('galleries')
        .select('id, name, client_name')
        .eq('access_code', accessCode.toUpperCase())
        .single();

      if (error || !data) {
        toast({
          title: "Invalid access code",
          description: "Please check your access code and try again.",
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "Access granted!",
        description: `Welcome to ${data.name} gallery.`,
      });

      navigate(`/gallery/${accessCode.toUpperCase()}`);
    } catch (error) {
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-full max-w-md"
      >
        <Card className="p-8 bg-white/10 border-white/20 backdrop-blur-sm">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600/20 rounded-full mb-4">
              <Key className="w-8 h-8 text-blue-400" />
            </div>
            <h1 className="text-2xl font-bold text-white">Access Your Gallery</h1>
            <p className="text-slate-300 mt-2">Enter your access code to view your photos</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Access Code
              </label>
              <Input
                type="text"
                value={accessCode}
                onChange={(e) => setAccessCode(e.target.value.toUpperCase())}
                placeholder="Enter your 8-character code"
                className="bg-slate-700/50 border-slate-600 text-white text-center text-lg tracking-widest"
                maxLength={8}
                required
              />
            </div>

            <Button
              type="submit"
              disabled={isLoading || accessCode.length !== 8}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transition-all duration-300"
            >
              {isLoading ? 'Verifying...' : 'Access Gallery'}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-sm text-slate-400">
              Don't have an access code?{' '}
              <span className="text-blue-400">Contact your photographer</span>
            </p>
          </div>
        </Card>
      </motion.div>
    </div>
  );
};

export default ClientAccessForm;
