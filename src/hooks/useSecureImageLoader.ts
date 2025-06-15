
import { useState, useEffect, useCallback, useRef } from 'react';
import { addWatermarks, addNoisePattern } from '@/utils/watermarkUtils';

interface UseSecureImageLoaderProps {
  photoId: string;
  storagePath: string;
  galleryId: string;
  clientEmail: string;
  watermarkText: string;
  centerWatermarkText: string;
  watermarkStyle: string;
  generateSecureImageUrl: (photoId: string, storagePath: string) => Promise<string | null>;
  isSessionValid: boolean;
}

export const useSecureImageLoader = ({
  photoId,
  storagePath,
  galleryId,
  clientEmail,
  watermarkText,
  centerWatermarkText,
  watermarkStyle,
  generateSecureImageUrl,
  isSessionValid
}: UseSecureImageLoaderProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const loadSecureImage = useCallback(async () => {
    if (!isSessionValid) {
      console.log('Session not valid for photo:', photoId);
      return;
    }
    
    setIsLoading(true);
    setLoadError(null);
    
    try {
      console.log('Loading secure image for photo:', photoId);
      const secureUrl = await generateSecureImageUrl(photoId, storagePath);
      
      if (!secureUrl) {
        throw new Error('Failed to generate secure URL');
      }

      console.log('Generated secure URL for photo:', photoId, secureUrl);

      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      img.onload = () => {
        console.log('Image loaded successfully for photo:', photoId);
        const canvas = canvasRef.current;
        if (!canvas) {
          console.error('Canvas not available');
          return;
        }

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          console.error('Canvas context not available');
          return;
        }

        // Set canvas size
        canvas.width = img.width;
        canvas.height = img.height;

        // Draw image
        ctx.drawImage(img, 0, 0);

        // Add dynamic watermarks
        addWatermarks(ctx, canvas.width, canvas.height, {
          watermarkText,
          centerWatermarkText,
          watermarkStyle,
          clientEmail
        });

        // Add noise pattern to make reverse engineering harder
        addNoisePattern(ctx, canvas.width, canvas.height);

        setIsLoading(false);
      };

      img.onerror = (error) => {
        console.error('Failed to load secure image for photo:', photoId, error);
        setLoadError('Failed to load image');
        setIsLoading(false);
      };

      img.src = secureUrl;
    } catch (error) {
      console.error('Error loading secure image for photo:', photoId, error);
      setLoadError(error instanceof Error ? error.message : 'Unknown error');
      setIsLoading(false);
    }
  }, [photoId, storagePath, generateSecureImageUrl, isSessionValid, watermarkText, centerWatermarkText, watermarkStyle, clientEmail]);

  useEffect(() => {
    loadSecureImage();
  }, [loadSecureImage]);

  return {
    canvasRef,
    isLoading,
    loadError
  };
};
