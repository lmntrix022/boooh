// Supabase Edge Function: send-notification-email
// Purpose: Envoyer des notifications par email aux propriétaires de cartes
// Triggers: Appointments, Orders (physical & digital), Quotes

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const PUBLIC_URL = Deno.env.get("PUBLIC_URL") || "https://booh.ga";

interface NotificationData {
  type: 'appointment' | 'order_physical' | 'order_digital' | 'quote';
  cardId: string;
  ownerId: string;
  clientName: string;
  clientEmail: string;
  clientPhone?: string;
  details: any; // Détails spécifiques selon le type
}

// Unified email template function (inspired by welcome email design)
function createUnifiedEmailTemplate(data: {
  emoji?: string;
  title: string;
  subtitle?: string;
  greeting?: string;
  content: string;
  ctaText?: string;
  ctaUrl?: string;
}): string {
  return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
  <title>${data.title}</title>
</head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">

  <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background:#0a0a0a;">
    <tr>
      <td align="center" style="padding:60px 20px 40px;">
        <table role="presentation" cellpadding="0" cellspacing="0" width="600" style="max-width:600px;">

          <!-- Animated gradient header -->
          <tr>
            <td style="padding:0 0 48px;">
              <div style="position:relative;padding:48px 32px;background:linear-gradient(135deg,#667eea 0%,#764ba2 50%,#f093fb 100%);border-radius:24px;overflow:hidden;box-shadow:0 20px 60px rgba(102,126,234,0.4);">
                <div style="position:absolute;top:0;left:0;right:0;bottom:0;background:radial-gradient(circle at 30% 50%,rgba(255,255,255,0.1) 0%,transparent 50%);"></div>
                <table role="presentation" width="100%" style="position:relative;">
                  <tr>
                    <td align="center">
                      ${data.emoji ? `<div style="font-size:56px;margin-bottom:16px;">${data.emoji}</div>` : ''}
                      <h1 style="margin:0 0 12px;font-size:32px;font-weight:700;color:#ffffff;letter-spacing:-1px;text-shadow:0 2px 20px rgba(0,0,0,0.2);">
                        ${data.title}
                      </h1>
                      ${data.subtitle ? `<p style="margin:0;font-size:18px;line-height:1.5;color:rgba(255,255,255,0.9);font-weight:500;">${data.subtitle}</p>` : ''}
                    </td>
                  </tr>
                </table>
              </div>
            </td>
          </tr>

          <!-- Main Content Card -->
          <tr>
            <td>
              <div style="background:rgba(255,255,255,0.05);backdrop-filter:blur(20px);border:1px solid rgba(255,255,255,0.1);border-radius:24px;padding:40px;box-shadow:0 8px 32px rgba(0,0,0,0.4);">
                ${data.greeting ? `<p style="margin:0 0 24px;font-size:18px;line-height:1.6;color:#ffffff;">${data.greeting}</p>` : ''}
                ${data.content}
              </div>
            </td>
          </tr>

          ${data.ctaText && data.ctaUrl ? `
          <!-- CTA Button -->
          <tr>
            <td align="center" style="padding:40px 0;">
              <div style="position:relative;display:inline-block;">
                <div style="position:absolute;top:-4px;left:-4px;right:-4px;bottom:-4px;background:linear-gradient(135deg,#667eea,#764ba2);border-radius:16px;opacity:0.5;filter:blur(20px);"></div>
                <a href="${data.ctaUrl}" style="position:relative;display:inline-block;padding:18px 56px;background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);color:#ffffff;text-decoration:none;border-radius:14px;font-size:18px;font-weight:600;letter-spacing:-0.3px;box-shadow:0 10px 40px rgba(102,126,234,0.4);border:1px solid rgba(255,255,255,0.2);">
                  ${data.ctaText}
                </a>
              </div>
            </td>
          </tr>
          ` : ''}

          <!-- Divider -->
          <tr>
            <td style="padding:48px 0 32px;">
              <div style="height:1px;background:linear-gradient(90deg,transparent 0%,rgba(255,255,255,0.2) 50%,transparent 100%);"></div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="padding:24px 0;">
              <p style="margin:0 0 12px;font-size:16px;color:rgba(255,255,255,0.7);">Une question ? Nous sommes là pour vous aider</p>
              <a href="mailto:contact@booh.ga" style="color:#667eea;text-decoration:none;font-size:16px;font-weight:600;">contact@booh.ga</a>
            </td>
          </tr>

          <tr>
            <td align="center" style="padding:32px 0 0;">
              <a href="https://www.booh.ga" style="color:rgba(255,255,255,0.6);text-decoration:none;font-size:14px;">www.booh.ga</a>
              <p style="margin:20px 0 0;font-size:13px;color:rgba(255,255,255,0.4);">© 2025 Booh. Construisez votre visibilité d'exception.</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

// Helper functions for email templates
function createDetailRow(label: string, value: string): string {
  return `
    <div style="display:flex;margin:12px 0;padding:16px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:12px;">
      <span style="font-weight:600;min-width:140px;color:rgba(255,255,255,0.7);">${label}</span>
      <span style="color:#ffffff;flex:1;">${value}</span>
    </div>
  `;
}

// Templates d'email
const EMAIL_TEMPLATES = {
  appointment: (data: any) => {
    const details = `
      ${createDetailRow('👤 Client', data.clientName)}
      ${createDetailRow('📧 Email', `<a href="mailto:${data.clientEmail}" style="color:#667eea;">${data.clientEmail}</a>`)}
      ${data.clientPhone ? createDetailRow('📱 Téléphone', `<a href="tel:${data.clientPhone}" style="color:#667eea;">${data.clientPhone}</a>`) : ''}
      ${data.appointmentDate ? createDetailRow('📅 Date', data.appointmentDate) : ''}
      ${data.appointmentTime ? createDetailRow('🕐 Horaires', data.appointmentTime) : ''}
      ${data.message ? `
      <div style="margin:16px 0;padding:16px;background:rgba(255,255,255,0.08);border-left:3px solid #667eea;border-radius:12px;">
        <p style="margin:0 0 8px;font-weight:600;color:rgba(255,255,255,0.7);">💬 Message:</p>
        <p style="margin:0;color:rgba(255,255,255,0.85);line-height:1.6;">${data.message}</p>
      </div>
      ` : ''}
    `;

    const content = `
      <p style="margin:0 0 24px;font-size:18px;line-height:1.7;color:rgba(255,255,255,0.85);text-align:center;">
        <strong style="background:linear-gradient(135deg,#667eea,#764ba2);-webkit-background-clip:text;-webkit-text-fill-color:transparent;font-weight:600;">${data.clientName}</strong> souhaite prendre rendez-vous avec vous
      </p>
      
      <div style="padding:32px;background:rgba(102,126,234,0.1);border:2px solid rgba(102,126,234,0.3);border-radius:20px;margin-bottom:24px;">
        <h2 style="margin:0 0 20px;font-size:24px;font-weight:700;color:#ffffff;">Détails du rendez-vous</h2>
        ${details}
      </div>

      <div style="padding:20px;background:rgba(255,215,0,0.1);border-left:4px solid #ffd700;border-radius:12px;margin-bottom:24px;">
        <p style="margin:0;font-size:16px;color:rgba(255,255,255,0.9);line-height:1.6;">
          ⚡ <strong style="color:#ffd700;">Action requise:</strong> Vous devez confirmer ou modifier ce rendez-vous dans votre tableau de bord.
        </p>
      </div>
    `;

    return {
      subject: `📅 Nouvelle demande de rendez-vous de ${data.clientName}`,
      html: createUnifiedEmailTemplate({
        emoji: '📅',
        title: 'Nouvelle Demande de Rendez-vous',
        subtitle: `${data.clientName} souhaite vous rencontrer`,
        greeting: '',
        content,
        ctaText: '🚀 Gérer mes rendez-vous',
        ctaUrl: data.manageUrl || `${PUBLIC_URL}/dashboard`,
      }),
    };
  },

  order_physical: (data: any) => {
    const details = `
      ${createDetailRow('👤 Client', data.clientName)}
      ${createDetailRow('📧 Email', `<a href="mailto:${data.clientEmail}" style="color:#667eea;">${data.clientEmail}</a>`)}
      ${data.clientPhone ? createDetailRow('📱 Téléphone', `<a href="tel:${data.clientPhone}" style="color:#667eea;">${data.clientPhone}</a>`) : ''}
      ${data.productName ? createDetailRow('📦 Produit', `<strong style="color:#ffffff;">${data.productName}</strong>`) : ''}
      ${data.quantity ? createDetailRow('🔢 Quantité', data.quantity.toString()) : ''}
      ${data.address ? createDetailRow('📍 Adresse', data.address) : ''}
      ${data.total ? createDetailRow('💰 Montant', `<strong style="color:#10b981;font-size:18px;">${data.total} ${data.currency || 'FCFA'}</strong>`) : ''}
    `;

    const content = `
      <div style="text-align:center;margin-bottom:32px;">
        <div style="font-size:64px;margin-bottom:16px;">🎉</div>
        <p style="margin:0;font-size:20px;line-height:1.6;color:rgba(255,255,255,0.85);">
          Félicitations ! Vous avez une nouvelle <strong style="color:#10b981;">commande</strong>.
        </p>
      </div>
      
      <div style="padding:32px;background:rgba(16,185,129,0.1);border:2px solid rgba(16,185,129,0.3);border-radius:20px;margin-bottom:24px;">
        <h2 style="margin:0 0 20px;font-size:24px;font-weight:700;color:#ffffff;">Détails de la commande</h2>
        ${details}
      </div>

      <div style="padding:20px;background:rgba(249,115,22,0.1);border-left:4px solid #f97316;border-radius:12px;margin-bottom:24px;">
        <p style="margin:0;font-size:16px;color:rgba(255,255,255,0.9);line-height:1.6;">
          📦 <strong style="color:#f97316;">Action requise:</strong> Contactez le client pour organiser la livraison.
        </p>
      </div>
    `;

    return {
      subject: `🛍️ Nouvelle commande de ${data.clientName}`,
      html: createUnifiedEmailTemplate({
        emoji: '🛍️',
        title: 'Nouvelle Commande',
        subtitle: `Félicitations ! Vous avez une nouvelle vente`,
        greeting: '',
        content,
        ctaText: '🚀 Gérer la commande',
        ctaUrl: data.manageUrl || `${PUBLIC_URL}/dashboard`,
      }),
    };
  },

  order_digital: (data: any) => {
    const details = `
      ${createDetailRow('👤 Client', data.clientName)}
      ${createDetailRow('📧 Email', `<a href="mailto:${data.clientEmail}" style="color:#667eea;">${data.clientEmail}</a>`)}
      ${data.productName ? createDetailRow('💿 Produit', `<strong style="color:#ffffff;">${data.productName}</strong>`) : ''}
      ${data.price ? createDetailRow('💰 Prix', `<strong style="color:#8b5cf6;font-size:18px;">${data.price} ${data.currency || 'FCFA'}</strong>`) : ''}
    `;

    const content = `
      <div style="text-align:center;margin-bottom:32px;">
        <div style="font-size:64px;margin-bottom:16px;">🎉</div>
        <p style="margin:0;font-size:20px;line-height:1.6;color:rgba(255,255,255,0.85);">
          Félicitations ! Vous avez vendu un <strong style="color:#8b5cf6;">produit digital</strong>.
        </p>
      </div>
      
      <div style="padding:32px;background:rgba(139,92,246,0.1);border:2px solid rgba(139,92,246,0.3);border-radius:20px;margin-bottom:24px;">
        <h2 style="margin:0 0 20px;font-size:24px;font-weight:700;color:#ffffff;">Détails de la vente</h2>
        ${details}
      </div>

      <div style="padding:20px;background:rgba(59,130,246,0.1);border-left:4px solid #3b82f6;border-radius:12px;margin-bottom:24px;">
        <p style="margin:0;font-size:16px;color:rgba(255,255,255,0.9);line-height:1.6;">
          💡 <strong style="color:#3b82f6;">Produit digital:</strong> Le client recevra automatiquement un lien de téléchargement sécurisé.
        </p>
      </div>
    `;

    return {
      subject: `💿 Nouvelle vente digitale de ${data.clientName}`,
      html: createUnifiedEmailTemplate({
        emoji: '💿',
        title: 'Nouvelle Vente Digitale',
        subtitle: `Félicitations ! Vous avez vendu un produit digital`,
        greeting: '',
        content,
        ctaText: '🚀 Voir les ventes',
        ctaUrl: data.manageUrl || `${PUBLIC_URL}/dashboard`,
      }),
    };
  },

  quote: (data: any) => {
    const details = `
      ${createDetailRow('👤 Client', data.clientName)}
      ${createDetailRow('📧 Email', `<a href="mailto:${data.clientEmail}" style="color:#667eea;">${data.clientEmail}</a>`)}
      ${data.clientPhone ? createDetailRow('📱 Téléphone', `<a href="tel:${data.clientPhone}" style="color:#667eea;">${data.clientPhone}</a>`) : ''}
      ${data.clientCompany ? createDetailRow('🏢 Entreprise', data.clientCompany) : ''}
      ${data.serviceRequested ? createDetailRow('🎯 Service', `<strong style="color:#ffffff;">${data.serviceRequested}</strong>`) : ''}
      ${data.budgetRange ? createDetailRow('💰 Budget', data.budgetRange) : ''}
      ${data.urgency ? createDetailRow('⚡ Priorité', `<span style="background:${data.urgency === 'high' ? 'rgba(239,68,68,0.2)' : 'rgba(245,158,11,0.2)'};color:${data.urgency === 'high' ? '#ef4444' : '#f59e0b'};padding:4px 12px;border-radius:12px;font-size:14px;font-weight:600;">${data.urgency === 'high' ? 'Urgent' : data.urgency === 'medium' ? 'Moyen' : 'Normal'}</span>`) : ''}
      ${data.projectDescription ? `
      <div style="margin:16px 0;padding:16px;background:rgba(255,255,255,0.08);border-left:3px solid #f59e0b;border-radius:12px;">
        <p style="margin:0 0 8px;font-weight:600;color:rgba(255,255,255,0.7);">📝 Description du projet:</p>
        <p style="margin:0;color:rgba(255,255,255,0.85);line-height:1.6;">${data.projectDescription}</p>
      </div>
      ` : ''}
    `;

    const content = `
      <p style="margin:0 0 24px;font-size:18px;line-height:1.7;color:rgba(255,255,255,0.85);text-align:center;">
        <strong style="background:linear-gradient(135deg,#667eea,#764ba2);-webkit-background-clip:text;-webkit-text-fill-color:transparent;font-weight:600;">${data.clientName}</strong> demande un devis pour vos services
      </p>
      
      <div style="padding:32px;background:rgba(245,158,11,0.1);border:2px solid rgba(245,158,11,0.3);border-radius:20px;margin-bottom:24px;">
        <h2 style="margin:0 0 20px;font-size:24px;font-weight:700;color:#ffffff;">Détails de la demande</h2>
        ${details}
      </div>

      <div style="padding:20px;background:rgba(255,215,0,0.1);border-left:4px solid #ffd700;border-radius:12px;margin-bottom:24px;">
        <p style="margin:0;font-size:16px;color:rgba(255,255,255,0.9);line-height:1.6;">
          ⚡ <strong style="color:#ffd700;">Action requise:</strong> Répondez rapidement à cette demande pour convertir cette opportunité.
        </p>
      </div>
    `;

    return {
      subject: `📋 Nouvelle demande de devis de ${data.clientName}`,
      html: createUnifiedEmailTemplate({
        emoji: '📋',
        title: 'Nouvelle Demande de Devis',
        subtitle: 'Opportunité commerciale',
        greeting: '',
        content,
        ctaText: '🚀 Répondre au devis',
        ctaUrl: data.manageUrl || `${PUBLIC_URL}/dashboard`,
      }),
    };
  },
};

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);
    const notification: NotificationData = await req.json();

    console.log('Processing notification:', notification.type);

    // Récupérer le profil du propriétaire
    const { data: card, error: cardError } = await supabase
      .from('business_cards')
      .select('id, name, user_id')
      .eq('id', notification.cardId)
      .maybeSingle();

    if (cardError || !card) {
      console.error('Card fetch error:', cardError);
      throw new Error(`Card not found: ${cardError?.message || 'Unknown error'}`);
    }

    // Récupérer l'email du propriétaire
    let ownerEmail = '';
    let ownerName = 'Propriétaire';

    const { data: profileOwner, error: profileError } = await supabase
      .from('profiles')
      .select('full_name, email')
      .eq('id', card.user_id)
      .maybeSingle();

    if (profileOwner) {
      ownerEmail = profileOwner.email || '';
      ownerName = profileOwner.full_name || ownerName;
    } else {
      // Fallback: récupérer depuis auth.users
      const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(card.user_id);
      if (authUser?.user?.email) {
        ownerEmail = authUser.user.email;
        ownerName = authUser.user.user_metadata?.full_name || authUser.user.email || ownerName;
      }
    }

    if (!ownerEmail) {
      throw new Error(`Owner email not found for user_id: ${card.user_id}`);
    }

    // Préparer les données selon le type
    let emailTemplate;
    let manageUrl = `${PUBLIC_URL}/dashboard`;

    switch (notification.type) {
      case 'appointment':
        manageUrl = `${PUBLIC_URL}/cards/${notification.cardId}/appointments`;
        emailTemplate = EMAIL_TEMPLATES.appointment({
          clientName: notification.clientName,
          clientEmail: notification.clientEmail,
          clientPhone: notification.clientPhone,
          appointmentDate: notification.details.date || 'N/A',
          appointmentTime: notification.details.time || 'N/A',
          message: notification.details.message || '',
          manageUrl
        });
        break;

      case 'order_physical':
        manageUrl = `${PUBLIC_URL}/cards/${notification.cardId}/orders`;
        emailTemplate = EMAIL_TEMPLATES.order_physical({
          clientName: notification.clientName,
          clientEmail: notification.clientEmail,
          clientPhone: notification.clientPhone,
          productName: notification.details.productName || 'Produit',
          quantity: notification.details.quantity || 1,
          address: notification.details.address || '',
          manageUrl
        });
        break;

      case 'order_digital':
        manageUrl = `${PUBLIC_URL}/cards/${notification.cardId}/orders`;
        emailTemplate = EMAIL_TEMPLATES.order_digital({
          clientName: notification.clientName,
          clientEmail: notification.clientEmail,
          productName: notification.details.productName || 'Produit digital',
          price: notification.details.price || 0,
          currency: notification.details.currency || 'XOF',
          manageUrl
        });
        break;

      case 'quote':
        manageUrl = `${PUBLIC_URL}/portfolio/quotes`;
        emailTemplate = EMAIL_TEMPLATES.quote({
          clientName: notification.clientName,
          clientEmail: notification.clientEmail,
          clientPhone: notification.clientPhone,
          clientCompany: notification.details.company || '',
          serviceRequested: notification.details.service || 'Service',
          budgetRange: notification.details.budget || '',
          projectDescription: notification.details.description || '',
          manageUrl
        });
        break;

      default:
        throw new Error(`Unknown notification type: ${notification.type}`);
    }

    // Envoyer l'email via Resend
    if (!RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY not configured');
    }

    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Bööh <notifications@booh.ga>',
        to: ownerEmail,
        subject: emailTemplate.subject,
        html: emailTemplate.html,
      }),
    });

    const resendData = await resendResponse.json();

    if (!resendResponse.ok) {
      console.error('Resend API error:', resendData);
      throw new Error(`Failed to send email: ${resendData.message || 'Unknown error'}`);
    }

    console.log('✅ Notification email sent successfully to:', ownerEmail);

    return new Response(
      JSON.stringify({ 
        success: true, 
        emailId: resendData.id,
        recipient: ownerEmail
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
        status: 200 
      }
    );

  } catch (error: any) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    );
  }
});

