
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useSecureViewing = (galleryId: string, clientEmail: string) => {
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [isSessionValid, setIsSessionValid] = useState(false);
  const [viewCount, setViewCount] = useState(0);
  const { toast } = useToast();

  useEffect(() => {
    initializeSecureSession();
    
    // Set up session monitoring
    const interval = setInterval(checkSession, 30000); // Check every 30 seconds
    
    return () => clearInterval(interval);
  }, [galleryId, clientEmail]);

  const initializeSecureSession = async () => {
    try {
      const token = crypto.randomUUID();
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 2); // 2-hour session

      const { error } = await supabase
        .from('viewing_sessions')
        .insert({
          gallery_id: galleryId,
          client_email: clientEmail,
          session_token: token,
          ip_address: await getClientIP(),
          user_agent: navigator.userAgent,
          expires_at: expiresAt.toISOString()
        });

      if (error) throw error;

      setSessionToken(token);
      setIsSessionValid(true);
    } catch (error) {
      console.error('Failed to initialize secure session:', error);
      toast({
        title: "Session Error",
        description: "Failed to establish secure viewing session",
        variant: "destructive"
      });
    }
  };

  const checkSession = async () => {
    if (!sessionToken) return;

    try {
      const { data, error } = await supabase
        .from('viewing_sessions')
        .select('current_views, max_views, expires_at')
        .eq('session_token', sessionToken)
        .single();

      if (error || !data) {
        setIsSessionValid(false);
        return;
      }

      const now = new Date();
      const expires = new Date(data.expires_at);
      
      if (now > expires || data.current_views >= data.max_views) {
        setIsSessionValid(false);
        toast({
          title: "Session Expired",
          description: "Your viewing session has expired. Please refresh the page.",
          variant: "destructive"
        });
      } else {
        setViewCount(data.current_views);
      }
    } catch (error) {
      console.error('Session check failed:', error);
    }
  };

  const generateSecureImageUrl = async (photoId: string, storagePath: string) => {
    if (!sessionToken || !isSessionValid) return null;

    try {
      const accessToken = crypto.randomUUID();
      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + 10); // 10-minute image token

      // Create access log
      await supabase.from('image_access_logs').insert({
        gallery_id: galleryId,
        photo_id: photoId,
        client_email: clientEmail,
        access_token: accessToken,
        ip_address: await getClientIP(),
        user_agent: navigator.userAgent,
        expires_at: expiresAt.toISOString()
      });

      // Increment view count
      await supabase
        .from('viewing_sessions')
        .update({ current_views: viewCount + 1 })
        .eq('session_token', sessionToken);

      return `${supabase.supabaseUrl}/functions/v1/secure-image-proxy?token=${accessToken}&photo_id=${photoId}`;
    } catch (error) {
      console.error('Failed to generate secure image URL:', error);
      return null;
    }
  };

  const logDownloadAttempt = async (photoId: string, attemptType: string) => {
    try {
      await supabase.from('download_attempts').insert({
        gallery_id: galleryId,
        photo_id: photoId,
        client_email: clientEmail,
        ip_address: await getClientIP(),
        user_agent: navigator.userAgent,
        attempt_type: attemptType,
        blocked: true
      });
    } catch (error) {
      console.error('Failed to log download attempt:', error);
    }
  };

  return {
    sessionToken,
    isSessionValid,
    viewCount,
    generateSecureImageUrl,
    logDownloadAttempt
  };
};

const getClientIP = async (): Promise<string> => {
  try {
    const response = await fetch('https://api.ipify.org?format=json');
    const data = await response.json();
    return data.ip;
  } catch {
    return 'unknown';
  }
};
