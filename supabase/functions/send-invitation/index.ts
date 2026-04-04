import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const RESEND_API_KEY = "re_PoUjTYY9_8QSKiWyJjXuTFm7w355LzEQR";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface InvitationEmail {
  email: string;
  firstName: string;
  lastName: string;
  roleName: string;
  companyName: string;
  inviterName: string;
  acceptUrl: string;
}

async function sendInvitationEmail(data: InvitationEmail) {
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${RESEND_API_KEY}`,
    },
    body: JSON.stringify({
      from: "StockFlow <onboarding@resend.dev>",
      to: [data.email],
      subject: `Invitation à rejoindre ${data.companyName}`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Invitation StockFlow</title>
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 28px;">🎉 Invitation StockFlow</h1>
            </div>
            
            <div style="background: #ffffff; padding: 30px; border: 1px solid #e1e1e1; border-top: none; border-radius: 0 0 12px 12px;">
              <p style="font-size: 16px; margin-bottom: 20px;">
                Bonjour <strong>${data.firstName} ${data.lastName}</strong>,
              </p>
              
              <p style="font-size: 16px; margin-bottom: 20px;">
                <strong>${data.inviterName}</strong> vous invite à rejoindre l'organisation 
                <strong>${data.companyName}</strong> sur StockFlow avec le rôle 
                <strong>${data.roleName}</strong>.
              </p>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${data.acceptUrl}" 
                   style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                          color: white; text-decoration: none; padding: 14px 40px; 
                          border-radius: 8px; font-weight: 600; font-size: 16px;">
                  Accepter l'invitation
                </a>
              </div>
              
              <p style="font-size: 14px; color: #666; margin-bottom: 20px;">
                Ou copiez-collez ce lien dans votre navigateur :
              </p>
              <p style="font-size: 12px; color: #999; word-break: break-all; background: #f5f5f5; padding: 10px; border-radius: 4px;">
                ${data.acceptUrl}
              </p>
              
              <hr style="border: none; border-top: 1px solid #e1e1e1; margin: 30px 0;">
              
              <p style="font-size: 14px; color: #666;">
                Cette invitation expirera dans <strong>7 jours</strong>.
              </p>
              
              <p style="font-size: 14px; color: #666; margin-top: 20px;">
                Si vous n'attendiez pas cette invitation, vous pouvez ignorer cet email.
              </p>
            </div>
            
            <div style="text-align: center; padding: 20px; color: #999; font-size: 12px;">
              <p>© ${new Date().getFullYear()} StockFlow. Tous droits réservés.</p>
            </div>
          </body>
        </html>
      `,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Resend API error: ${error}`);
  }

  return await response.json();
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { email, firstName, lastName, roleName, companyName, inviterName, acceptUrl } = await req.json();

    if (!email || !acceptUrl) {
      throw new Error("Email and acceptUrl are required");
    }

    const result = await sendInvitationEmail({
      email,
      firstName: firstName || "",
      lastName: lastName || "",
      roleName: roleName || "Utilisateur",
      companyName: companyName || "StockFlow",
      inviterName: inviterName || "L'équipe StockFlow",
      acceptUrl,
    });

    return new Response(JSON.stringify({ success: true, data: result }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Error sending invitation:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
