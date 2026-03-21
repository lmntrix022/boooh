// Supabase Edge Function: send-quote-email
// Purpose: Send quote/devis notifications for portfolio services
// Trigger: Called after quote request or quote response

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createBoohEmailTemplate, createDetailRow } from "../_shared/emailTemplateBooh.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const PUBLIC_URL = Deno.env.get("PUBLIC_URL") || "https://booh.ga";

// Email templates — design BÖÖH onboarding
const EMAIL_TEMPLATES = {
  owner_new_quote: (data: any) => {
    const urgencyLabel = data.urgency === 'high' ? 'Urgent' : data.urgency === 'medium' ? 'Moyen' : 'Normal';
    const content = `
      <p style="margin:0 0 20px;">Vous avez reçu une nouvelle demande de devis !</p>
      ${createDetailRow('Client', data.client_name)}
      ${data.client_company ? createDetailRow('Entreprise', data.client_company) : ''}
      ${createDetailRow('Email', `<a href="mailto:${data.client_email}" style="color:#667eea;">${data.client_email}</a>`)}
      ${data.client_phone ? createDetailRow('Téléphone', `<a href="tel:${data.client_phone}" style="color:#667eea;">${data.client_phone}</a>`) : ''}
      ${createDetailRow('Service', data.service_requested)}
      ${data.budget_range ? createDetailRow('Budget', data.budget_range) : ''}
      ${data.urgency ? createDetailRow('Priorité', urgencyLabel) : ''}
      ${data.project_description ? createDetailRow('Description du projet', data.project_description) : ''}
      ${data.quote_view_url ? `
        <p style="margin:20px 0 0;padding:14px;background:rgba(255,255,255,0.06);border-radius:12px;word-break:break-all;color:rgba(255,255,255,0.9);">
          <strong>Lien du devis:</strong><br>
          <a href="${data.quote_view_url}" style="color:#667eea;">${data.quote_view_url}</a>
        </p>
      ` : ''}
      <p style="padding:16px;background:rgba(255,193,7,0.12);border-radius:12px;color:rgba(255,255,255,0.9);margin:20px 0 0;">
        💡 <strong>Action recommandée:</strong> Répondez rapidement pour maximiser vos chances de conversion.
      </p>
    `;
    return {
      subject: `💼 Nouvelle demande de devis: ${data.service_requested}`,
      html: createBoohEmailTemplate({
        title: '💼 Nouvelle demande de devis',
        subtitle: 'Opportunité commerciale',
        greeting: '',
        content,
        ctaText: 'Répondre au devis',
        ctaUrl: data.manage_url,
      }),
    };
  },

  client_quote_request: (data: any) => {
    const content = `
      <p style="margin:0 0 20px;">Merci <strong>${data.client_name}</strong> !</p>
      <p style="margin:0 0 24px;color:rgba(255,255,255,0.9);">Votre demande de devis a bien été transmise à <strong>${data.owner_name}</strong>.</p>
      ${createDetailRow('Service demandé', data.service_requested)}
      ${data.budget_range ? createDetailRow('Budget indicatif', data.budget_range) : ''}
      <p style="padding:16px;background:rgba(102,126,234,0.12);border-radius:12px;color:rgba(255,255,255,0.9);margin:20px 0;">
        ⏰ <strong>Prochaine étape:</strong> ${data.owner_name} va étudier votre demande et vous recontacter sous 48h pour vous proposer un devis personnalisé.
      </p>
      <p style="margin:20px 0 0;color:rgba(255,255,255,0.8);">
        Contact direct: <a href="mailto:${data.owner_email}" style="color:#667eea;">${data.owner_email}</a>
      </p>
    `;
    return {
      subject: `✅ Demande de devis reçue - ${data.service_requested}`,
      html: createBoohEmailTemplate({
        title: '✅ Demande enregistrée',
        subtitle: 'Votre demande de devis a été envoyée',
        greeting: '',
        content,
        ctaText: data.quote_view_url ? 'Suivre ma demande de devis' : undefined,
        ctaUrl: data.quote_view_url,
      }),
    };
  },

  client_quote_reminder: (data: any) => {
    const content = `
      <p style="margin:0 0 20px;">Bonjour <strong>${data.client_name}</strong>,</p>
      <p style="margin:0 0 24px;color:rgba(255,255,255,0.9);"><strong>${data.owner_name}</strong> vous a préparé un devis pour <strong>${data.service_requested}</strong>.</p>
      ${data.quote_amount ? `
        <div style="padding:20px;background:rgba(102,126,234,0.12);border-radius:14px;text-align:center;margin:20px 0;">
          <p style="margin:0;font-size:28px;font-weight:700;color:#fff;">${data.quote_amount} ${data.currency}</p>
        </div>
      ` : ''}
      <p style="margin:20px 0 0;color:rgba(255,255,255,0.8);">
        Si vous avez des questions, contactez <a href="mailto:${data.owner_email}" style="color:#667eea;">${data.owner_email}</a>
      </p>
    `;
    return {
      subject: `⏰ Rappel: Votre devis vous attend - ${data.service_requested}`,
      html: createBoohEmailTemplate({
        title: '⏰ Rappel',
        subtitle: 'Votre devis est prêt à être consulté',
        greeting: '',
        content,
        ctaText: data.quote_view_url ? 'Voir le devis et répondre' : undefined,
        ctaUrl: data.quote_view_url,
      }),
    };
  },

  client_quote_response: (data: any) => {
    const validUntil = data.quote_valid_until ? new Date(data.quote_valid_until).toLocaleDateString('fr-FR') : null;
    const content = `
      <p style="margin:0 0 20px;">Bonjour <strong>${data.client_name}</strong>,</p>
      <p style="margin:0 0 24px;color:rgba(255,255,255,0.9);"><strong>${data.owner_name}</strong> a préparé votre devis personnalisé.</p>
      <div style="padding:24px;background:rgba(102,126,234,0.12);border-radius:16px;text-align:center;margin:24px 0;">
        <p style="margin:0 0 8px;font-size:18px;font-weight:600;color:#fff;">${data.service_requested}</p>
        <p style="margin:0;font-size:32px;font-weight:700;color:#fff;">${data.quote_amount} ${data.currency}</p>
        ${validUntil ? `<p style="margin:12px 0 0;color:rgba(255,255,255,0.8);font-size:14px;">Valable jusqu'au ${validUntil}</p>` : ''}
      </div>
      ${data.proposal_notes ? `
        <div style="padding:20px;background:rgba(255,255,255,0.05);border-radius:12px;margin:20px 0;">
          <p style="margin:0 0 8px;font-weight:600;color:#fff;">📝 Détails de la proposition</p>
          <p style="margin:0;color:rgba(255,255,255,0.85);white-space:pre-line;">${data.proposal_notes}</p>
        </div>
      ` : ''}
      ${data.pdf_url ? `
        <p style="margin:20px 0;"><a href="${data.pdf_url}" style="color:#667eea;text-decoration:underline;">📄 Télécharger le devis PDF</a></p>
      ` : ''}
      <p style="padding:16px;background:rgba(16,185,129,0.15);border-radius:12px;color:rgba(255,255,255,0.9);margin:20px 0 0;">
        ✅ <strong>Intéressé ?</strong> Contactez <a href="mailto:${data.owner_email}" style="color:#667eea;">${data.owner_email}</a>
      </p>
    `;
    return {
      subject: `💰 Votre devis est prêt - ${data.service_requested}`,
      html: createBoohEmailTemplate({
        title: '💰 Votre devis est prêt !',
        greeting: '',
        content,
        ctaText: data.quote_view_url ? 'Voir le devis et accepter' : undefined,
        ctaUrl: data.quote_view_url,
      }),
    };
  },
};

// Helper: Send email via Resend
async function sendEmail(to: string, subject: string, html: string): Promise<boolean> {
  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Booh <notifications@booh.ga>",
        to: [to],
        subject,
        html,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("Resend API error:", error);
      return false;
    }

    console.log("✅ Email sent successfully to:", to);
    return true;
  } catch (error) {
    console.error("Failed to send email:", error);
    return false;
  }
}

serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  };

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    let body: { type?: string; quoteId?: string };
    try {
      body = await req.json();
    } catch {
      throw new Error("Corps de requête JSON invalide");
    }
    const { type, quoteId } = body;
    if (!type || !quoteId) {
      throw new Error("Paramètres manquants: type et quoteId requis");
    }

    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    console.log('Processing quote email:', { type, quoteId });

    // Fetch quote details (éviter jointure business_cards->profiles qui peut échouer)
    const { data: quote, error: fetchError } = await supabase
      .from('service_quotes')
      .select('*')
      .eq("id", quoteId)
      .single();

    if (fetchError || !quote) {
      console.error("Quote fetch error:", fetchError);
      throw new Error("Quote not found");
    }

    // Récupérer le profil propriétaire (user_id = profiles.id)
    const ownerUserId = quote.user_id;
    const { data: owner } = await supabase
      .from("profiles")
      .select("full_name, email")
      .eq("id", ownerUserId)
      .single();

    const quoteViewUrl = quote.public_token ? `${PUBLIC_URL}/quote/${quote.public_token}` : null;

    // Prepare common data
    const commonData = {
      client_name: quote.client_name,
      client_company: quote.client_company,
      client_email: quote.client_email,
      client_phone: quote.client_phone,
      service_requested: quote.service_requested,
      project_description: quote.project_description,
      budget_range: quote.budget_range,
      urgency: quote.urgency,
      quote_amount: quote.quote_amount,
      currency: quote.quote_currency || 'FCFA',
      quote_valid_until: quote.valid_until || quote.quote_expires_at,
      proposal_notes: quote.proposal_notes,
      pdf_url: quote.pdf_url,
      owner_name: owner?.full_name || 'Le prestataire',
      owner_email: owner?.email || '',
      manage_url: `${PUBLIC_URL}/portfolio/quotes`,
      quote_view_url: quoteViewUrl,
    };

    const ownerEmail = owner?.email || '';
    const clientEmail = quote.client_email || '';

    if (!ownerEmail && (type === 'owner_new_quote')) {
      throw new Error("Email propriétaire introuvable");
    }
    if (!clientEmail && ['client_quote_request', 'client_quote_response', 'client_quote_reminder'].includes(type)) {
      throw new Error("Email client introuvable");
    }

    let emailSent = false;

    // Send appropriate email based on type
    switch (type) {
      case 'owner_new_quote': {
        const template = EMAIL_TEMPLATES.owner_new_quote(commonData);
        emailSent = await sendEmail(ownerEmail, template.subject, template.html);
        break;
      }

      case 'client_quote_request': {
        const template = EMAIL_TEMPLATES.client_quote_request(commonData);
        emailSent = await sendEmail(clientEmail, template.subject, template.html);
        break;
      }

      case 'client_quote_response': {
        const template = EMAIL_TEMPLATES.client_quote_response(commonData);
        emailSent = await sendEmail(clientEmail, template.subject, template.html);
        break;
      }

      case 'client_quote_reminder': {
        const template = EMAIL_TEMPLATES.client_quote_reminder(commonData);
        emailSent = await sendEmail(clientEmail, template.subject, template.html);
        break;
      }

      default:
        throw new Error(`Unknown email type: ${type}`);
    }

    return new Response(
      JSON.stringify({ success: emailSent, type }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );

  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("Error:", msg, error);
    return new Response(
      JSON.stringify({ success: false, error: msg }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
    );
  }
});

