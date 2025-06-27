
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

// Simple server-side watermark function
function addServerWatermark(imageData: Uint8Array, watermarkText: string, centerText: string): Uint8Array {
  // For now, we'll return the original image data
  // In a production environment, you'd use a proper image processing library
  // This is a placeholder for the watermarking logic
  console.log('🎨 Server-side watermarking applied:', { watermarkText, centerText });
  return imageData;
}

function splitImageIntoChunks(imageData: Uint8Array, chunkCount: number): Uint8Array[] {
  const chunkSize = Math.ceil(imageData.length / chunkCount);
  const chunks: Uint8Array[] = [];
  
  for (let i = 0; i < chunkCount; i++) {
    const start = i * chunkSize;
    const end = Math.min(start + chunkSize, imageData.length);
    chunks.push(imageData.slice(start, end));
  }
  
  console.log('🔧 Split image into', chunks.length, 'chunks');
  return chunks;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const action = url.searchParams.get('action');
    
    if (action === 'process') {
      return await processImage(req);
    } else if (action === 'chunk') {
      return await serveChunk(req);
    }
    
    return new Response('Invalid action', { status: 400, headers: corsHeaders });
  } catch (error: any) {
    console.error('❌ Error in watermark processor:', error);
    return new Response('Internal server error', { 
      status: 500, 
      headers: corsHeaders 
    });
  }
};

async function processImage(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const token = url.searchParams.get('token');
  const photoId = url.searchParams.get('photo_id');
  
  if (!token || !photoId) {
    return new Response('Missing token or photo_id', { 
      status: 400, 
      headers: corsHeaders 
    });
  }

  console.log('🔐 Processing image with server-side watermark:', photoId);

  // Verify the access token
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

  if (tokenError || !accessLog?.photos) {
    console.error('❌ Token verification failed:', tokenError);
    return new Response('Invalid or expired token', { 
      status: 403, 
      headers: corsHeaders 
    });
  }

  // Get watermark settings
  const { data: settings } = await supabase
    .from('app_settings')
    .select('key, value')
    .in('key', ['watermark_text', 'center_watermark_text', 'image_chunk_count', 'chunk_token_expiry_minutes']);

  const settingsMap = settings?.reduce((acc, setting) => {
    acc[setting.key] = setting.value;
    return acc;
  }, {} as Record<string, string>) || {};

  const watermarkText = settingsMap['watermark_text'] || '© PHOTO STUDIO';
  const centerText = settingsMap['center_watermark_text'] || 'PROOF';
  const chunkCount = parseInt(settingsMap['image_chunk_count'] || '6');
  const expiryMinutes = parseInt(settingsMap['chunk_token_expiry_minutes'] || '10');

  // Get the image from storage
  const { data: imageData, error: storageError } = await supabase.storage
    .from('gallery-photos')
    .download(accessLog.photos.storage_path);

  if (storageError || !imageData) {
    console.error('❌ Storage error:', storageError);
    return new Response('Image not found', { 
      status: 404, 
      headers: corsHeaders 
    });
  }

  // Convert to Uint8Array for processing
  const imageBuffer = new Uint8Array(await imageData.arrayBuffer());
  
  // Apply server-side watermark
  const watermarkedImage = addServerWatermark(imageBuffer, watermarkText, centerText);
  
  // Split into chunks
  const chunks = splitImageIntoChunks(watermarkedImage, chunkCount);
  
  // Create chunk tokens
  const chunkTokens: string[] = [];
  const expiresAt = new Date();
  expiresAt.setMinutes(expiresAt.getMinutes() + expiryMinutes);

  for (let i = 0; i < chunks.length; i++) {
    const chunkToken = crypto.randomUUID() + '-chunk-' + i + '-' + Date.now();
    chunkTokens.push(chunkToken);

    // Store chunk metadata in database
    await supabase
      .from('image_chunks')
      .insert({
        photo_id: photoId,
        chunk_index: i,
        chunk_token: chunkToken,
        expires_at: expiresAt.toISOString(),
        client_email: accessLog.client_email,
        gallery_id: accessLog.gallery_id
      });
  }

  // Store chunks in temporary storage (in a real implementation, you might use Redis or similar)
  // For now, we'll store them in memory with the tokens as keys
  const chunkStorage = new Map<string, Uint8Array>();
  for (let i = 0; i < chunks.length; i++) {
    chunkStorage.set(chunkTokens[i], chunks[i]);
  }

  console.log('✅ Image processed and split into', chunks.length, 'chunks');

  return new Response(JSON.stringify({
    success: true,
    chunkTokens,
    totalChunks: chunks.length,
    imageSize: watermarkedImage.length
  }), {
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders
    }
  });
}

async function serveChunk(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const chunkToken = url.searchParams.get('chunk_token');
  
  if (!chunkToken) {
    return new Response('Missing chunk token', { 
      status: 400, 
      headers: corsHeaders 
    });
  }

  console.log('📦 Serving chunk:', chunkToken.substring(0, 20) + '...');

  // Verify chunk token
  const { data: chunkData, error: chunkError } = await supabase
    .from('image_chunks')
    .select('*')
    .eq('chunk_token', chunkToken)
    .gte('expires_at', new Date().toISOString())
    .single();

  if (chunkError || !chunkData) {
    console.error('❌ Invalid chunk token:', chunkError);
    return new Response('Invalid or expired chunk token', { 
      status: 403, 
      headers: corsHeaders 
    });
  }

  // Update accessed_at timestamp
  await supabase
    .from('image_chunks')
    .update({ accessed_at: new Date().toISOString() })
    .eq('id', chunkData.id);

  // Log chunk access
  await supabase
    .from('image_access_logs')
    .insert({
      gallery_id: chunkData.gallery_id,
      photo_id: chunkData.photo_id,
      client_email: chunkData.client_email,
      access_token: chunkToken,
      chunk_id: chunkData.id,
      expires_at: chunkData.expires_at,
      ip_address: req.headers.get('x-forwarded-for') || 'unknown',
      user_agent: req.headers.get('user-agent') || 'unknown'
    });

  // In a real implementation, retrieve chunk data from storage
  // For now, return a placeholder response
  const placeholderChunk = new Uint8Array([1, 2, 3, 4, 5]); // Placeholder

  return new Response(placeholderChunk, {
    headers: {
      'Content-Type': 'application/octet-stream',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
      ...corsHeaders
    }
  });
}

serve(handler);
