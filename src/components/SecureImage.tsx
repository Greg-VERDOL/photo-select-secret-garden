
import React from 'react';
import { cn } from '@/lib/utils';
import { useSecureViewing } from '@/hooks/useSecureViewing';
import { useSecurityEvents } from '@/hooks/useSecurityEvents';
import { useSecureImageLoader } from '@/hooks/useSecureImageLoader';

interface SecureImageProps {
  photoId: string;
  storagePath: string;
  alt: string;
  className?: string;
  galleryId: string;
  clientEmail: string;
  onClick?: () => void;
  watermarkText?: string;
  centerWatermarkText?: string;
  watermarkStyle?: string;
}

const SecureImage: React.FC<SecureImageProps> = ({
  photoId,
  storagePath,
  alt,
  className,
  galleryId,
  clientEmail,
  onClick,
  watermarkText = '© PHOTO STUDIO',
  centerWatermarkText = 'PROOF',
  watermarkStyle = 'corners'
}) => {
  const { generateSecureImageUrl, logDownloadAttempt, isSessionValid } = useSecureViewing(galleryId, clientEmail);
  
  // Set up security event listeners
  useSecurityEvents({ photoId, logDownloadAttempt });
  
  // Load and render the secure image
  const { canvasRef, isLoading, loadError } = useSecureImageLoader({
    photoId,
    storagePath,
    galleryId,
    clientEmail,
    watermarkText,
    centerWatermarkText,
    watermarkStyle,
    generateSecureImageUrl,
    isSessionValid
  });

  const handleCanvasClick = () => {
    if (onClick) {
      onClick();
    }
  };

  if (!isSessionValid) {
    return (
      <div className={cn("bg-slate-800 rounded-lg flex items-center justify-center", className)}>
        <p className="text-white text-sm">Session expired. Please refresh.</p>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className={cn("bg-red-900/20 rounded-lg flex items-center justify-center border border-red-500/20", className)}>
        <p className="text-red-300 text-sm">{loadError}</p>
      </div>
    );
  }

  return (
    <div className={cn("relative inline-block", className)}>
      <canvas
        ref={canvasRef}
        onClick={handleCanvasClick}
        className={cn(
          "block cursor-pointer transition-all duration-300 max-w-full h-auto",
          isLoading && "opacity-50"
        )}
        style={{
          userSelect: 'none',
          WebkitUserSelect: 'none',
          MozUserSelect: 'none',
          msUserSelect: 'none',
          pointerEvents: isLoading ? 'none' : 'auto'
        }}
      />
      
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-800/50 rounded-lg">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}

      {/* Anti-screenshot overlay */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-5"
        style={{
          backgroundImage: `repeating-linear-gradient(
            45deg,
            transparent,
            transparent 10px,
            rgba(255,255,255,0.1) 10px,
            rgba(255,255,255,0.1) 20px
          )`
        }}
      />
    </div>
  );
};

export default SecureImage;
