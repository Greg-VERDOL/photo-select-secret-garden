
import React from 'react';
import { useTranslation } from 'react-i18next';

interface PricingInfoProps {
  freePhotoLimit: number;
  pricePerPhoto: number;
  selectedPhotosCount: number;
  extraPhotosCount: number;
  totalCost: number;
}

const PricingInfo: React.FC<PricingInfoProps> = ({
  freePhotoLimit,
  pricePerPhoto,
  selectedPhotosCount,
  extraPhotosCount,
  totalCost,
}) => {
  const { t } = useTranslation();
  return (
    <div className="bg-blue-50 p-4 rounded-lg">
      <h3 className="font-semibold text-blue-900 mb-2">{t('pricingInfo.title')}</h3>
      <div className="text-sm text-blue-800 space-y-1">
        <p>{t('pricingInfo.freePhotos', { count: freePhotoLimit })}</p>
        <p>{t('pricingInfo.pricePerExtra', { price: pricePerPhoto.toFixed(2) })}</p>
        <p>{t('pricingInfo.photosSelected', { count: selectedPhotosCount })}</p>
        {extraPhotosCount > 0 && (
          <p className="font-semibold">{t('pricingInfo.extraPhotos', { count: extraPhotosCount, cost: totalCost.toFixed(2) })}</p>
        )}
      </div>
    </div>
  );
};

export default PricingInfo;
