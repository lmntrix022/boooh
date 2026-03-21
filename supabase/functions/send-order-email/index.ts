// Supabase Edge Function: send-order-email
// Purpose: Send order notifications for e-commerce (physical & digital products)
// Trigger: Called after order creation or payment confirmation

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createBoohEmailTemplate, createDetailRow } from "../_shared/emailTemplateBooh.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const PUBLIC_URL = Deno.env.get("PUBLIC_URL") || "https://booh.ga";

// Email templates — design BÖÖH onboarding
const EMAIL_TEMPLATES = {
  owner_new_order: (data: any) => {
    const orderType = data.is_digital ? 'vente digitale' : 'commande';
    const content = `
      <p style="margin:0 0 20px;">Félicitations ! Vous avez une nouvelle vente.</p>
      ${createDetailRow('Client', data.client_name)}
      ${createDetailRow('Email', `<a href="mailto:${data.client_email}" style="color:#667eea;">${data.client_email}</a>`)}
      ${data.client_phone ? createDetailRow('Téléphone', `<a href="tel:${data.client_phone}" style="color:#667eea;">${data.client_phone}</a>`) : ''}
      ${createDetailRow(data.is_digital ? 'Produit digital' : 'Produit', data.product_name)}
      ${createDetailRow('Quantité', String(data.quantity))}
      ${data.notes ? createDetailRow('Notes client', data.notes) : ''}
      <div style="padding:20px;background:rgba(102,126,234,0.12);border-radius:14px;margin:20px 0;text-align:center;">
        <p style="margin:0;color:rgba(255,255,255,0.8);font-size:14px;">Montant total</p>
        <p style="margin:8px 0 0;font-size:24px;font-weight:700;color:#fff;">${data.total} ${data.currency}</p>
      </div>
      ${data.is_digital ? `
        <p style="padding:16px;background:rgba(102,126,234,0.08);border-radius:12px;color:rgba(255,255,255,0.9);margin:16px 0;">
          💡 <strong>Produit digital:</strong> Le client recevra automatiquement un lien de téléchargement sécurisé.
        </p>
      ` : `
        <p style="padding:16px;background:rgba(255,193,7,0.12);border-radius:12px;color:rgba(255,255,255,0.9);margin:16px 0;">
          📦 <strong>Action requise:</strong> Contactez le client pour organiser la livraison.
        </p>
      `}
    `;
    return {
      subject: `🛍️ Nouvelle ${orderType}: ${data.product_name}`,
      html: createBoohEmailTemplate({
        title: '💰 Nouvelle vente !',
        subtitle: `Vous avez reçu une nouvelle ${orderType}`,
        greeting: '',
        content,
        ctaText: 'Gérer la commande',
        ctaUrl: data.manage_url,
      }),
    };
  },

  client_order_confirmation: (data: any) => {
    const content = `
      <p style="margin:0 0 20px;">Merci <strong>${data.client_name}</strong> !</p>
      <p style="margin:0 0 24px;color:rgba(255,255,255,0.9);">Votre commande a bien été enregistrée et ${data.owner_name} a été notifié.</p>
      ${createDetailRow('Numéro', '#' + data.order_number)}
      ${createDetailRow('Produit', data.product_name)}
      ${createDetailRow('Quantité', String(data.quantity))}
      ${createDetailRow('Montant', `${data.total} ${data.currency}`)}
      ${data.payment_status === 'paid' ? createDetailRow('Paiement', '✅ Payé') : ''}
      ${!data.is_digital ? `
        <p style="padding:16px;background:rgba(255,193,7,0.12);border-radius:12px;color:rgba(255,255,255,0.9);margin:20px 0;">
          📦 <strong>Livraison:</strong> ${data.owner_name} vous contactera prochainement pour organiser la livraison.
        </p>
      ` : ''}
      <p style="margin:20px 0 0;color:rgba(255,255,255,0.8);">
        Pour toute question, contactez <a href="mailto:${data.owner_email}" style="color:#667eea;">${data.owner_email}</a>
      </p>
    `;
    return {
      subject: `✅ Commande confirmée - ${data.product_name}`,
      html: createBoohEmailTemplate({
        title: '✨ Commande confirmée !',
        subtitle: 'Merci pour votre achat',
        greeting: '',
        content,
      }),
    };
  },

  client_digital_download: (data: any) => {
    const expDate = data.expires_at ? new Date(data.expires_at).toLocaleDateString('fr-FR') : 'N/A';
    const content = `
      <p style="margin:0 0 20px;">Bonjour <strong>${data.client_name}</strong>,</p>
      <p style="margin:0 0 24px;color:rgba(255,255,255,0.9);">Votre produit digital est prêt à être téléchargé !</p>
      <div style="padding:24px;background:rgba(102,126,234,0.12);border-radius:16px;text-align:center;margin:24px 0;">
        <p style="margin:0 0 16px;font-size:18px;font-weight:600;color:#fff;">${data.product_name}</p>
        <p style="margin:0 0 20px;color:rgba(255,255,255,0.8);font-size:14px;">Cliquez sur le bouton ci-dessous pour commencer le téléchargement</p>
      </div>
      <p style="padding:16px;background:rgba(255,193,7,0.12);border-radius:12px;color:rgba(255,255,255,0.9);margin:20px 0;">
        ⚠️ <strong>Important:</strong><br>
        • Lien valide jusqu'au <strong>${expDate}</strong><br>
        • Téléchargements autorisés: <strong>${data.max_downloads}</strong><br>
        • Conservez ce lien en lieu sûr
      </p>
      <ul style="margin:16px 0;padding-left:20px;color:rgba(255,255,255,0.85);">
        <li>Téléchargez le fichier dès que possible</li>
        <li>Vérifiez que le téléchargement est complet</li>
        <li>Contactez <a href="mailto:${data.owner_email}" style="color:#667eea;">${data.owner_email}</a> en cas de problème</li>
      </ul>
    `;
    return {
      subject: `📥 Téléchargez votre produit - ${data.product_name}`,
      html: createBoohEmailTemplate({
        title: '📥 Votre produit digital',
        subtitle: 'Téléchargement disponible',
        greeting: '',
        content,
        ctaText: '📥 Télécharger maintenant',
        ctaUrl: data.download_url,
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
    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);
    const { type, inquiryId, inquiryType } = await req.json();

    console.log('Processing order email:', { type, inquiryId, inquiryType });

    // Fetch order details based on type
    const tableName = inquiryType === 'digital' ? 'digital_inquiries' : 'product_inquiries';

    const { data: inquiry, error: fetchError } = await supabase
      .from(tableName)
      .select('*')
      .eq("id", inquiryId)
      .single();

    if (fetchError || !inquiry) {
      console.error('Inquiry fetch error:', fetchError);
      throw new Error(`Order not found: ${fetchError?.message || 'Unknown error'}`);
    }

    // Fetch business card
    const { data: card, error: cardError } = await supabase
      .from('business_cards')
      .select('id, name, user_id')
      .eq('id', inquiry.card_id)
      .single();

    if (cardError || !card) {
      console.error('Card fetch error:', cardError);
      throw new Error(`Card not found: ${cardError?.message || 'Unknown error'}`);
    }

    // Fetch owner profile
    // Try profiles table first, fallback to auth.users if not found
    let owner: { full_name?: string; email?: string } | null = null;
    
    const { data: profileOwner, error: profileError } = await supabase
      .from('profiles')
      .select('full_name, email')
      .eq('id', card.user_id)
      .maybeSingle();

    if (profileError) {
      console.error('Profile fetch error:', profileError);
    }

    if (profileOwner) {
      owner = profileOwner;
    } else {
      // Fallback: try to get email from auth.users
      const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(card.user_id);
      if (authError || !authUser) {
        console.error('Auth user fetch error:', authError);
        throw new Error(`Owner not found for user_id: ${card.user_id}`);
      }
      owner = {
        full_name: authUser.user?.user_metadata?.full_name || authUser.user?.email || 'Owner',
        email: authUser.user?.email || 'no-email@example.com'
      };
    }

    // Fetch product details
    let product, productName;
    if (inquiryType === 'digital') {
      const { data: digitalProduct, error: productError } = await supabase
        .from('digital_products')
        .select('id, name, price, currency')
        .eq('id', inquiry.digital_product_id)
        .single();

      if (productError || !digitalProduct) {
        console.error('Digital product fetch error:', productError);
        throw new Error(`Product not found: ${productError?.message || 'Unknown error'}`);
      }
      product = digitalProduct;
      productName = digitalProduct.name;
    } else {
      const { data: physicalProduct, error: productError } = await supabase
        .from('products')
        .select('id, name, price, currency')
        .eq('id', inquiry.product_id)
        .single();

      if (productError || !physicalProduct) {
        console.error('Physical product fetch error:', productError);
        throw new Error(`Product not found: ${productError?.message || 'Unknown error'}`);
      }
      product = physicalProduct;
      productName = physicalProduct.name;
    }

    // Prepare common data
    const commonData = {
      client_name: inquiry.client_name,
      client_email: inquiry.client_email,
      client_phone: inquiry.client_phone,
      product_name: productName,
      quantity: inquiry.quantity || 1,
      total: product.price * (inquiry.quantity || 1),
      currency: product.currency || 'FCFA',
      is_digital: inquiryType === 'digital',
      owner_name: owner.full_name,
      owner_email: owner.email,
      order_number: inquiryId.split('-')[0].toUpperCase(),
      notes: inquiry.notes,
      payment_status: inquiry.payment_status || 'pending',
      manage_url: `${PUBLIC_URL}/cards/${card.id}/orders`,
      download_url: inquiryType === 'digital' && inquiry.download_token
        ? `${PUBLIC_URL}/download/${inquiry.download_token}`
        : null,
      expires_at: inquiry.expires_at,
      max_downloads: inquiry.max_downloads || 3,
    };

    let emailSent = false;

    // Send appropriate email based on type
    switch (type) {
      case 'owner_new_order': {
        const template = EMAIL_TEMPLATES.owner_new_order(commonData);
        emailSent = await sendEmail(owner.email, template.subject, template.html);
        break;
      }

      case 'client_order_confirmation': {
        const template = EMAIL_TEMPLATES.client_order_confirmation(commonData);
        emailSent = await sendEmail(inquiry.client_email, template.subject, template.html);
        break;
      }

      case 'client_digital_download': {
        if (inquiryType === 'digital') {
          const template = EMAIL_TEMPLATES.client_digital_download(commonData);
          emailSent = await sendEmail(inquiry.client_email, template.subject, template.html);
        }
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
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
    );
  }
});

