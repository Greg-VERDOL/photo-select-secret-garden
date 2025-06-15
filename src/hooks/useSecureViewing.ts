
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useSecureViewing = (galleryId: string, clientEmail: string) => {
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [isSessionValid, setIsSessionValid] = useState(false);

  // Initialize viewing session
  useEffect(() => {
    initializeSession();
  }, [galleryId, clientEmail]);

  const initializeSession = async () => {
    try {
      // Check for existing valid session
      let { data: existingSession } = await supabase
        .from('viewing_sessions')
        .select('*')
        .eq('gallery_id', galleryId)
        .eq('client_email', clientEmail)
        .gt('expires_at', new Date().toISOString())
        .single();

      if (existingSession) {
        setSessionToken(existingSession.session_token);
        setIsSessionValid(true);
        return;
      }

      // Create new session
      const newSessionToken = generateSessionToken();
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24); // 24 hour session

      const { error } = await supabase
        .from('viewing_sessions')
        .insert({
          gallery_id: galleryId,
          client_email: clientEmail,
          session_token: newSessionToken,
          ip_address: await getClientIP(),
          user_agent: navigator.userAgent,
          expires_at: expiresAt.toISOString(),
          max_views: 1000,
          current_views: 0
        });

      if (!error) {
        setSessionToken(newSessionToken);
        setIsSessionValid(true);
      }
    } catch (error) {
      console.error('Error initializing secure viewing session:', error);
      setIsSessionValid(false);
    }
  };

  const generateSessionToken = (): string => {
    return crypto.randomUUID() + '-' + Date.now();
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

  const generateSecureImageUrl = useCallback(async (photoId: string, storagePath: string): Promise<string | null> => {
    if (!sessionToken || !isSessionValid) {
      console.error('No valid session for image access');
      return null;
    }

    try {
      // Generate access token for this specific image
      const accessToken = generateAccessToken();
      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + 30); // 30 minute expiry

      // Log the image access attempt
      const { error: logError } = await supabase
        .from('image_access_logs')
        .insert({
          gallery_id: galleryId,
          photo_id: photoId,
          client_email: clientEmail,
          access_token: accessToken,
          ip_address: await getClientIP(),
          user_agent: navigator.userAgent,
          expires_at: expiresAt.toISOString()
        });

      if (logError) {
        console.error('Error logging image access:', logError);
        return null;
      }

      // Increment session view count
      await supabase
        .from('viewing_sessions')
        .update({ 
          current_views: supabase.raw('current_views + 1')
        })
        .eq('session_token', sessionToken);

      // Return the secure proxy URL
      const supabaseUrl = 'https://avmbtikrdufrrdpgrqgw.supabase.co';
      return `${supabaseUrl}/functions/v1/secure-image-proxy?token=${accessToken}&photo_id=${photoId}`;
    } catch (error) {
      console.error('Error generating secure image URL:', error);
      return null;
    }
  }, [sessionToken, isSessionValid, galleryId, clientEmail]);

  const generateAccessToken = (): string => {
    return crypto.randomUUID() + '-' + Date.now() + '-' + Math.random().toString(36).substring(2);
  };

  const logDownloadAttempt = useCallback(async (photoId: string, attemptType: string) => {
    try {
      await supabase
        .from('download_attempts')
        .insert({
          gallery_id: galleryId,
          photo_id: photoId,
          client_email: clientEmail,
          ip_address: await getClientIP(),
          user_agent: navigator.userAgent,
          attempt_type: attemptType,
          blocked: true
        });

      console.warn(`Blocked ${attemptType} attempt for photo ${photoId}`);
    } catch (error) {
      console.error('Error logging download attempt:', error);
    }
  }, [galleryId, clientEmail]);

  return {
    sessionToken,
    isSessionValid,
    generateSecureImageUrl,
    logDownloadAttempt
  };
};
