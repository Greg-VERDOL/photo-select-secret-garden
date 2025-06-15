
import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';

interface WatermarkedImageProps {
  src: string;
  alt: string;
  className?: string;
  onClick?: () => void;
  fitContainer?: boolean;
  showWatermark?: boolean; // New prop to control watermark display
}

const WatermarkedImage: React.FC<WatermarkedImageProps> = ({ 
  src, 
  alt, 
  className, 
  onClick, 
  fitContainer = false,
  showWatermark = true // Default to true to maintain existing behavior
}) => {
  const [watermarkText, setWatermarkText] = useState('© PHOTO STUDIO');
  const [watermarkStyle, setWatermarkStyle] = useState('corners');
  const [centerWatermarkText, setCenterWatermarkText] = useState('PROOF');
  const [settingsLoaded, setSettingsLoaded] = useState(false);

  useEffect(() => {
    if (showWatermark) {
      fetchWatermarkSettings();
    } else {
      setSettingsLoaded(true);
    }
  }, [showWatermark]);

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

  const showCorners = showWatermark && (watermarkStyle === 'corners' || watermarkStyle === 'full');
  const showCenter = showWatermark && (watermarkStyle === 'center' || watermarkStyle === 'full');

  return (
    <div className={cn("relative inline-block", className)} onClick={onClick}>
      <img 
        src={src} 
        alt={alt} 
        className={cn(
          "block",
          fitContainer 
            ? "w-full h-full object-cover" 
            : "max-w-[90vw] max-h-[80vh]"
        )}
        draggable={false}
        onContextMenu={(e) => e.preventDefault()}
        style={{ userSelect: 'none' }}
      />
      
      {/* Watermark overlay - only show if watermark is enabled and settings are loaded */}
      {showWatermark && settingsLoaded && (
        <div className="absolute inset-0 pointer-events-none">
          {/* Corner watermarks */}
          {showCorners && (
            <>
              <div className="absolute top-4 left-4 text-white/30 text-sm font-bold backdrop-blur-sm bg-black/20 px-2 py-1 rounded">
                {watermarkText}
              </div>
              
              <div className="absolute bottom-4 right-4 text-white/30 text-sm font-bold backdrop-blur-sm bg-black/20 px-2 py-1 rounded">
                {watermarkText}
              </div>
            </>
          )}
          
          {/* Center watermark */}
          {showCenter && (
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white/20 text-2xl font-bold backdrop-blur-sm bg-black/10 px-4 py-2 rounded rotate-12">
              {centerWatermarkText}
            </div>
          )}
          
          {/* Subtle pattern overlay to make screenshot editing harder */}
          <div 
            className="absolute inset-0 opacity-5"
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
      )}
    </div>
  );
};

export default WatermarkedImage;
