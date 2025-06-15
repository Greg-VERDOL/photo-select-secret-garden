
import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Mail, User, Calendar } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface Customer {
  id: string;
  client_name: string;
  client_email: string;
  created_at: string;
  gallery_count: number;
}

const CustomersTab: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { t } = useTranslation();

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      const { data, error } = await supabase
        .from('galleries')
        .select('id, client_name, client_email, created_at')
        .not('client_name', 'is', null)
        .not('client_email', 'is', null)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Group by client email and count galleries
      const customerMap = new Map();
      data.forEach(gallery => {
        const key = gallery.client_email;
        if (customerMap.has(key)) {
          customerMap.get(key).gallery_count++;
        } else {
          customerMap.set(key, {
            id: gallery.id,
            client_name: gallery.client_name,
            client_email: gallery.client_email,
            created_at: gallery.created_at,
            gallery_count: 1
          });
        }
      });

      setCustomers(Array.from(customerMap.values()));
    } catch (error) {
      toast({
        title: t('customersTab.errorFetching'),
        description: t('customersTab.errorFetchingDescription'),
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-white">{t('customersTab.loading')}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">{t('customersTab.title')}</h2>
        <p className="text-slate-400">{t('customersTab.subtitle')}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {customers.map((customer) => (
          <Card key={customer.client_email} className="p-6 bg-white/5 border-white/10">
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-white">{customer.client_name}</h3>
                  <p className="text-sm text-slate-400">{t('customersTab.galleryCount', { count: customer.gallery_count })}</p>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center space-x-2 text-sm text-slate-300">
                  <Mail className="w-4 h-4" />
                  <span>{customer.client_email}</span>
                </div>
                <div className="flex items-center space-x-2 text-sm text-slate-300">
                  <Calendar className="w-4 h-4" />
                  <span>{t('customersTab.clientSince', { date: new Date(customer.created_at).toLocaleDateString() })}</span>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {customers.length === 0 && (
        <Card className="p-12 bg-white/5 border-white/10 text-center">
          <User className="w-16 h-16 mx-auto mb-4 text-slate-400" />
          <h3 className="text-xl font-semibold mb-2 text-white">{t('customersTab.noCustomers')}</h3>
          <p className="text-slate-400">{t('customersTab.noCustomersDescription')}</p>
        </Card>
      )}
    </div>
  );
};

export default CustomersTab;
