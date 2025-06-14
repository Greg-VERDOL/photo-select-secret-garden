
import React from 'react';

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
  return (
    <div className="bg-blue-50 p-4 rounded-lg">
      <h3 className="font-semibold text-blue-900 mb-2">Pricing Information</h3>
      <div className="text-sm text-blue-800 space-y-1">
        <p>• Free photos included: {freePhotoLimit}</p>
        <p>• Price per extra photo: €{pricePerPhoto.toFixed(2)}</p>
        <p>• Photos selected: {selectedPhotosCount}</p>
        {extraPhotosCount > 0 && (
          <p className="font-semibold">• Extra photos: {extraPhotosCount} (€{totalCost.toFixed(2)})</p>
        )}
      </div>
    </div>
  );
};

export default PricingInfo;
