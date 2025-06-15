
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface GalleryInfo {
  name: string;
  access_code: string;
  client_name?: string;
}

export const useSelectionModalData = (isOpen: boolean, galleryId: string) => {
  const [pricePerPhoto, setPricePerPhoto] = useState(5.00);
  const [galleryInfo, setGalleryInfo] = useState<GalleryInfo | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch pricing
        const { data: pricingData, error: pricingError } = await supabase
          .from('app_settings')
          .select('value')
          .eq('key', 'price_per_extra_photo_cents')
          .single();

        if (!pricingError && pricingData) {
          const priceInEuros = parseInt(pricingData.value) / 100;
          setPricePerPhoto(priceInEuros);
        }

        // Fetch gallery info for notifications
        const { data: gallery, error: galleryError } = await supabase
          .from('galleries')
          .select('name, access_code, client_name')
          .eq('id', galleryId)
          .single();

        if (!galleryError && gallery) {
          setGalleryInfo(gallery);
        }
      } catch (error) {
        console.warn('Failed to fetch data:', error);
      }
    };

    if (isOpen) {
      fetchData();
    }
  }, [isOpen, galleryId]);

  return { pricePerPhoto, galleryInfo };
};
