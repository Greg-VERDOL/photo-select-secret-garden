
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NotificationRequest {
  galleryId: string;
  clientEmail: string;
  clientName?: string;
  selectedPhotosCount: number;
  extraPhotosCount: number;
  totalCost: number;
  galleryName: string;
  accessCode: string;
  selectedPhotos?: Array<{
    id: string;
    filename: string;
    title?: string;
  }>;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Received notification request:', req.method, req.url);
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const notificationData: NotificationRequest = await req.json();
    console.log('Notification data:', JSON.stringify(notificationData, null, 2));

    // Get admin notification settings
    const { data: settings, error: settingsError } = await supabase
      .from('app_settings')
      .select('key, value')
      .in('key', [
        'price_per_extra_photo_cents', 
        'stripe_connected', 
        'watermark_text', 
        'watermark_style', 
        'center_watermark_text',
        'admin_notification_email',
        'notifications_enabled'
      ]);

    if (settingsError) {
      console.error('Error fetching settings:', settingsError);
      throw settingsError;
    }
    console.log('Fetched settings:', settings);

    const settingsMap = settings?.reduce((acc, setting) => {
      acc[setting.key] = setting.value;
      return acc;
    }, {} as Record<string, string>) || {};

    // Check if notifications are enabled (but allow test notifications to bypass)
    if (settingsMap.notifications_enabled !== 'true' && notificationData.galleryId !== 'test-notification') {
      console.log('Notifications are disabled');
      return new Response(JSON.stringify({ message: 'Notifications disabled' }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const adminEmail = settingsMap.admin_notification_email || 'admin@example.com';
    console.log(`Notifications enabled: ${settingsMap.notifications_enabled}. Admin email: ${adminEmail}`);

    // Check if notification was already sent for this gallery and client (skip for test)
    if (notificationData.galleryId !== 'test-notification') {
      const { data: existingNotification } = await supabase
        .from('admin_notifications')
        .select('id')
        .eq('gallery_id', notificationData.galleryId)
        .eq('client_email', notificationData.clientEmail)
        .eq('type', 'photo_selection')
        .single();

      if (existingNotification) {
        console.log('Notification already sent for this selection');
        return new Response(JSON.stringify({ message: 'Notification already sent' }), {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }
    }

    // Create email content
    const photosList = notificationData.selectedPhotos?.map(photo => 
      `• ${photo.title || photo.filename}`
    ).join('\n') || '';

    const paymentInfo = notificationData.extraPhotosCount > 0 
      ? `Payment required: €${notificationData.totalCost.toFixed(2)} for ${notificationData.extraPhotosCount} extra photos`
      : 'No payment required (within free limit)';

    const adminPanelUrl = `https://avmbtikrdufrrdpgrqgw.supabase.co`.replace('supabase.co', 'lovable.app') + '/admin';

    const emailContent = `
      <h2>New Photo Selection Received</h2>
      
      <h3>Client Information:</h3>
      <p><strong>Name:</strong> ${notificationData.clientName || 'Not provided'}</p>
      <p><strong>Email:</strong> ${notificationData.clientEmail}</p>
      
      <h3>Gallery Details:</h3>
      <p><strong>Gallery:</strong> ${notificationData.galleryName}</p>
      <p><strong>Access Code:</strong> ${notificationData.accessCode}</p>
      <p><strong>Photos Selected:</strong> ${notificationData.selectedPhotosCount}</p>
      <p><strong>Payment Status:</strong> ${paymentInfo}</p>
      
      ${photosList ? `<h3>Selected Photos:</h3><pre>${photosList}</pre>` : ''}
      
      <p><a href="${adminPanelUrl}" style="background-color: #3b82f6; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">View in Admin Panel</a></p>
      
      <p style="color: #666; font-size: 12px; margin-top: 20px;">
        This notification was sent automatically when a client submitted their photo selections.
      </p>
    `;

    // Send email using verified domain
    console.log(`Attempting to send email to ${adminEmail} from contact@flawvisuals.fr`);
    const emailResponse = await resend.emails.send({
      from: "Flawvisuals <contact@flawvisuals.fr>",
      to: [adminEmail],
      subject: `New Photo Selection - ${notificationData.galleryName}`,
      html: emailContent,
    });

    console.log("Admin notification sent:", emailResponse);

    // Record the notification in database, unless it's a test
    if (notificationData.galleryId !== 'test-notification') {
      await supabase
        .from('admin_notifications')
        .insert({
          type: 'photo_selection',
          gallery_id: notificationData.galleryId,
          client_email: notificationData.clientEmail,
          admin_email: adminEmail,
          status: 'sent',
          notification_data: notificationData
        });
    }

    return new Response(JSON.stringify({ success: true, emailResponse }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });

  } catch (error: any) {
    console.error("Error sending admin notification:", error);

    // Try to record the failed notification
    try {
      const supabase = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      );

      const notificationData: NotificationRequest = await req.json();
      
      await supabase
        .from('admin_notifications')
        .insert({
          type: 'photo_selection',
          gallery_id: notificationData.galleryId,
          client_email: notificationData.clientEmail,
          admin_email: 'unknown',
          status: 'failed',
          error_message: error.message,
          notification_data: notificationData
        });
    } catch (dbError) {
      console.error("Failed to record notification error:", dbError);
    }

    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
};

serve(handler);
