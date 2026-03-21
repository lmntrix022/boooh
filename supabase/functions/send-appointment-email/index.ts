// Supabase Edge Function: send-appointment-email
// Purpose: Send appointment notifications via Resend
// Trigger: Called after appointment creation/update or via cron for reminders

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const PUBLIC_URL = Deno.env.get("PUBLIC_URL") || "https://booh.ga";

// Helper: Create calendar buttons section for emails
function createCalendarButtonsSection(calendarUrls: { google: string; yahoo: string; outlook: string; ics: string }): string {
  return `
    <div style="text-align:center;margin-top:32px;">
      <p style="margin:0 0 20px;font-size:16px;color:rgba(255,255,255,0.7);">📆 Ajouter à mon calendrier :</p>
      <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto;">
        <tr>
          <td style="padding:0 8px 8px;">
            <a href="${calendarUrls.google}" target="_blank" style="display:inline-block;padding:12px 24px;background:rgba(66,133,244,0.2);border:1px solid rgba(66,133,244,0.4);color:#4285f4;text-decoration:none;border-radius:10px;font-size:14px;font-weight:600;">
              📅 Google
            </a>
          </td>
          <td style="padding:0 8px 8px;">
            <a href="${calendarUrls.outlook}" target="_blank" style="display:inline-block;padding:12px 24px;background:rgba(0,120,212,0.2);border:1px solid rgba(0,120,212,0.4);color:#0078d4;text-decoration:none;border-radius:10px;font-size:14px;font-weight:600;">
              📧 Outlook
            </a>
          </td>
        </tr>
        <tr>
          <td style="padding:0 8px 8px;">
            <a href="${calendarUrls.yahoo}" target="_blank" style="display:inline-block;padding:12px 24px;background:rgba(106,13,173,0.2);border:1px solid rgba(106,13,173,0.4);color:#6a0dad;text-decoration:none;border-radius:10px;font-size:14px;font-weight:600;">
              📲 Yahoo
            </a>
          </td>
          <td style="padding:0 8px 8px;">
            <a href="${calendarUrls.ics}" target="_blank" style="display:inline-block;padding:12px 24px;background:rgba(255,255,255,0.1);border:1px solid rgba(255,255,255,0.3);color:#ffffff;text-decoration:none;border-radius:10px;font-size:14px;font-weight:600;">
              🍎 Apple/Autre
            </a>
          </td>
        </tr>
      </table>
      <p style="margin:16px 0 0;font-size:13px;color:rgba(255,255,255,0.5);">Cliquez sur un bouton pour ajouter le rendez-vous à votre calendrier</p>
    </div>
  `;
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
  calendarUrls?: { google: string; yahoo: string; outlook: string; ics: string };
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

          ${data.calendarUrls ? `
          <!-- Calendar Buttons -->
          <tr>
            <td align="center" style="padding:40px 0;">
              ${createCalendarButtonsSection(data.calendarUrls)}
            </td>
          </tr>
          ` : data.ctaText && data.ctaUrl ? `
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
              <a href="https://booh.ga" style="color:rgba(255,255,255,0.6);text-decoration:none;font-size:14px;">booh.ga</a>
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

// Email templates with unified design
const EMAIL_TEMPLATES = {
  // Template: New booking notification for card owner
  owner_new_booking: (data: any) => {
    const details = `
      ${createDetailRow('👤 Client', data.client_name)}
      ${createDetailRow('📧 Email', `<a href="mailto:${data.client_email}" style="color:#667eea;">${data.client_email}</a>`)}
      ${data.client_phone ? createDetailRow('📱 Téléphone', `<a href="tel:${data.client_phone}" style="color:#667eea;">${data.client_phone}</a>`) : ''}
      ${createDetailRow('📅 Date', data.date_formatted)}
      ${createDetailRow('⏱️ Durée', `${data.duration || 60} minutes`)}
                ${data.notes ? `
      <div style="margin:16px 0;padding:16px;background:rgba(255,255,255,0.08);border-left:3px solid #667eea;border-radius:12px;">
        <p style="margin:0 0 8px;font-weight:600;color:rgba(255,255,255,0.7);">📝 Notes:</p>
        <p style="margin:0;color:rgba(255,255,255,0.85);line-height:1.6;">${data.notes}</p>
                </div>
                ` : ''}
    `;

    const content = `
      <p style="margin:0 0 24px;font-size:18px;line-height:1.7;color:rgba(255,255,255,0.85);">
        Vous avez reçu une nouvelle demande de rendez-vous !
      </p>
      
      <div style="padding:32px;background:rgba(102,126,234,0.1);border:2px solid rgba(102,126,234,0.3);border-radius:20px;margin-bottom:24px;">
        <h2 style="margin:0 0 20px;font-size:24px;font-weight:700;color:#ffffff;">Détails du rendez-vous</h2>
        ${details}
              </div>

      <div style="padding:20px;background:rgba(255,215,0,0.1);border-left:4px solid #ffd700;border-radius:12px;margin-bottom:24px;">
        <p style="margin:0;font-size:16px;color:rgba(255,255,255,0.9);line-height:1.6;">
          💡 <strong style="color:#ffd700;">Action requise:</strong> Connectez-vous à votre tableau de bord pour confirmer ou refuser ce rendez-vous.
              </p>
            </div>
    `;

    return {
      subject: `📅 Nouveau rendez-vous: ${data.client_name}`,
      html: createUnifiedEmailTemplate({
        emoji: '📅',
        title: 'Nouveau Rendez-vous',
        subtitle: 'Vous avez reçu une nouvelle demande',
        greeting: `Bonjour,`,
        content,
        ctaText: '🚀 Gérer le rendez-vous',
        ctaUrl: data.manage_url || `${PUBLIC_URL}/dashboard`,
      }),
    };
  },

  // Template: Booking confirmation for client
  client_booking_confirmation: (data: any) => {
    const details = `
      ${createDetailRow('📅 Date et heure', data.date_formatted)}
      ${createDetailRow('⏱️ Durée estimée', `${data.duration || 60} minutes`)}
                ${data.notes ? `
      <div style="margin:16px 0;padding:16px;background:rgba(255,255,255,0.08);border-left:3px solid #667eea;border-radius:12px;">
        <p style="margin:0 0 8px;font-weight:600;color:rgba(255,255,255,0.7);">📝 Vos notes:</p>
        <p style="margin:0;color:rgba(255,255,255,0.85);line-height:1.6;">${data.notes}</p>
                </div>
                ` : ''}
    `;

    const content = `
      <div style="text-align:center;margin-bottom:32px;">
        <div style="font-size:64px;margin-bottom:16px;">🎉</div>
        <p style="margin:0 0 16px;font-size:20px;line-height:1.6;color:rgba(255,255,255,0.85);">
          Bonjour <strong style="background:linear-gradient(135deg,#667eea,#764ba2);-webkit-background-clip:text;-webkit-text-fill-color:transparent;font-weight:600;">${data.client_name}</strong>,
        </p>
        <p style="margin:0;font-size:18px;color:rgba(255,255,255,0.7);">
          Votre rendez-vous avec <strong style="color:#ffffff;">${data.card_name}</strong> a bien été enregistré.
                </p>
              </div>

      <div style="padding:24px;background:rgba(255,215,0,0.1);border:2px solid rgba(255,215,0,0.3);border-radius:16px;margin-bottom:24px;text-align:center;">
        <p style="margin:0;font-size:16px;color:#ffd700;font-weight:600;">⏳ En attente de confirmation</p>
      </div>

      <div style="padding:32px;background:rgba(102,126,234,0.1);border:2px solid rgba(102,126,234,0.3);border-radius:20px;margin-bottom:24px;">
        <h2 style="margin:0 0 20px;font-size:24px;font-weight:700;color:#ffffff;">Récapitulatif</h2>
        ${details}
              </div>

      <div style="padding:20px;background:rgba(249,115,22,0.1);border-left:4px solid #f97316;border-radius:12px;margin-bottom:24px;">
        <p style="margin:0;font-size:16px;color:rgba(255,255,255,0.9);line-height:1.6;">
          ⚠️ <strong style="color:#f97316;">Important:</strong> Ce rendez-vous est en attente de confirmation.
          Vous recevrez un email de confirmation une fois que <strong style="color:#ffffff;">${data.card_name}</strong> aura validé votre demande.
                </p>
              </div>

      ${data.owner_email ? `
      <div style="padding:24px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:16px;margin-bottom:24px;">
        <h3 style="margin:0 0 12px;font-size:18px;color:#ffffff;font-weight:600;">📞 Contact</h3>
        <p style="margin:0;font-size:16px;color:rgba(255,255,255,0.85);">
          Pour toute question, contactez directement:<br>
          <a href="mailto:${data.owner_email}" style="color:#667eea;text-decoration:none;font-weight:600;">${data.owner_email}</a>
              </p>
            </div>
      ` : ''}
    `;

    return {
      subject: `✅ Rendez-vous enregistré - ${data.card_name}`,
      html: createUnifiedEmailTemplate({
        emoji: '✅',
        title: 'Rendez-vous Enregistré',
        subtitle: 'Votre demande a été transmise avec succès',
        greeting: '',
        content,
        calendarUrls: data.calendarUrls,
      }),
    };
  },

  // Template: Appointment confirmed by owner
  client_appointment_confirmed: (data: any) => {
    const details = `
      ${createDetailRow('📅 Date', data.date_formatted)}
      ${createDetailRow('⏱️ Durée', `${data.duration || 60} minutes`)}
    `;

    const content = `
      <div style="text-align:center;margin-bottom:32px;">
        <div style="font-size:64px;margin-bottom:16px;">✅</div>
        <p style="margin:0 0 16px;font-size:22px;line-height:1.6;color:#ffffff;font-weight:600;">
          Excellente nouvelle <strong style="background:linear-gradient(135deg,#667eea,#764ba2);-webkit-background-clip:text;-webkit-text-fill-color:transparent;">${data.client_name}</strong> !
        </p>
        <p style="margin:0;font-size:18px;color:rgba(255,255,255,0.85);">
          <strong style="color:#ffffff;">${data.card_name}</strong> a confirmé votre rendez-vous.
        </p>
              </div>

      <div style="padding:32px;background:rgba(16,185,129,0.1);border:2px solid rgba(16,185,129,0.3);border-radius:20px;margin-bottom:24px;">
        <h2 style="margin:0 0 20px;font-size:24px;font-weight:700;color:#ffffff;">📅 Détails du rendez-vous</h2>
        ${details}
              </div>

      <div style="padding:20px;background:rgba(59,130,246,0.1);border-left:4px solid #3b82f6;border-radius:12px;margin-bottom:24px;">
        <p style="margin:0;font-size:16px;color:rgba(255,255,255,0.9);line-height:1.6;">
          💡 <strong style="color:#3b82f6;">Rappel:</strong> Vous recevrez un email de rappel 24h et 1h avant le rendez-vous.
                </p>
              </div>
    `;

    return {
      subject: `✅ Rendez-vous confirmé - ${data.card_name}`,
      html: createUnifiedEmailTemplate({
        emoji: '🎉',
        title: 'Rendez-vous Confirmé !',
        subtitle: '',
        greeting: '',
        content,
        calendarUrls: data.calendarUrls,
      }),
    };
  },

  // Template: Appointment cancelled
  client_appointment_cancelled: (data: any) => {
    const details = createDetailRow('📅 Date', data.date_formatted);

    const content = `
      <div style="text-align:center;margin-bottom:32px;">
        <div style="font-size:64px;margin-bottom:16px;">❌</div>
        <p style="margin:0 0 16px;font-size:20px;line-height:1.6;color:rgba(255,255,255,0.85);">
          Bonjour <strong style="background:linear-gradient(135deg,#667eea,#764ba2);-webkit-background-clip:text;-webkit-text-fill-color:transparent;font-weight:600;">${data.client_name}</strong>,
        </p>
        <p style="margin:0;font-size:18px;color:rgba(255,255,255,0.7);">
          Votre rendez-vous avec <strong style="color:#ffffff;">${data.card_name}</strong> a été annulé.
        </p>
              </div>

      <div style="padding:32px;background:rgba(239,68,68,0.1);border:2px solid rgba(239,68,68,0.3);border-radius:20px;margin-bottom:24px;">
        <h2 style="margin:0 0 20px;font-size:24px;font-weight:700;color:#ffffff;">Rendez-vous annulé</h2>
        ${details}
              </div>

      ${data.owner_email ? `
      <div style="padding:24px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:16px;margin-bottom:24px;">
        <p style="margin:0;font-size:16px;color:rgba(255,255,255,0.85);text-align:center;">
                Pour plus d'informations, contactez directement:<br>
          <a href="mailto:${data.owner_email}" style="color:#667eea;text-decoration:none;font-weight:600;">${data.owner_email}</a>
              </p>
            </div>
      ` : ''}
    `;

    return {
      subject: `❌ Rendez-vous annulé - ${data.card_name}`,
      html: createUnifiedEmailTemplate({
        emoji: '❌',
        title: 'Rendez-vous Annulé',
        subtitle: '',
        greeting: '',
        content,
        ctaText: '📅 Prendre un nouveau rendez-vous',
        ctaUrl: data.rebook_url || `${PUBLIC_URL}/dashboard`,
      }),
    };
  },

  // Template: Appointment modified by owner
  client_appointment_modified: (data: any) => {
    const details = `
      ${createDetailRow('📅 Nouvelle date', data.date_formatted)}
      ${createDetailRow('⏱️ Durée', `${data.duration || 60} minutes`)}
      ${data.modification_reason ? `
      <div style="margin:16px 0;padding:16px;background:rgba(255,255,255,0.08);border-left:3px solid #667eea;border-radius:12px;">
        <p style="margin:0 0 8px;font-weight:600;color:rgba(255,255,255,0.7);">💬 Raison:</p>
        <p style="margin:0;color:rgba(255,255,255,0.85);line-height:1.6;">${data.modification_reason}</p>
      </div>
      ` : ''}
    `;

    const content = `
      <div style="text-align:center;margin-bottom:32px;">
        <div style="font-size:64px;margin-bottom:16px;">📝</div>
        <p style="margin:0 0 16px;font-size:20px;line-height:1.6;color:rgba(255,255,255,0.85);">
          Bonjour <strong style="background:linear-gradient(135deg,#667eea,#764ba2);-webkit-background-clip:text;-webkit-text-fill-color:transparent;font-weight:600;">${data.client_name}</strong>,
        </p>
        <p style="margin:0;font-size:18px;color:rgba(255,255,255,0.7);">
          <strong style="color:#ffffff;">${data.card_name}</strong> a modifié votre rendez-vous.
        </p>
      </div>

      <div style="padding:32px;background:rgba(59,130,246,0.1);border:2px solid rgba(59,130,246,0.3);border-radius:20px;margin-bottom:24px;">
        <h2 style="margin:0 0 20px;font-size:24px;font-weight:700;color:#ffffff;">📅 Nouvelles informations</h2>
        ${details}
      </div>

      <div style="padding:20px;background:rgba(255,215,0,0.1);border-left:4px solid #ffd700;border-radius:12px;margin-bottom:24px;">
        <p style="margin:0;font-size:16px;color:rgba(255,255,255,0.9);line-height:1.6;">
          💡 <strong style="color:#ffd700;">Important:</strong> Pensez à mettre à jour votre calendrier avec les nouvelles informations.
        </p>
      </div>

      ${data.owner_email ? `
      <div style="padding:24px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:16px;margin-bottom:24px;">
        <h3 style="margin:0 0 12px;font-size:18px;color:#ffffff;font-weight:600;">📞 Contact</h3>
        <p style="margin:0;font-size:16px;color:rgba(255,255,255,0.85);">
          Pour toute question, contactez directement:<br>
          <a href="mailto:${data.owner_email}" style="color:#667eea;text-decoration:none;font-weight:600;">${data.owner_email}</a>
        </p>
      </div>
      ` : ''}
    `;

    return {
      subject: `📝 Rendez-vous modifié - ${data.card_name}`,
      html: createUnifiedEmailTemplate({
        emoji: '📝',
        title: 'Rendez-vous Modifié',
        subtitle: 'Votre rendez-vous a été mis à jour',
        greeting: '',
        content,
        calendarUrls: data.calendarUrls,
      }),
    };
  },

  // Template: Reminder (24h or 1h before)
  client_reminder: (data: any) => {
    const details = `
      ${createDetailRow('👤 Avec', data.card_name)}
      ${createDetailRow('📅 Date', data.date_formatted)}
      ${createDetailRow('⏱️ Durée', `${data.duration || 60} minutes`)}
                ${data.notes ? `
      <div style="margin:16px 0;padding:16px;background:rgba(255,255,255,0.08);border-left:3px solid #667eea;border-radius:12px;">
        <p style="margin:0 0 8px;font-weight:600;color:rgba(255,255,255,0.7);">📝 Notes:</p>
        <p style="margin:0;color:rgba(255,255,255,0.85);line-height:1.6;">${data.notes}</p>
                </div>
                ` : ''}
    `;

    const content = `
      <div style="text-align:center;margin-bottom:32px;">
        <div style="font-size:64px;margin-bottom:20px;">🔔</div>
        <div style="padding:24px;background:rgba(245,158,11,0.15);border:2px solid rgba(245,158,11,0.4);border-radius:20px;margin-bottom:24px;">
          <h2 style="margin:0 0 8px;color:#ffd700;font-size:32px;font-weight:700;">${data.time_until}</h2>
          <p style="margin:0;color:rgba(255,255,255,0.85);font-size:18px;">avant votre rendez-vous</p>
        </div>
              </div>

      <p style="margin:0 0 24px;font-size:18px;line-height:1.7;color:rgba(255,255,255,0.85);text-align:center;">
        Bonjour <strong style="background:linear-gradient(135deg,#667eea,#764ba2);-webkit-background-clip:text;-webkit-text-fill-color:transparent;font-weight:600;">${data.client_name}</strong>,
      </p>

      <div style="padding:32px;background:rgba(245,158,11,0.1);border:2px solid rgba(245,158,11,0.3);border-radius:20px;margin-bottom:24px;">
        <h2 style="margin:0 0 20px;font-size:24px;font-weight:700;color:#ffffff;">📅 Votre rendez-vous</h2>
        ${details}
              </div>

      ${data.owner_email ? `
      <div style="padding:20px;background:rgba(59,130,246,0.1);border-left:4px solid #3b82f6;border-radius:12px;margin-bottom:24px;">
        <p style="margin:0;font-size:16px;color:rgba(255,255,255,0.9);line-height:1.6;">
          💡 <strong style="color:#3b82f6;">Besoin d'annuler ?</strong> Contactez directement
          <a href="mailto:${data.owner_email}" style="color:#667eea;text-decoration:none;font-weight:600;">${data.owner_email}</a>
                </p>
              </div>
      ` : ''}
    `;

    return {
      subject: `⏰ Rappel: Rendez-vous ${data.time_until} - ${data.card_name}`,
      html: createUnifiedEmailTemplate({
        emoji: '⏰',
        title: 'Rappel de Rendez-vous',
        subtitle: '',
        greeting: '',
        content,
        calendarUrls: data.calendarUrls,
      }),
    };
  },
};

// Helper: Format date
function formatDate(dateString: string, timezone = 'UTC'): string {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('fr-FR', {
    dateStyle: 'full',
    timeStyle: 'short',
    timeZone: timezone,
  }).format(date);
}

// Helper: Generate calendar URLs for different providers
function generateCalendarUrls(appointment: {
  date: string;
  duration?: number;
  client_name: string;
  card_name: string;
  notes?: string;
}): { google: string; yahoo: string; outlook: string; ics: string } {
  const startDate = new Date(appointment.date);
  const endDate = new Date(startDate.getTime() + (appointment.duration || 60) * 60 * 1000);
  
  // Format dates for calendar URLs (YYYYMMDDTHHmmssZ)
  const formatCalendarDate = (date: Date): string => {
    return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  };
  
  const startStr = formatCalendarDate(startDate);
  const endStr = formatCalendarDate(endDate);
  
  const title = encodeURIComponent(`Rendez-vous avec ${appointment.card_name}`);
  const description = encodeURIComponent(appointment.notes || `Rendez-vous planifié avec ${appointment.card_name}`);
  const titleRaw = `Rendez-vous avec ${appointment.card_name}`;
  
  // Google Calendar URL
  const googleUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${startStr}/${endStr}&details=${description}`;
  
  // Outlook Web URL  
  const outlookUrl = `https://outlook.live.com/calendar/0/deeplink/compose?subject=${title}&startdt=${startDate.toISOString()}&enddt=${endDate.toISOString()}&body=${description}`;
  
  // Yahoo Calendar URL (works well on mobile)
  const yahooStart = startDate.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z/, 'Z');
  const yahooEnd = endDate.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z/, 'Z');
  const yahooUrl = `https://calendar.yahoo.com/?v=60&title=${title}&st=${yahooStart}&et=${yahooEnd}&desc=${description}`;
  
  // ICS download URL (for Apple Calendar and other apps)
  // Uses a page that generates and downloads the .ics file
  const icsParams = new URLSearchParams({
    title: titleRaw,
    start: startDate.toISOString(),
    end: endDate.toISOString(),
    description: appointment.notes || `Rendez-vous planifié avec ${appointment.card_name}`,
  });
  const icsUrl = `${PUBLIC_URL}/calendar/download?${icsParams.toString()}`;
  
  return {
    google: googleUrl,
    yahoo: yahooUrl,
    outlook: outlookUrl,
    ics: icsUrl
  };
}

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

    return true;
  } catch (error) {
    console.error("Failed to send email:", error);
    return false;
  }
}

