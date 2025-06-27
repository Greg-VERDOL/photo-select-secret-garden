
import React, { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { addWatermarks, addNoisePattern } from '@/utils/watermarkUtils';
import { useChunkedImageLoader } from '@/hooks/useChunkedImageLoader';
import { useSecureViewing } from '@/hooks/useSecureViewing';

interface WatermarkedImageProps {
  src: string;
  alt: string;
  className?: string;
  onClick?: () => void;
  fitContainer?: boolean;
  showWatermark?: boolean;
  isAdminView?: boolean;
  photoId?: string;
  galleryId?: string;
  clientEmail?: string;
}

const WatermarkedImage: React.FC<WatermarkedImageProps> = ({ 
  src, 
  alt, 
  className, 
  onClick, 
  fitContainer = false,
  showWatermark = true,
  isAdminView = false,
  photoId,
  galleryId,
  clientEmail = 'anonymous'
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [watermarkText, setWatermarkText] = useState('© PHOTO STUDIO');
  const [watermarkStyle, setWatermarkStyle] = useState('corners');
  const [centerWatermarkText, setCenterWatermarkText] = useState('PROOF');
  const [settingsLoaded, setSettingsLoaded] = useState(false);
  const [useChunkedDelivery, setUseChunkedDelivery] = useState(false);

  // Initialize secure viewing for chunked delivery
  const { generateSecureImageUrl, isSessionValid } = useSecureViewing(
    galleryId || '',
    clientEmail
  );

  // Use chunked image loader when available
  const {
    canvasRef: chunkedCanvasRef,
    isLoading: chunkedLoading,
    loadError: chunkedError,
    loadingProgress,
    isProcessingChunks
  } = useChunkedImageLoader({
    photoId: photoId || '',
    storagePath: src,
    galleryId: galleryId || '',
    clientEmail,
    watermarkText,
    centerWatermarkText,
    watermarkStyle,
    generateSecureImageUrl,
    isSessionValid,
    enableChunkedDelivery: useChunkedDelivery && !!photoId && !!galleryId
  });

  // Fallback canvas for regular loading
  const fallbackCanvasRef = useRef<HTMLCanvasElement>(null);
  const [fallbackLoading, setFallbackLoading] = useState(true);

  useEffect(() => {
    if (showWatermark && !isAdminView) {
      fetchWatermarkSettings();
    } else {
      setSettingsLoaded(true);
    }
  }, [showWatermark, isAdminView]);

  const fetchWatermarkSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('app_settings')
        .select('key, value')
        .in('key', ['watermark_text', 'watermark_style', 'center_watermark_text', 'chunk_delivery_enabled']);

      if (error) {
        console.warn('Could not fetch watermark settings, using defaults:', error);
        setSettingsLoaded(true);
        return;
      }

      if (data) {
        data.forEach(setting => {
          if (setting.key === 'watermark_text') {
            setWatermarkText(setting.value || '© PHOTO STUDIO');
          } else if (setting.key === 'watermark_style') {
            setWatermarkStyle(setting.value || 'corners');
          } else if (setting.key === 'center_watermark_text') {
            setCenterWatermarkText(setting.value || 'PROOF');
          } else if (setting.key === 'chunk_delivery_enabled') {
            setUseChunkedDelivery(setting.value === 'true');
          }
        });
      }
    } catch (error) {
      console.warn('Error fetching watermark settings, using defaults:', error);
    } finally {
      setSettingsLoaded(true);
    }
  };

  const shouldShowWatermark = showWatermark && !isAdminView;
  const shouldUseChunkedDelivery = useChunkedDelivery && !!photoId && !!galleryId && settingsLoaded;

  // Regular image loading for fallback
  useEffect(() => {
    if (shouldUseChunkedDelivery || !settingsLoaded) return;

    const canvas = fallbackCanvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container || !src) return;

    let img: HTMLImageElement;

    const draw = () => {
      if (!img || img.naturalWidth === 0) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const containerWidth = container.offsetWidth;
      const containerHeight = container.offsetHeight;
      
      if (containerWidth === 0 || containerHeight === 0) return;

      canvas.width = containerWidth;
      canvas.height = containerHeight;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      let scale = 1;
      if (fitContainer) {
        scale = Math.max(canvas.width / img.naturalWidth, canvas.height / img.naturalHeight);
      } else {
        scale = Math.min(canvas.width / img.naturalWidth, canvas.height / img.naturalHeight);
      }
      
      const scaledWidth = img.naturalWidth * scale;
      const scaledHeight = img.naturalHeight * scale;
      
      const x = (canvas.width - scaledWidth) / 2;
      const y = (canvas.height - scaledHeight) / 2;

      ctx.drawImage(img, x, y, scaledWidth, scaledHeight);
      
      if (shouldShowWatermark) {
        addWatermarks(ctx, canvas.width, canvas.height, {
          watermarkText,
          centerWatermarkText,
          watermarkStyle,
        });
        addNoisePattern(ctx, canvas.width, canvas.height);
      }
      setFallbackLoading(false);
    };

    setFallbackLoading(true);
    img = new Image();
    img.crossOrigin = "Anonymous";
    img.src = src;
    img.onload = draw;
    img.onerror = () => {
      setFallbackLoading(false);
      console.error(`Failed to load image: ${src}`);
    };

    const resizeObserver = new ResizeObserver(draw);
    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
    };
  }, [src, settingsLoaded, fitContainer, shouldShowWatermark, shouldUseChunkedDelivery, watermarkText, watermarkStyle, centerWatermarkText]);

  const isLoading = shouldUseChunkedDelivery ? chunkedLoading : fallbackLoading;
  const currentError = shouldUseChunkedDelivery ? chunkedError : null;
  const currentCanvasRef = shouldUseChunkedDelivery ? chunkedCanvasRef : fallbackCanvasRef;

  return (
    <div ref={containerRef} className={cn("relative w-full h-full", className)} onClick={onClick}>
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-800/20">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
            {shouldUseChunkedDelivery && isProcessingChunks && (
              <div className="text-xs text-slate-300">
                Loading chunks: {Math.round(loadingProgress)}%
              </div>
            )}
          </div>
        </div>
      )}
      
      {currentError && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-800/50 text-red-400 text-sm p-4">
          Error: {currentError}
        </div>
      )}

      <canvas
        ref={currentCanvasRef}
        className={cn(
          "w-full h-full transition-opacity duration-300",
          isLoading ? "opacity-0" : "opacity-100"
        )}
        style={{ userSelect: 'none' }}
        onContextMenu={(e) => e.preventDefault()}
        aria-label={alt}
      />
    </div>
  );
};

export default WatermarkedImage;
