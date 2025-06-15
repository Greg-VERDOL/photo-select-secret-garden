
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const token = url.searchParams.get('token');
    const photoId = url.searchParams.get('photo_id');
    
    console.log('🔐 Secure image proxy request:', { token: token?.substring(0, 20) + '...', photoId });
    
    if (!token || !photoId) {
      console.error('❌ Missing token or photo_id:', { token: !!token, photoId: !!photoId });
      return new Response('Missing token or photo_id', { 
        status: 400, 
        headers: corsHeaders 
      });
    }

    // Verify the access token with proper JOIN
    console.log('🔍 Verifying access token...');
    const { data: accessLog, error: tokenError } = await supabase
      .from('image_access_logs')
      .select(`
        *,
        photos!inner(storage_path)
      `)
      .eq('access_token', token)
      .eq('photo_id', photoId)
      .gte('expires_at', new Date().toISOString())
      .single();

    if (tokenError) {
      console.error('❌ Token verification error:', tokenError);
      // Log suspicious activity
      await supabase.from('download_attempts').insert({
        photo_id: photoId,
        client_email: 'unknown',
        ip_address: req.headers.get('x-forwarded-for') || 'unknown',
        user_agent: req.headers.get('user-agent') || 'unknown',
        attempt_type: 'invalid_token',
        blocked: true
      });

      return new Response('Invalid or expired token', { 
        status: 403, 
        headers: corsHeaders 
      });
    }

    if (!accessLog || !accessLog.photos) {
      console.error('❌ No access log or photo data found for token');
      return new Response('Invalid or expired token', { 
        status: 403, 
        headers: corsHeaders 
      });
    }

    console.log('✅ Token verified, accessing photo:', accessLog.photos.storage_path);

    // Get the image from storage
    const { data: imageData, error: storageError } = await supabase.storage
      .from('gallery-photos')
      .download(accessLog.photos.storage_path);

    if (storageError) {
      console.error('❌ Storage error:', storageError);
      return new Response('Image not found', { 
        status: 404, 
        headers: corsHeaders 
      });
    }

    if (!imageData) {
      console.error('❌ No image data returned');
      return new Response('Image not found', { 
        status: 404, 
        headers: corsHeaders 
      });
    }

    console.log('✅ Image retrieved successfully, size:', imageData.size);

    // Add watermark headers and security headers
    const headers = new Headers({
      'Content-Type': 'image/jpeg',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'Referrer-Policy': 'no-referrer',
      ...corsHeaders
    });

    return new Response(imageData, { headers });

  } catch (error: any) {
    console.error('❌ Error in secure image proxy:', error);
    return new Response('Internal server error', { 
      status: 500, 
      headers: corsHeaders 
    });
  }
};

serve(handler);
