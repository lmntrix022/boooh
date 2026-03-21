// Supabase Edge Function pour l'envoi d'emails de facture
// Utilise Resend pour l'envoi d'emails

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createBoohEmailTemplate, createDetailRow } from "../_shared/emailTemplateBooh.ts";

// Interface pour les données de la requête
interface InvoiceEmailRequest {
  invoice_number: string;
  client_name: string;
  client_email: string;
  total_ttc: number;
  issue_date: string;
  due_date: string;
  pdf_url?: string;
  pdf_base64?: string;
  custom_message?: string;
  custom_subject?: string;
  email_type?: 'invoice' | 'crm' | 'appointment' | 'quote' | 'follow-up' | 'upsell' | 'reactivation';
  user_email?: string;
  user_name?: string;
  has_pdf_attachment?: boolean;
}

// Template universel (CRM, relance, upsell, etc.) — design onboarding
function getUniversalTemplate(data: InvoiceEmailRequest): string {
  const getTypeInfo = (type?: string) => {
    switch (type) {
      case 'crm': return { icon: '💼', title: 'Message CRM' };
      case 'follow-up': return { icon: '🔄', title: 'Relance' };
      case 'upsell': return { icon: '📈', title: 'Offre spéciale' };
      case 'reactivation': return { icon: '⚡', title: 'Réactivation' };
      case 'appointment': return { icon: '📅', title: 'Rendez-vous' };
      case 'quote': return { icon: '💰', title: 'Devis' };
      default: return { icon: '💼', title: 'Message BÖÖH' };
    }
  };
  const typeInfo = getTypeInfo(data.email_type);
  const title = data.custom_subject || typeInfo.title;
  const message = (data.custom_message || '').replace(/\n/g, '<br>');
  let ctaText = '';
  let ctaUrl = '';
  if (data.email_type === 'upsell') { ctaText = 'Découvrir nos offres'; ctaUrl = 'https://www.booh.ga/pricing'; }
  else if (data.email_type === 'follow-up') { ctaText = 'Répondre à ce message'; ctaUrl = `mailto:${data.user_email || 'contact@booh.ga'}`; }
  else if (data.email_type === 'reactivation') { ctaText = 'Nous contacter'; ctaUrl = 'mailto:contact@booh.ga'; }
  const footerExtra = [
    'Cet email a été envoyé depuis votre CRM BÖÖH',
    data.user_name ? `Envoyé par ${data.user_name}` : '',
    data.user_email ? `Contact: ${data.user_email}` : '',
  ].filter(Boolean).join(' • ');
  return createBoohEmailTemplate({
    title: `${typeInfo.icon} ${title}`,
    greeting: `Bonjour <strong>${data.client_name}</strong>,`,
    content: `<p style="margin:0 0 16px;">${message || 'Vous avez reçu un message de votre partenaire BÖÖH.'}</p>`,
    ctaText: ctaText || undefined,
    ctaUrl: ctaUrl || undefined,
    footerExtra,
  });
}

// Template facture — design onboarding
function getInvoiceTemplate(data: InvoiceEmailRequest): string {
  const issueStr = new Date(data.issue_date).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' });
  const dueStr = new Date(data.due_date).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' });
  const totalStr = data.total_ttc.toLocaleString('fr-FR') + ' FCFA';
  const attachmentNote = data.has_pdf_attachment
    ? `<p style="padding:20px;background:rgba(255,255,255,0.06);border-radius:14px;margin:20px 0;color:rgba(255,255,255,0.9);">
       Le PDF de votre facture est en <strong>pièce jointe</strong> de cet email.<br>
       Ouvrez la pièce jointe "Facture-${data.invoice_number}.pdf" pour télécharger votre facture.
     </p>`
    : '';
  const content = `
    <p style="margin:0 0 20px;">Votre facture est maintenant disponible.</p>
    ${createDetailRow('Date d\'émission', issueStr)}
    ${createDetailRow('Date d\'échéance', dueStr)}
    ${createDetailRow('Montant total', totalStr)}
    ${attachmentNote}
    <p style="margin:20px 0 0;color:rgba(255,255,255,0.8);">Merci de procéder au règlement avant la date d'échéance. Pour toute question, n'hésitez pas à nous contacter.</p>
  `;
  const footerExtra = data.user_name ? `Cordialement, ${data.user_name}` : undefined;
  return createBoohEmailTemplate({
    title: 'Facture Reçue',
    subtitle: `Facture ${data.invoice_number}`,
    greeting: `Bonjour <strong>${data.client_name}</strong>,`,
    content,
    footerExtra,
  });
}

