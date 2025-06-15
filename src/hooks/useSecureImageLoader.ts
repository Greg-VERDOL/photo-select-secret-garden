
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
    console.log('🔄 Starting image load for photo:', photoId);
    
    if (!isSessionValid) {
      console.log('❌ Session not valid for photo:', photoId);
      setLoadError('Session expired. Please refresh.');
      setIsLoading(false);
      return;
    }
    
    setIsLoading(true);
    setLoadError(null);
    
    try {
      console.log('🔐 Generating secure URL for photo:', photoId);
      const secureUrl = await generateSecureImageUrl(photoId, storagePath);
      
      if (!secureUrl) {
        console.error('❌ Failed to generate secure URL for photo:', photoId);
        throw new Error('Failed to generate secure URL');
      }

      console.log('✅ Generated secure URL for photo:', photoId, secureUrl.substring(0, 100) + '...');

      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      img.onload = () => {
        console.log('✅ Image loaded successfully for photo:', photoId, 'Size:', img.width, 'x', img.height);
        const canvas = canvasRef.current;
        if (!canvas) {
          console.error('❌ Canvas not available for photo:', photoId);
          setLoadError('Canvas not available');
          setIsLoading(false);
          return;
        }

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          console.error('❌ Canvas context not available for photo:', photoId);
          setLoadError('Canvas context not available');
          setIsLoading(false);
          return;
        }

        // Set canvas size
        canvas.width = img.width;
        canvas.height = img.height;

        // Draw image
        ctx.drawImage(img, 0, 0);

        // Add dynamic watermarks
        console.log('🎨 Adding watermarks to photo:', photoId);
        addWatermarks(ctx, canvas.width, canvas.height, {
          watermarkText,
          centerWatermarkText,
          watermarkStyle,
          clientEmail
        });

        // Add noise pattern to make reverse engineering harder
        addNoisePattern(ctx, canvas.width, canvas.height);

        console.log('✅ Image processing complete for photo:', photoId);
        setIsLoading(false);
      };

      img.onerror = (error) => {
        console.error('❌ Failed to load secure image for photo:', photoId, error);
        console.error('Image URL:', secureUrl);
        setLoadError('Failed to load image');
        setIsLoading(false);
      };

      console.log('📡 Starting image download for photo:', photoId);
      img.src = secureUrl;
    } catch (error) {
      console.error('❌ Error in loadSecureImage for photo:', photoId, error);
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
