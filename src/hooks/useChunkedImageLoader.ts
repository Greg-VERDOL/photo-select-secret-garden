
import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { addWatermarks, addNoisePattern } from '@/utils/watermarkUtils';

interface UseChunkedImageLoaderProps {
  photoId: string;
  storagePath: string;
  galleryId: string;
  clientEmail: string;
  watermarkText: string;
  centerWatermarkText: string;
  watermarkStyle: string;
  generateSecureImageUrl: (photoId: string, storagePath: string) => Promise<string | null>;
  isSessionValid: boolean;
  enableChunkedDelivery?: boolean;
}

interface ChunkInfo {
  chunkTokens: string[];
  totalChunks: number;
  imageSize: number;
}

export const useChunkedImageLoader = ({
  photoId,
  storagePath,
  galleryId,
  clientEmail,
  watermarkText,
  centerWatermarkText,
  watermarkStyle,
  generateSecureImageUrl,
  isSessionValid,
  enableChunkedDelivery = true
}: UseChunkedImageLoaderProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [isProcessingChunks, setIsProcessingChunks] = useState(false);

  const loadChunkedImage = useCallback(async () => {
    console.log('🔄 Starting chunked image load for photo:', photoId);
    
    if (!isSessionValid) {
      console.log('❌ Session not valid for photo:', photoId);
      setLoadError('Session expired. Please refresh.');
      setIsLoading(false);
      return;
    }
    
    setIsLoading(true);
    setLoadError(null);
    setLoadingProgress(0);
    
    try {
      // Check if chunked delivery is enabled
      const { data: settings } = await supabase
        .from('app_settings')
        .select('value')
        .eq('key', 'chunk_delivery_enabled')
        .single();

      const chunkingEnabled = settings?.value === 'true' && enableChunkedDelivery;

      if (!chunkingEnabled) {
        // Fall back to regular image loading
        console.log('📷 Falling back to regular image loading for photo:', photoId);
        await loadRegularImage();
        return;
      }

      console.log('🔐 Generating secure URL for chunked processing:', photoId);
      const secureUrl = await generateSecureImageUrl(photoId, storagePath);
      
      if (!secureUrl) {
        console.error('❌ Failed to generate secure URL for photo:', photoId);
        throw new Error('Failed to generate secure URL');
      }

      // Process image into chunks
      const processUrl = `https://avmbtikrdufrrdpgrqgw.supabase.co/functions/v1/watermark-image-processor?action=process&token=${extractTokenFromUrl(secureUrl)}&photo_id=${photoId}`;
      console.log('🔄 Processing image into chunks:', photoId);

      const processResponse = await fetch(processUrl);
      if (!processResponse.ok) {
        throw new Error(`Failed to process image: ${processResponse.statusText}`);
      }

      const chunkInfo: ChunkInfo = await processResponse.json();
      console.log('✅ Image processed into', chunkInfo.totalChunks, 'chunks');

      // Load chunks
      setIsProcessingChunks(true);
      const chunks = await loadImageChunks(chunkInfo);
      
      // Reassemble image
      const completeImage = reassembleChunks(chunks);
      
      // Render to canvas
      await renderImageToCanvas(completeImage);
      
      console.log('✅ Chunked image loading complete for photo:', photoId);
      setIsLoading(false);
      setIsProcessingChunks(false);
    } catch (error) {
      console.error('❌ Error in loadChunkedImage for photo:', photoId, error);
      setLoadError(error instanceof Error ? error.message : 'Unknown error');
      setIsLoading(false);
      setIsProcessingChunks(false);
    }
  }, [photoId, storagePath, generateSecureImageUrl, isSessionValid, enableChunkedDelivery]);

  const loadImageChunks = async (chunkInfo: ChunkInfo): Promise<Uint8Array[]> => {
    const chunks: Uint8Array[] = new Array(chunkInfo.totalChunks);
    const chunkPromises: Promise<void>[] = [];

    for (let i = 0; i < chunkInfo.chunkTokens.length; i++) {
      const chunkToken = chunkInfo.chunkTokens[i];
      
      const chunkPromise = (async () => {
        try {
          const chunkUrl = `https://avmbtikrdufrrdpgrqgw.supabase.co/functions/v1/watermark-image-processor?action=chunk&chunk_token=${chunkToken}`;
          
          // Add random delay to prevent predictable patterns
          await new Promise(resolve => setTimeout(resolve, Math.random() * 1000));
          
          const response = await fetch(chunkUrl);
          if (!response.ok) {
            throw new Error(`Failed to load chunk ${i}: ${response.statusText}`);
          }
          
          const chunkData = await response.arrayBuffer();
          chunks[i] = new Uint8Array(chunkData);
          
          setLoadingProgress((i + 1) / chunkInfo.totalChunks * 100);
          console.log('📦 Loaded chunk', i + 1, 'of', chunkInfo.totalChunks);
        } catch (error) {
          console.error('❌ Failed to load chunk', i, error);
          throw error;
        }
      })();
      
      chunkPromises.push(chunkPromise);
    }

    await Promise.all(chunkPromises);
    return chunks;
  };

  const reassembleChunks = (chunks: Uint8Array[]): Uint8Array => {
    const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
    const reassembled = new Uint8Array(totalLength);
    
    let offset = 0;
    for (const chunk of chunks) {
      reassembled.set(chunk, offset);
      offset += chunk.length;
    }
    
    console.log('🔧 Reassembled', chunks.length, 'chunks into', totalLength, 'bytes');
    return reassembled;
  };

  const renderImageToCanvas = async (imageData: Uint8Array): Promise<void> => {
    const canvas = canvasRef.current;
    if (!canvas) {
      throw new Error('Canvas not available');
    }

    const blob = new Blob([imageData], { type: 'image/jpeg' });
    const imageUrl = URL.createObjectURL(blob);
    
    const img = new Image();
    
    return new Promise((resolve, reject) => {
      img.onload = () => {
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas context not available'));
          return;
        }

        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);

        // Add client-side watermarks for additional security
        addWatermarks(ctx, canvas.width, canvas.height, {
          watermarkText,
          centerWatermarkText,
          watermarkStyle,
          clientEmail
        });

        addNoisePattern(ctx, canvas.width, canvas.height);
        
        URL.revokeObjectURL(imageUrl);
        resolve();
      };

      img.onerror = () => {
        URL.revokeObjectURL(imageUrl);
        reject(new Error('Failed to load reassembled image'));
      };

      img.src = imageUrl;
    });
  };

  const loadRegularImage = async (): Promise<void> => {
    const secureUrl = await generateSecureImageUrl(photoId, storagePath);
    
    if (!secureUrl) {
      throw new Error('Failed to generate secure URL');
    }

    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    return new Promise((resolve, reject) => {
      img.onload = () => {
        const canvas = canvasRef.current;
        if (!canvas) {
          reject(new Error('Canvas not available'));
          return;
        }

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas context not available'));
          return;
        }

        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);

        addWatermarks(ctx, canvas.width, canvas.height, {
          watermarkText,
          centerWatermarkText,
          watermarkStyle,
          clientEmail
        });

        addNoisePattern(ctx, canvas.width, canvas.height);
        resolve();
      };

      img.onerror = reject;
      img.src = secureUrl;
    });
  };

  const extractTokenFromUrl = (url: string): string => {
    const urlObj = new URL(url);
    return urlObj.searchParams.get('token') || '';
  };

  useEffect(() => {
    loadChunkedImage();
  }, [loadChunkedImage]);

  return {
    canvasRef,
    isLoading,
    loadError,
    loadingProgress,
    isProcessingChunks
  };
};
