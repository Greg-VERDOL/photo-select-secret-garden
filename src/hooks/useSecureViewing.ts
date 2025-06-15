
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useSecureViewing = (galleryId: string, clientEmail: string) => {
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [isSessionValid, setIsSessionValid] = useState(false);
  const [isSessionLoading, setIsSessionLoading] = useState(true);

  // Initialize viewing session
  useEffect(() => {
    if (!galleryId || !clientEmail) {
      console.warn('🔄 Skipping session initialization: Missing galleryId or clientEmail.', { galleryId: !!galleryId, clientEmail: !!clientEmail });
      setIsSessionValid(false);
      setIsSessionLoading(false);
      return;
    }
    setIsSessionLoading(true);
    console.log('🔄 Initializing secure viewing session for gallery:', galleryId, 'client:', clientEmail);
    initializeSession();
  }, [galleryId, clientEmail]);

  const initializeSession = async () => {
    if (!galleryId || !clientEmail) {
      setIsSessionLoading(false);
      return;
    }

    try {
      console.log('🔍 Checking for existing session...');
      // Check for existing valid session
      let { data: existingSession, error: sessionError } = await supabase
        .from('viewing_sessions')
        .select('*')
        .eq('gallery_id', galleryId)
        .eq('client_email', clientEmail)
        .gt('expires_at', new Date().toISOString())
        .single();

      if (sessionError && sessionError.code !== 'PGRST116') { // PGRST116: no rows found, which is fine
        console.log('ℹ️ Error checking for existing session:', sessionError.message);
      }

      if (existingSession) {
        console.log('✅ Found existing valid session:', existingSession.session_token);
        setSessionToken(existingSession.session_token);
        setIsSessionValid(true);
      } else {
        // Create new session
        console.log('🆕 Creating new viewing session...');
        const newSessionToken = generateSessionToken();
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + 24); // 24 hour session

        const clientIP = await getClientIP();
        console.log('🌐 Client IP:', clientIP);

        const { error } = await supabase
          .from('viewing_sessions')
          .insert({
            gallery_id: galleryId,
            client_email: clientEmail,
            session_token: newSessionToken,
            ip_address: clientIP,
            user_agent: navigator.userAgent,
            expires_at: expiresAt.toISOString(),
            max_views: 1000,
            current_views: 0
          });

        if (error) {
          console.error('❌ Failed to create viewing session:', error);
          setIsSessionValid(false);
        } else {
          console.log('✅ Created new session:', newSessionToken);
          setSessionToken(newSessionToken);
          setIsSessionValid(true);
        }
      }
    } catch (error) {
      console.error('❌ Error initializing secure viewing session:', error);
      setIsSessionValid(false);
    } finally {
      setIsSessionLoading(false);
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
    console.log('🔐 Generating secure image URL for photo:', photoId);
    
    if (!sessionToken || !isSessionValid) {
      console.error('❌ No valid session for image access. SessionToken:', !!sessionToken, 'IsValid:', isSessionValid);
      return null;
    }

    try {
      // Generate access token for this specific image
      const accessToken = generateAccessToken();
      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + 30); // 30 minute expiry

      console.log('📝 Creating image access log...');
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
        console.error('❌ Error logging image access:', logError);
        return null;
      }

      console.log('📈 Incrementing session views...');
      // Increment session view count using the database function
      const { error: updateError } = await supabase.rpc('increment_session_views', {
        p_session_token: sessionToken
      });

      if (updateError) {
        console.error('❌ Error incrementing session views:', updateError);
      }

      // Return the secure proxy URL
      const supabaseUrl = 'https://avmbtikrdufrrdpgrqgw.supabase.co';
      const secureUrl = `${supabaseUrl}/functions/v1/secure-image-proxy?token=${accessToken}&photo_id=${photoId}`;
      console.log('✅ Generated secure proxy URL for photo:', photoId);
      return secureUrl;
    } catch (error) {
      console.error('❌ Error generating secure image URL:', error);
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

      console.warn(`🚫 Blocked ${attemptType} attempt for photo ${photoId}`);
    } catch (error) {
      console.error('❌ Error logging download attempt:', error);
    }
  }, [galleryId, clientEmail]);

  return {
    sessionToken,
    isSessionValid,
    isSessionLoading,
    generateSecureImageUrl,
    logDownloadAttempt
  };
};
