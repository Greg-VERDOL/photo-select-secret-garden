
import React from 'react';

interface WatermarkedImageProps {
  src: string;
  alt: string;
  className?: string;
  onClick?: () => void;
}

const WatermarkedImage: React.FC<WatermarkedImageProps> = ({ src, alt, className, onClick }) => {
  return (
    <div className="relative inline-block" onClick={onClick}>
      <img 
        src={src} 
        alt={alt} 
        className={className}
        draggable={false}
        onContextMenu={(e) => e.preventDefault()}
        style={{ userSelect: 'none' }}
      />
      
      {/* Watermark overlay */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Multiple watermarks for better protection */}
        <div className="absolute top-4 left-4 text-white/30 text-sm font-bold backdrop-blur-sm bg-black/20 px-2 py-1 rounded">
          © PHOTO STUDIO
        </div>
        
        <div className="absolute bottom-4 right-4 text-white/30 text-sm font-bold backdrop-blur-sm bg-black/20 px-2 py-1 rounded">
          © PHOTO STUDIO
        </div>
        
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white/20 text-2xl font-bold backdrop-blur-sm bg-black/10 px-4 py-2 rounded rotate-12">
          PROOF
        </div>
        
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
    </div>
  );
};

export default WatermarkedImage;
