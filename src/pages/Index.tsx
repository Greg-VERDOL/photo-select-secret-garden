
import { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { Toaster } from "@/components/ui/toaster";
import { supabase } from '@/integrations/supabase/client';
import ClientGallery from '@/components/ClientGallery';
import AdminDashboard from '@/components/AdminDashboard';
import AdminLogin from '@/components/AdminLogin';
import ClientAccessForm from '@/components/ClientAccessForm';
import PaymentSuccess from '@/components/PaymentSuccess';
import PaymentCancelled from '@/components/PaymentCancelled';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { useTranslation } from 'react-i18next';

const Index = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const { t } = useTranslation();

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 flex items-center justify-center">
        <div className="text-white text-xl">{t('indexPage.loading')}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 relative">
      <div className="absolute top-4 right-4 z-50">
        <LanguageSwitcher />
      </div>
      <Routes>
        <Route path="/" element={<ClientAccessForm />} />
        <Route path="/gallery/:accessCode" element={<ClientGallery />} />
        <Route path="/gallery/payment-success" element={<PaymentSuccess />} />
        <Route path="/gallery/payment-cancelled" element={<PaymentCancelled />} />
        <Route 
          path="/admin" 
          element={
            user ? (
              <AdminDashboard onLogout={() => supabase.auth.signOut()} />
            ) : (
              <AdminLogin />
            )
          } 
        />
      </Routes>
      <Toaster />
    </div>
  );
};

export default Index;
