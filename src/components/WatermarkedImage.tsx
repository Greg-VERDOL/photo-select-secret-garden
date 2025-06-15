
import React, { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { addWatermarks, addNoisePattern } from '@/utils/watermarkUtils';

interface WatermarkedImageProps {
  src: string;
  alt: string;
  className?: string;
  onClick?: () => void;
  fitContainer?: boolean;
  showWatermark?: boolean;
  isAdminView?: boolean;
}

const WatermarkedImage: React.FC<WatermarkedImageProps> = ({ 
  src, 
  alt, 
  className, 
  onClick, 
  fitContainer = false,
  showWatermark = true,
  isAdminView = false
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [watermarkText, setWatermarkText] = useState('© PHOTO STUDIO');
  const [watermarkStyle, setWatermarkStyle] = useState('corners');
  const [centerWatermarkText, setCenterWatermarkText] = useState('PROOF');
  const [settingsLoaded, setSettingsLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

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
        .in('key', ['watermark_text', 'watermark_style', 'center_watermark_text']);

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

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !src || !settingsLoaded) return;

    let img: HTMLImageElement;

    const draw = () => {
      if (!img || img.naturalWidth === 0) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // --- Core logic update starts here ---
      // When fitContainer is false, draw image at its natural size (preview modal), watermark is locked to the image itself.
      if (!fitContainer) {
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        ctx.drawImage(img, 0, 0, img.naturalWidth, img.naturalHeight);

        if (shouldShowWatermark) {
          addWatermarks(ctx, img.naturalWidth, img.naturalHeight, {
            watermarkText,
            centerWatermarkText,
            watermarkStyle,
          });
          addNoisePattern(ctx, img.naturalWidth, img.naturalHeight);
        }
        setIsLoading(false);
        return;
      }
      // --- End special modal logic ---

      // Fallback for fitContainer=true (grid cells): stretch to fill container
      const container = containerRef.current;
      if (!container) return;

      const containerWidth = container.offsetWidth;
      const containerHeight = container.offsetHeight;

      if (containerWidth === 0 || containerHeight === 0) return;

      canvas.width = containerWidth;
      canvas.height = containerHeight;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      let scale = Math.max(containerWidth / img.naturalWidth, containerHeight / img.naturalHeight);
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
      setIsLoading(false);
    };

    setIsLoading(true);
    img = new Image();
    img.crossOrigin = "Anonymous";
    img.src = src;
    img.onload = draw;
    img.onerror = () => {
      setIsLoading(false);
      console.error(`Failed to load image for canvas: ${src}`);
    };

    // Only observe for resize if fitContainer is true (for grid thumbnails, not fullscreen)
    let resizeObserver: ResizeObserver | undefined;
    if (fitContainer) {
      const container = containerRef.current;
      if (container) {
        resizeObserver = new ResizeObserver(draw);
        resizeObserver.observe(container);
      }
    }

    return () => {
      if (resizeObserver && containerRef.current) {
        resizeObserver.disconnect();
      }
    };
  }, [src, settingsLoaded, fitContainer, shouldShowWatermark, watermarkText, watermarkStyle, centerWatermarkText]);

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative overflow-auto w-full h-full",
        !fitContainer && "flex justify-center items-center", // Center modal image
        className
      )}
      style={
        !fitContainer
          ? { maxWidth: '100%', maxHeight: '100%', minHeight: '1px' }
          : undefined
      }
      onClick={onClick}
      tabIndex={0}
    >
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-800/20 z-10">
          <div className="w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}
      <canvas
        ref={canvasRef}
        className={cn(
          fitContainer
            ? "w-full h-full transition-opacity duration-300"
            : "block transition-opacity duration-300", // Modal: show at real image size
          isLoading ? "opacity-0" : "opacity-100"
        )}
        style={
          !fitContainer
            ? { maxWidth: '100%', maxHeight: '100%', margin: 'auto', display: 'block', background: '#141414' }
            : { userSelect: 'none' }
        }
        onContextMenu={(e) => e.preventDefault()}
        aria-label={alt}
      />
    </div>
  );
};

export default WatermarkedImage;