// Fonction principale
serve(async (req) => {
  // CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  };

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Vérifier l'authentification via l'en-tête apikey (standard Supabase)
    const apiKey = req.headers.get('apikey');
    const authHeader = req.headers.get('Authorization');
    
    if (!apiKey && !authHeader) {
      console.error('Missing authentication headers');
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Missing authentication. Please ensure you are logged in.'
        }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log('✓ Authentication headers present');

    // Récupérer les données de la requête
    const data: InvoiceEmailRequest = await req.json();

    console.log('Received email request for invoice:', data.invoice_number);

    // Validation des données
    if (!data.client_email || !data.invoice_number) {
      console.error('Missing required fields:', {
        has_email: !!data.client_email,
        has_invoice_number: !!data.invoice_number
      });
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Missing required fields: client_email, invoice_number'
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
      console.error('RESEND_API_KEY not configured in environment');
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Email service not configured. Please set RESEND_API_KEY in Supabase Vault.'
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Ne jamais inclure d'URL longue (data URI base64 ou URL signée) dans l'email
    // Le PDF est envoyé en pièce jointe ; on affiche uniquement le message "voir pièce jointe"
    const hasPdfAttachment = !!(data.pdf_base64 || data.pdf_url);

    const templateData = {
      ...data,
      has_pdf_attachment: hasPdfAttachment,
    };

    // Choisir le bon template selon le type d'email
    // Par défaut, utiliser getInvoiceTemplate pour les factures
    const emailHtml = data.email_type && data.email_type !== 'invoice' 
      ? getUniversalTemplate(templateData) 
      : getInvoiceTemplate(templateData);

    // Préparer les données pour Resend
    // Utiliser le domaine vérifié booh.ga pour envoyer à tous les emails
    const fromEmail = 'Booh <noreply@booh.ga>';
    
    // Envoyer directement au client
    const actualRecipient = data.client_email;
    console.log(`📧 Sending email to: ${actualRecipient}`);

    // Déterminer le sujet selon le type d'email
    const emailSubject = data.custom_subject || 
      (data.email_type && data.email_type !== 'invoice' ? data.custom_subject : 
        `Facture ${data.invoice_number} - ${data.total_ttc.toLocaleString('fr-FR')} FCFA`);

    const emailData: any = {
      from: fromEmail,
      to: [actualRecipient],
      subject: emailSubject,
      html: emailHtml,
    };

    // Si un PDF est fourni, l'ajouter en pièce jointe
    if (data.pdf_base64) {
      try {
        console.log(`📎 Attaching PDF from base64 data (${data.pdf_base64.length} chars)`);
        
        emailData.attachments = [
          {
            filename: `facture-${data.invoice_number}.pdf`,
            content: data.pdf_base64,
            disposition: 'attachment',
            type: 'application/pdf'
          }
        ];
        
        console.log(`✅ PDF attached successfully from base64`);
      } catch (error) {
        console.error(`❌ Error attaching PDF from base64:`, error);
        console.warn(`⚠️ Continuing without PDF attachment...`);
      }
    } else if (data.pdf_url) {
      try {
        console.log(`📎 Downloading PDF from: ${data.pdf_url}`);
        
        // Télécharger le PDF depuis l'URL
        const pdfResponse = await fetch(data.pdf_url, {
          headers: {
            'User-Agent': 'Booh-Invoice-Service/1.0'
          }
        });
        
        if (!pdfResponse.ok) {
          console.warn(`⚠️ Could not download PDF: ${pdfResponse.status} - ${pdfResponse.statusText}`);
          console.warn(`⚠️ PDF URL might be invalid or require authentication: ${data.pdf_url}`);
        } else {
          const contentType = pdfResponse.headers.get('content-type');
          if (!contentType || !contentType.includes('pdf')) {
            console.warn(`⚠️ URL does not return a PDF file (content-type: ${contentType})`);
          } else {
            // Convertir en base64 pour Resend
            const pdfBuffer = await pdfResponse.arrayBuffer();
            
            if (pdfBuffer.byteLength > 25 * 1024 * 1024) { // 25MB limit for Resend
              console.warn(`⚠️ PDF too large (${pdfBuffer.byteLength} bytes), skipping attachment`);
            } else {
              const pdfBase64 = btoa(String.fromCharCode(...new Uint8Array(pdfBuffer)));
              
              emailData.attachments = [
                {
                  filename: `facture-${data.invoice_number}.pdf`,
                  content: pdfBase64,
                  disposition: 'attachment',
                  type: 'application/pdf'
                },
              ];
              
              console.log(`✅ PDF attached successfully (${pdfBuffer.byteLength} bytes)`);
            }
          }
        }
      } catch (error) {
        console.error(`❌ Error downloading PDF:`, error);
        console.warn(`⚠️ Continuing without PDF attachment...`);
        // Continuer sans pièce jointe si le téléchargement échoue
      }
    } else {
      console.log(`ℹ️ No PDF URL or base64 provided, sending email without attachment`);
    }

    // Envoyer l'email via Resend
    console.log('Sending email to:', data.client_email);
    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(emailData),
    });

    const responseText = await resendResponse.text();
    console.log('Resend API response status:', resendResponse.status);
    console.log('Resend API response body:', responseText);

    if (!resendResponse.ok) {
      console.error('Resend API error:', {
        status: resendResponse.status,
        statusText: resendResponse.statusText,
        body: responseText
      });

      let errorMessage = 'Failed to send email via Resend';
      let errorDetails: any = {
        status: resendResponse.status,
        statusText: resendResponse.statusText
      };

      try {
        const errorData = JSON.parse(responseText);
        errorMessage = errorData.message || errorMessage;

        // Si c'est une erreur de domaine non vérifié, donner des instructions claires
        if (resendResponse.status === 403 && errorMessage.includes('testing emails')) {
          errorMessage = `You can only send testing emails to your own email address (${data.user_email || 'your registered email'}). To send emails to other recipients, please verify a domain at resend.com/domains, and change the \`from\` address to an email using this domain.`;
        }

        errorDetails = errorData;
      } catch {
        errorMessage = responseText || errorMessage;
      }

      return new Response(
        JSON.stringify({
          success: false,
          error: errorMessage,
          details: errorDetails,
          debug: {
            pdf_base64_received: !!data.pdf_base64,
            pdf_base64_length: data.pdf_base64?.length || 0,
            invoice_number: data.invoice_number,
          }
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
        message: `Email sent successfully to ${actualRecipient}`,
        email_id: resendResult.id,
        recipient: actualRecipient,
        debug: {
          pdf_base64_received: !!data.pdf_base64,
          pdf_base64_length: data.pdf_base64?.length || 0,
          pdf_base64_attached: !!emailData.attachments,
          invoice_number: data.invoice_number,
        }
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
