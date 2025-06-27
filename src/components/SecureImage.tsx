
import React from 'react';
import WatermarkedImage from './WatermarkedImage';

interface SecureImageProps {
  photoId: string;
  storagePath: string;
  alt: string;
  className?: string;
  onClick?: () => void;
  fitContainer?: boolean;
  galleryId: string;
  clientEmail: string;
}

const SecureImage: React.FC<SecureImageProps> = ({
  photoId,
  storagePath,
  alt,
  className,
  onClick,
  fitContainer = false,
  galleryId,
  clientEmail
}) => {
  return (
    <WatermarkedImage
      src={storagePath}
      alt={alt}
      className={className}
      onClick={onClick}
      fitContainer={fitContainer}
      showWatermark={true}
      isAdminView={false}
      photoId={photoId}
      galleryId={galleryId}
      clientEmail={clientEmail}
    />
  );
};

export default SecureImage;
