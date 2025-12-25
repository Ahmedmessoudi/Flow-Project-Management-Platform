import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface NotificationRequest {
  to: string;
  subject: string;
  message: string;
  type: "email" | "webhook";
  webhookUrl?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { to, subject, message, type, webhookUrl }: NotificationRequest = await req.json();

    if (type === "email") {
      // Note: Email functionality requires RESEND_API_KEY to be configured
      // For now, we'll just log the attempt
      console.log("Email notification requested:", { to, subject, message });

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "Email notification queued. Configure RESEND_API_KEY to enable email sending." 
        }),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders,
          },
        }
      );
    } else if (type === "webhook" && webhookUrl) {
      const webhookResponse = await fetch(webhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          subject,
          message,
          to,
          timestamp: new Date().toISOString(),
        }),
      });

      console.log("Webhook triggered:", webhookResponse.status);

      return new Response(
        JSON.stringify({ success: true, status: webhookResponse.status }),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders,
          },
        }
      );
    }

    return new Response(
      JSON.stringify({ error: "Invalid notification type" }),
      {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in send-notification function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
