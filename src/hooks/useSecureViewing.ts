
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useSecureViewing = (galleryId: string, clientEmail: string) => {
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [isSessionValid, setIsSessionValid] = useState(false);
  const [isSessionLoading, setIsSessionLoading] = useState(true);

  // Initialize viewing session
  useEffect(() => {
    if (!galleryId) {
      console.warn('🔄 Skipping session initialization: Missing galleryId.');
      setIsSessionValid(false);
      setIsSessionLoading(false);
      return;
    }
    
    // Ensure we have a valid client email, use 'anonymous' as fallback
    const effectiveClientEmail = clientEmail && clientEmail.trim() !== '' ? clientEmail : 'anonymous';
    
    console.log('🔄 Initializing secure viewing session for gallery:', galleryId, 'client:', effectiveClientEmail);
    setIsSessionLoading(true);
    initializeSession(effectiveClientEmail);
  }, [galleryId, clientEmail]);

  const initializeSession = async (effectiveClientEmail: string) => {
    if (!galleryId) {
      setIsSessionLoading(false);
      return;
    }

    try {
      console.log('🔍 Checking for existing session...');
      
      // Clean up expired sessions first
      await cleanupExpiredSessions(galleryId, effectiveClientEmail);
      
      // Check for existing valid session
      let { data: existingSession, error: sessionError } = await supabase
        .from('viewing_sessions')
        .select('*')
        .eq('gallery_id', galleryId)
        .eq('client_email', effectiveClientEmail)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (sessionError && sessionError.code !== 'PGRST116') {
        console.log('ℹ️ Error checking for existing session:', sessionError.message);
      }

      if (existingSession) {
        console.log('✅ Found existing valid session:', existiveSession.session_token);
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
            client_email: effectiveClientEmail,
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

  const cleanupExpiredSessions = async (galleryId: string, clientEmail: string) => {
    try {
      const { error } = await supabase
        .from('viewing_sessions')
        .delete()
        .eq('gallery_id', galleryId)
        .eq('client_email', clientEmail)
        .lt('expires_at', new Date().toISOString());
      
      if (error) {
        console.log('⚠️ Error cleaning up expired sessions:', error);
      } else {
        console.log('🧹 Cleaned up expired sessions');
      }
    } catch (error) {
      console.log('⚠️ Error in cleanup:', error);
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
          client_email: clientEmail && clientEmail.trim() !== '' ? clientEmail : 'anonymous',
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
          client_email: clientEmail && clientEmail.trim() !== '' ? clientEmail : 'anonymous',
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
