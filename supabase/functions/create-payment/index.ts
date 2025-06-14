
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { galleryId, clientEmail, extraPhotosCount } = await req.json();

    console.log('Payment request received:', { galleryId, clientEmail, extraPhotosCount });

    if (!galleryId) {
      throw new Error("Gallery ID is required");
    }

    if (!clientEmail || clientEmail.trim() === "") {
      throw new Error("Client email is required");
    }

    if (!extraPhotosCount || extraPhotosCount <= 0) {
      throw new Error("Extra photos count must be greater than 0");
    }

    // Initialize Supabase client with service role key
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Get price per extra photo from settings (in cents)
    const { data: priceData, error: priceError } = await supabaseClient
      .from('app_settings')
      .select('value')
      .eq('key', 'price_per_extra_photo_cents')
      .single();

    if (priceError) {
      console.error('Failed to get pricing:', priceError);
      throw new Error("Failed to get pricing information");
    }
    
    const pricePerPhotoCents = parseInt(priceData.value);
    const totalAmount = extraPhotosCount * pricePerPhotoCents;

    console.log('Pricing info:', { pricePerPhotoCents, totalAmount });

    // Verify gallery exists
    const { data: galleryData, error: galleryError } = await supabaseClient
      .from('galleries')
      .select('id, name')
      .eq('id', galleryId)
      .single();

    if (galleryError) {
      console.error('Gallery not found:', galleryError);
      throw new Error("Gallery not found");
    }

    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2023-10-16",
    });

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      customer_email: clientEmail.trim(),
      line_items: [
        {
          price_data: {
            currency: "eur",
            product_data: {
              name: `${extraPhotosCount} Extra Photo${extraPhotosCount > 1 ? 's' : ''}`,
              description: `Additional photo selections for gallery: ${galleryData.name}`,
            },
            unit_amount: pricePerPhotoCents,
          },
          quantity: extraPhotosCount,
        },
      ],
      mode: "payment",
      success_url: `${req.headers.get("origin")}/gallery/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.get("origin")}/gallery/payment-cancelled`,
      metadata: {
        gallery_id: galleryId,
        client_email: clientEmail.trim(),
        extra_photos_count: extraPhotosCount.toString(),
      },
    });

    // Save payment session to database
    const { error: insertError } = await supabaseClient.from('payment_sessions').insert({
      gallery_id: galleryId,
      client_email: clientEmail.trim(),
      stripe_session_id: session.id,
      extra_photos_count: extraPhotosCount,
      amount_cents: totalAmount,
      status: 'pending',
    });

    if (insertError) {
      console.error('Failed to save payment session:', insertError);
      throw new Error("Failed to save payment session");
    }

    console.log('Payment session created successfully:', session.id);

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Payment creation error:', errorMessage);
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
