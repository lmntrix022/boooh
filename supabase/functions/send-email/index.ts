// Supabase Edge Function pour l'envoi d'emails génériques
// Utilise Resend pour l'envoi d'emails depuis le CRM

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

// Interface pour les données de la requête
interface EmailRequest {
  to: string;
  subject: string;
  message: string;
  type?: 'crm' | 'follow-up' | 'upsell' | 'reactivation';
  contact_name?: string;
  user_name?: string;
  user_email?: string;
}

// Template HTML pour les emails CRM
function getEmailTemplate(data: EmailRequest): string {
  return `
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${data.subject}</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f8f9fa;
        }
        .container {
            background: white;
            border-radius: 12px;
            padding: 30px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 2px solid #f0f0f0;
        }
        .logo {
            font-size: 24px;
            font-weight: bold;
            color: #2563eb;
            margin-bottom: 10px;
        }
        .content {
            margin-bottom: 30px;
        }
        .footer {
            text-align: center;
            padding-top: 20px;
            border-top: 1px solid #f0f0f0;
            color: #666;
            font-size: 14px;
        }
        .highlight {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 15px;
            border-radius: 8px;
            margin: 20px 0;
        }
        .cta-button {
            display: inline-block;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 12px 24px;
            text-decoration: none;
            border-radius: 6px;
            font-weight: bold;
            margin: 15px 0;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">bööh</div>
            <p style="color: #666; margin: 0;">Votre carte de visite nouvelle génération</p>
        </div>
        
        <div class="content">
            ${data.contact_name ? `<p>Bonjour ${data.contact_name},</p>` : '<p>Bonjour,</p>'}
            
            <div class="highlight">
                <h3 style="margin: 0 0 10px 0;">${data.subject}</h3>
            </div>
            
            <div style="white-space: pre-line;">${data.message}</div>
            
            ${data.type === 'upsell' ? `
                <div style="text-align: center; margin: 25px 0;">
                    <a href="#" class="cta-button">Découvrir nos offres</a>
                </div>
            ` : ''}
            
            ${data.type === 'follow-up' ? `
                <div style="text-align: center; margin: 25px 0;">
                    <a href="#" class="cta-button">Répondre à ce message</a>
                </div>
            ` : ''}
        </div>
        
        <div class="footer">
            <p>Cet email a été envoyé depuis votre CRM bööh</p>
            ${data.user_name ? `<p>Envoyé par ${data.user_name}</p>` : ''}
            ${data.user_email ? `<p>Contact: ${data.user_email}</p>` : ''}
        </div>
    </div>
</body>
</html>
  `;
}

// Fonction principale
serve(async (req) => {
  // CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Pour le formulaire de contact public, on accepte les requêtes avec la clé API anonyme
    // Supabase envoie automatiquement la clé API anonyme dans le header 'apikey'
    // On note la présence des headers mais on ne bloque pas si ils sont absents
    // (Supabase bloque déjà les requêtes invalides avant qu'elles n'arrivent ici)
    const apiKey = req.headers.get('apikey');
    const authHeader = req.headers.get('Authorization');
    
    console.log('Request received', { 
      hasApiKey: !!apiKey, 
      hasAuth: !!authHeader,
      method: req.method,
      url: req.url 
    });

    // Récupérer les données de la requête
    let data: EmailRequest;
    try {
      const contentType = req.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        data = await req.json();
      } else {
        // Fallback: essayer de parser comme JSON
        const text = await req.text();
        data = JSON.parse(text);
      }
    } catch (parseError) {
      console.error('Error parsing request:', parseError);
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Invalid request format. Expected JSON.'
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log('Received email request:', { 
      to: data.to, 
      subject: data.subject, 
      message: data.message ? 'present' : 'missing',
      type: data.type,
      contact_name: data.contact_name
    });

    // Validation des données
    if (!data.to || !data.subject || !data.message) {
      console.error('Missing required fields:', {
        has_to: !!data.to,
        has_subject: !!data.subject,
        has_message: !!data.message,
        to_value: data.to,
        subject_value: data.subject,
        message_value: data.message
      });
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Missing required fields: to, subject, message',
          debug: {
            has_to: !!data.to,
            has_subject: !!data.subject,
            has_message: !!data.message
          }
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Récupérer la clé API Resend depuis les variables d'environnement
    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');

    if (!RESEND_API_KEY) {
      console.error('RESEND_API_KEY not found in environment variables');
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Email service not configured. Please contact support.'
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log('✓ Resend API key found');

    // Générer le template HTML
    const htmlContent = getEmailTemplate(data);

    // Préparer la requête pour Resend
    // Utiliser le domaine vérifié booh.ga
    const resendPayload = {
      from: 'Bööh <contact@booh.ga>', // Domaine vérifié dans Resend
      to: [data.to],
      subject: data.subject,
      html: htmlContent,
    };

    console.log('Sending email via Resend to:', data.to);

    // Envoyer l'email via Resend
    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(resendPayload),
    });

    const responseText = await resendResponse.text();
    console.log('Resend response status:', resendResponse.status);
    console.log('Resend response:', responseText);

    if (!resendResponse.ok) {
      let errorMessage = `Failed to send email (Status: ${resendResponse.status})`;
      let errorDetails = responseText;

      try {
        const errorData = JSON.parse(responseText);
        if (errorData.message) {
          errorMessage = errorData.message;
        }
        if (errorData.details) {
          errorDetails = errorData.details;
        }
      } catch {
        errorMessage = responseText || errorMessage;
      }

      return new Response(
        JSON.stringify({
          success: false,
          error: errorMessage,
          details: errorDetails
        }),
        {
          status: resendResponse.status,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const resendResult = JSON.parse(responseText);
    console.log('Email sent successfully:', resendResult.id);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Email sent successfully to ${data.to}`,
        email_id: resendResult.id,
        recipient: data.to,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : undefined;

    console.error('Error sending email:', {
      message: errorMessage,
      stack: errorStack,
      error: error
    });

    return new Response(
      JSON.stringify({
        success: false,
        error: 'Failed to send email',
        details: errorMessage,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
