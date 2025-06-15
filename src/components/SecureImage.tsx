
import React, { useRef, useEffect, useState, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { useSecureViewing } from '@/hooks/useSecureViewing';

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
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isBlurred, setIsBlurred] = useState(false);
  const { generateSecureImageUrl, logDownloadAttempt, isSessionValid } = useSecureViewing(galleryId, clientEmail);

  // Security event handlers
  const handleRightClick = useCallback((e: MouseEvent) => {
    e.preventDefault();
    logDownloadAttempt(photoId, 'right_click');
    return false;
  }, [photoId, logDownloadAttempt]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // Block common screenshot/save shortcuts
    if (
      (e.ctrlKey && (e.key === 's' || e.key === 'S')) || // Ctrl+S
      (e.ctrlKey && e.shiftKey && (e.key === 'i' || e.key === 'I')) || // Ctrl+Shift+I
      e.key === 'F12' || // F12
      (e.ctrlKey && e.shiftKey && (e.key === 'j' || e.key === 'J')) || // Ctrl+Shift+J
      (e.ctrlKey && (e.key === 'u' || e.key === 'U')) // Ctrl+U
    ) {
      e.preventDefault();
      logDownloadAttempt(photoId, 'keyboard_shortcut');
      return false;
    }
  }, [photoId, logDownloadAttempt]);

  const handleVisibilityChange = useCallback(() => {
    if (document.hidden) {
      setIsBlurred(true);
    } else {
      // Delay removing blur to make screenshots harder
      setTimeout(() => setIsBlurred(false), 1000);
    }
  }, []);

  const handleDevToolsDetection = useCallback(() => {
    const threshold = 160;
    if (window.outerHeight - window.innerHeight > threshold || 
        window.outerWidth - window.innerWidth > threshold) {
      logDownloadAttempt(photoId, 'dev_tools_detected');
      setIsBlurred(true);
    }
  }, [photoId, logDownloadAttempt]);

  useEffect(() => {
    // Add security event listeners
    document.addEventListener('contextmenu', handleRightClick);
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Dev tools detection
    const devToolsInterval = setInterval(handleDevToolsDetection, 1000);
    
    // Disable drag and drop
    const handleDragStart = (e: DragEvent) => {
      e.preventDefault();
      logDownloadAttempt(photoId, 'drag_attempt');
    };
    
    document.addEventListener('dragstart', handleDragStart);

    return () => {
      document.removeEventListener('contextmenu', handleRightClick);
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      document.removeEventListener('dragstart', handleDragStart);
      clearInterval(devToolsInterval);
    };
  }, [handleRightClick, handleKeyDown, handleVisibilityChange, handleDevToolsDetection, photoId, logDownloadAttempt]);

  useEffect(() => {
    if (!isSessionValid) return;
    
    const loadSecureImage = async () => {
      setIsLoading(true);
      try {
        const secureUrl = await generateSecureImageUrl(photoId, storagePath);
        if (!secureUrl) throw new Error('Failed to generate secure URL');

        const img = new Image();
        img.crossOrigin = 'anonymous';
        
        img.onload = () => {
          const canvas = canvasRef.current;
          if (!canvas) return;

          const ctx = canvas.getContext('2d');
          if (!ctx) return;

          // Set canvas size
          canvas.width = img.width;
          canvas.height = img.height;

          // Draw image
          ctx.drawImage(img, 0, 0);

          // Add dynamic watermarks
          addWatermarks(ctx, canvas.width, canvas.height);

          // Add noise pattern to make reverse engineering harder
          addNoisePattern(ctx, canvas.width, canvas.height);

          setIsLoading(false);
        };

        img.onerror = () => {
          console.error('Failed to load secure image');
          setIsLoading(false);
        };

        img.src = secureUrl;
      } catch (error) {
        console.error('Error loading secure image:', error);
        setIsLoading(false);
      }
    };

    loadSecureImage();
  }, [photoId, storagePath, generateSecureImageUrl, isSessionValid, watermarkText, centerWatermarkText, watermarkStyle]);

  const addWatermarks = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    const showCorners = watermarkStyle === 'corners' || watermarkStyle === 'full';
    const showCenter = watermarkStyle === 'center' || watermarkStyle === 'full';

    ctx.save();

    if (showCorners) {
      // Corner watermarks with client email and timestamp
      const timestamp = new Date().toLocaleString();
      const watermarkWithInfo = `${watermarkText} - ${clientEmail} - ${timestamp}`;
      
      ctx.font = `${Math.max(12, width * 0.015)}px Arial`;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.lineWidth = 2;

      // Top-left
      ctx.strokeText(watermarkWithInfo, 20, 30);
      ctx.fillText(watermarkWithInfo, 20, 30);

      // Bottom-right
      const textWidth = ctx.measureText(watermarkWithInfo).width;
      ctx.strokeText(watermarkWithInfo, width - textWidth - 20, height - 20);
      ctx.fillText(watermarkWithInfo, width - textWidth - 20, height - 20);
    }

    if (showCenter) {
      // Center watermark
      ctx.font = `${Math.max(24, width * 0.03)}px Arial`;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
      ctx.lineWidth = 3;
      ctx.textAlign = 'center';
      
      ctx.save();
      ctx.translate(width / 2, height / 2);
      ctx.rotate(Math.PI / 8); // 22.5 degrees
      
      ctx.strokeText(centerWatermarkText, 0, 0);
      ctx.fillText(centerWatermarkText, 0, 0);
      
      ctx.restore();
    }

    ctx.restore();
  };

  const addNoisePattern = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    // Add subtle noise pattern to make automated watermark removal harder
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;

    for (let i = 0; i < data.length; i += 4) {
      if (Math.random() < 0.001) { // Very sparse noise
        const noise = Math.random() * 10 - 5;
        data[i] = Math.max(0, Math.min(255, data[i] + noise));     // R
        data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + noise)); // G
        data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + noise)); // B
      }
    }

    ctx.putImageData(imageData, 0, 0);
  };

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

  return (
    <div className={cn("relative inline-block", className)}>
      <canvas
        ref={canvasRef}
        onClick={handleCanvasClick}
        className={cn(
          "block cursor-pointer transition-all duration-300 max-w-full h-auto",
          isBlurred && "blur-md",
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

      {isBlurred && (
        <div className="absolute inset-0 flex items-center justify-center bg-red-500/20 rounded-lg">
          <p className="text-white text-sm font-bold">Suspicious activity detected</p>
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
