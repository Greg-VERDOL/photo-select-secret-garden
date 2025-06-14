
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

    if (!galleryId || !clientEmail || !extraPhotosCount) {
      throw new Error("Missing required fields");
    }

    // Initialize Supabase client with service role key
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Get price per extra photo from settings
    const { data: priceData, error: priceError } = await supabaseClient
      .from('app_settings')
      .select('value')
      .eq('key', 'price_per_extra_photo_cents')
      .single();

    if (priceError) throw new Error("Failed to get pricing");
    
    const pricePerPhotoCents = parseInt(priceData.value);
    const totalAmount = extraPhotosCount * pricePerPhotoCents;

    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2023-10-16",
    });

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      customer_email: clientEmail,
      line_items: [
        {
          price_data: {
            currency: "eur",
            product_data: {
              name: `${extraPhotosCount} Extra Photo${extraPhotosCount > 1 ? 's' : ''}`,
              description: `Additional photo selections beyond the free limit`,
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
        client_email: clientEmail,
        extra_photos_count: extraPhotosCount.toString(),
      },
    });

    // Save payment session to database
    await supabaseClient.from('payment_sessions').insert({
      gallery_id: galleryId,
      client_email: clientEmail,
      stripe_session_id: session.id,
      extra_photos_count: extraPhotosCount,
      amount_cents: totalAmount,
      status: 'pending',
    });

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error('Payment creation error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