// Helper: Log email
async function logEmail(
  supabase: any,
  appointmentId: string,
  emailType: string,
  recipientEmail: string,
  recipientType: string,
  status: string,
  errorMessage?: string
) {
  await supabase.from("appointment_email_logs").insert({
    appointment_id: appointmentId,
    email_type: emailType,
    recipient_email: recipientEmail,
    recipient_type: recipientType,
    status,
    error_message: errorMessage,
    sent_at: status === 'sent' ? new Date().toISOString() : null,
  });
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    // Parse request
    const { type, appointmentId } = await req.json();

    // Fetch appointment with card and owner details
    // Use maybeSingle() to handle missing appointments gracefully
    const { data: appointment, error: fetchError } = await supabase
      .from("appointments")
      .select(`
        *,
        business_cards!inner (
          id,
          name,
          user_id
        )
      `)
      .eq("id", appointmentId)
      .maybeSingle();

    if (fetchError) {
      console.error('Error fetching appointment:', fetchError);
      throw new Error(`Failed to fetch appointment: ${fetchError.message}`);
    }

    if (!appointment) {
      console.error('Appointment not found:', appointmentId);
      throw new Error(`Appointment not found: ${appointmentId}`);
    }

    const card = appointment.business_cards;
    
    // Fetch owner profile separately
    let ownerEmail = '';
    let ownerName = '';
    
    if (card?.user_id) {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('full_name, email')
        .eq('id', card.user_id)
        .maybeSingle();
      
      if (profile) {
        ownerEmail = profile.email || '';
        ownerName = profile.full_name || '';
      } else if (!profileError) {
        // Fallback to auth.users
        const { data: authUser } = await supabase.auth.admin.getUserById(card.user_id);
        if (authUser?.user?.email) {
          ownerEmail = authUser.user.email;
          ownerName = authUser.user.user_metadata?.full_name || authUser.user.email || '';
        }
      }
    }
    
    const owner = { email: ownerEmail, full_name: ownerName };
    const timezone = appointment.timezone || 'UTC';

    // Generate calendar URLs for the appointment
    const calendarUrls = generateCalendarUrls({
      date: appointment.date,
      duration: appointment.duration || 60,
      client_name: appointment.client_name,
      card_name: card.name,
      notes: appointment.notes,
    });

    // Prepare common data
    const commonData = {
      client_name: appointment.client_name,
      client_email: appointment.client_email,
      client_phone: appointment.client_phone,
      card_name: card.name,
      owner_email: owner.email,
      date_formatted: formatDate(appointment.date, timezone),
      duration: appointment.duration || 60,
      notes: appointment.notes,
      calendarUrls,
      manage_url: `${PUBLIC_URL}/cards/${card.id}/appointment-manager`,
      settings_url: `${PUBLIC_URL}/cards/${card.id}/settings`,
      rebook_url: `${PUBLIC_URL}/card/${card.id}`,
    };

    let emailSent = false;
    let emailType = type;

    // Send appropriate email based on type
    switch (type) {
      case 'owner_new_booking': {
        const template = EMAIL_TEMPLATES.owner_new_booking(commonData);
        emailSent = await sendEmail(owner.email, template.subject, template.html);
        await logEmail(supabase, appointmentId, emailType, owner.email, 'owner', emailSent ? 'sent' : 'failed');
        break;
      }

      case 'client_booking_confirmation': {
        const template = EMAIL_TEMPLATES.client_booking_confirmation(commonData);
        emailSent = await sendEmail(appointment.client_email, template.subject, template.html);
        await logEmail(supabase, appointmentId, emailType, appointment.client_email, 'client', emailSent ? 'sent' : 'failed');
        break;
      }

      case 'client_appointment_confirmed': {
        const template = EMAIL_TEMPLATES.client_appointment_confirmed(commonData);
        emailSent = await sendEmail(appointment.client_email, template.subject, template.html);
        await logEmail(supabase, appointmentId, emailType, appointment.client_email, 'client', emailSent ? 'sent' : 'failed');
        break;
      }

      case 'client_appointment_cancelled': {
        const template = EMAIL_TEMPLATES.client_appointment_cancelled(commonData);
        emailSent = await sendEmail(appointment.client_email, template.subject, template.html);
        await logEmail(supabase, appointmentId, emailType, appointment.client_email, 'client', emailSent ? 'sent' : 'failed');
        break;
      }

      case 'client_appointment_modified': {
        // Get modification reason if available (table may not exist)
        let modificationReason = null;
        try {
          const { data: modificationData } = await supabase
            .from('appointment_modifications')
            .select('reason, changes')
            .eq('appointment_id', appointmentId)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();
          
          modificationReason = modificationData?.reason || null;
          
          // Mark modification as notified
          if (modificationData) {
            await supabase
              .from('appointment_modifications')
              .update({ notification_sent: true })
              .eq('appointment_id', appointmentId)
              .eq('notification_sent', false);
          }
        } catch (e) {
          console.log("appointment_modifications table may not exist, skipping:", e);
        }
        
        const modifiedData = {
          ...commonData,
          modification_reason: modificationReason,
        };
        
        console.log("Sending modified email to:", appointment.client_email);
        const template = EMAIL_TEMPLATES.client_appointment_modified(modifiedData);
        emailSent = await sendEmail(appointment.client_email, template.subject, template.html);
        console.log("Email sent result:", emailSent);
        
        try {
          await logEmail(supabase, appointmentId, emailType, appointment.client_email, 'client', emailSent ? 'sent' : 'failed');
        } catch (e) {
          console.log("Failed to log email (table may not exist):", e);
        }
        break;
      }

      case 'client_reminder_24h':
      case 'client_reminder_1h': {
        const timeUntil = type === 'client_reminder_24h' ? 'dans 24 heures' : 'dans 1 heure';
        const template = EMAIL_TEMPLATES.client_reminder({ ...commonData, time_until: timeUntil });
        emailSent = await sendEmail(appointment.client_email, template.subject, template.html);
        await logEmail(supabase, appointmentId, emailType, appointment.client_email, 'client', emailSent ? 'sent' : 'failed');

        // Update reminder flag
        const reminderField = type === 'client_reminder_24h' ? 'reminder_24h_sent' : 'reminder_1h_sent';
        await supabase
          .from('appointments')
          .update({ [reminderField]: true })
          .eq('id', appointmentId);
        break;
      }

      default:
        throw new Error(`Unknown email type: ${type}`);
    }

    return new Response(
      JSON.stringify({ success: emailSent, type: emailType }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );

  } catch (error: any) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
    );
  }
});
