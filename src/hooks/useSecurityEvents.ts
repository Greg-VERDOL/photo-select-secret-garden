
import { useEffect, useCallback } from 'react';

interface UseSecurityEventsProps {
  photoId: string;
  logDownloadAttempt: (photoId: string, attemptType: string) => void;
}

export const useSecurityEvents = ({ photoId, logDownloadAttempt }: UseSecurityEventsProps) => {
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

  const handleDevToolsDetection = useCallback(() => {
    const threshold = 160;
    if (window.outerHeight - window.innerHeight > threshold || 
        window.outerWidth - window.innerWidth > threshold) {
      logDownloadAttempt(photoId, 'dev_tools_detected');
    }
  }, [photoId, logDownloadAttempt]);

  useEffect(() => {
    // Add security event listeners
    document.addEventListener('contextmenu', handleRightClick);
    document.addEventListener('keydown', handleKeyDown);
    
    // Dev tools detection (reduced frequency to avoid spam)
    const devToolsInterval = setInterval(handleDevToolsDetection, 5000);
    
    // Disable drag and drop
    const handleDragStart = (e: DragEvent) => {
      e.preventDefault();
      logDownloadAttempt(photoId, 'drag_attempt');
    };
    
    document.addEventListener('dragstart', handleDragStart);

    return () => {
      document.removeEventListener('contextmenu', handleRightClick);
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('dragstart', handleDragStart);
      clearInterval(devToolsInterval);
    };
  }, [handleRightClick, handleKeyDown, handleDevToolsDetection, photoId, logDownloadAttempt]);
};
