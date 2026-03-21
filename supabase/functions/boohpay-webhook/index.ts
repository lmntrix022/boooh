// Edge Function pour recevoir les webhooks BoohPay
// Cette fonction met à jour les commandes dans Supabase quand BoohPay envoie des notifications

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface BoohPayWebhookPayload {
  event: string;
  paymentId?: string;
  subscriptionId?: string;
  merchantId: string;
  orderId?: string;
  status: 'PENDING' | 'AUTHORIZED' | 'SUCCEEDED' | 'FAILED' | 'ACTIVE' | 'CANCELLED' | 'PAUSED';
  amount?: number;
  currency?: string;
  gatewayUsed?: 'STRIPE' | 'MONEROO' | 'EBILLING';
  providerReference?: string;
  metadata?: Record<string, unknown>;
  occurredAt: string;
  // Champs spécifiques aux abonnements
  currentPeriodStart?: string;
  currentPeriodEnd?: string;
  customerEmail?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Vérifier la signature du webhook (à implémenter selon BoohPay)
    // Pour l'instant, on accepte toutes les requêtes
    const signature = req.headers.get('x-boohpay-signature');
    const webhookSecret = Deno.env.get('BOOHPAY_WEBHOOK_SECRET');
    
    // TODO: Valider la signature si webhookSecret est configuré
    // if (webhookSecret && !validateSignature(signature, webhookSecret, await req.text())) {
    //   return new Response('Invalid signature', { status: 401 });
    // }

    const payload: BoohPayWebhookPayload = await req.json();
    
    // Initialiser Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const eventType = payload.event;
    const entityId = payload.paymentId || payload.subscriptionId;
    
    console.log(`BoohPay webhook received: ${eventType} for ${payload.paymentId ? 'payment' : 'subscription'} ${entityId}`);

    // Traiter selon le type d'événement
    switch (eventType) {
      // Événements de paiement
      case 'payment.succeeded':
      case 'payment.paid':
        await handlePaymentSucceeded(supabase, payload);
        break;
      
      case 'payment.failed':
        await handlePaymentFailed(supabase, payload);
        break;
      
      case 'payment.pending':
        await handlePaymentPending(supabase, payload);
        break;
      
      // Événements d'abonnement
      case 'subscription.created':
        await handleSubscriptionCreated(supabase, payload);
        break;
      
      case 'subscription.updated':
        await handleSubscriptionUpdated(supabase, payload);
        break;
      
      case 'subscription.cancelled':
        await handleSubscriptionCancelled(supabase, payload);
        break;
      
      case 'subscription.payment_succeeded':
        await handleSubscriptionPaymentSucceeded(supabase, payload);
        break;
      
      case 'subscription.payment_failed':
        await handleSubscriptionPaymentFailed(supabase, payload);
        break;
      
      default:
        console.log(`Event type ${eventType} not handled`);
    }

    return new Response(
      JSON.stringify({ received: true }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error processing BoohPay webhook:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});

async function handlePaymentSucceeded(
  supabase: any,
  payload: BoohPayWebhookPayload
) {
  const { orderId, paymentId, providerReference, metadata } = payload;

  // Mettre à jour les commandes physiques (product_inquiries)
  const { error: physicalError } = await supabase
    .from('product_inquiries')
    .update({
      status: 'confirmed',
      payment_status: 'paid',
      payment_method: 'stripe', // ou 'mobile_money' selon gatewayUsed
      transaction_id: providerReference || paymentId,
      paid_at: payload.occurredAt,
      external_reference: paymentId,
    })
    .eq('external_reference', orderId)
    .or(`id.eq.${orderId},external_reference.eq.${orderId}`);

  if (physicalError) {
    console.error('Error updating physical order:', physicalError);
  }

  // Mettre à jour les commandes digitales (digital_inquiries)
  const { error: digitalError } = await supabase
    .from('digital_inquiries')
    .update({
      status: 'completed',
      payment_status: 'paid',
      payment_method: payload.gatewayUsed === 'STRIPE' ? 'stripe' : 'mobile_money',
      transaction_id: providerReference || paymentId,
      paid_at: payload.occurredAt,
      external_reference: paymentId,
    })
    .eq('external_reference', orderId)
    .or(`id.eq.${orderId},external_reference.eq.${orderId}`);

  if (digitalError) {
    console.error('Error updating digital order:', digitalError);
  }

  // Mettre à jour les commandes (orders) si elles existent
  const { error: ordersError } = await supabase
    .from('orders')
    .update({
      status: 'paid',
      payment_status: 'paid',
      payment_method: payload.gatewayUsed === 'STRIPE' ? 'stripe' : 'mobile_money',
      transaction_id: providerReference || paymentId,
      paid_at: payload.occurredAt,
    })
    .eq('id', orderId)
    .or(`external_reference.eq.${orderId},metadata->>order_id.eq.${orderId}`);

  if (ordersError) {
    console.error('Error updating order:', ordersError);
  }

  console.log(`Payment ${paymentId} succeeded, orders updated`);
}

async function handlePaymentFailed(
  supabase: any,
  payload: BoohPayWebhookPayload
) {
  const { orderId, paymentId } = payload;

  // Mettre à jour les commandes avec le statut failed
  await supabase
    .from('product_inquiries')
    .update({
      payment_status: 'failed',
      status: 'pending',
    })
    .eq('external_reference', orderId)
    .or(`id.eq.${orderId}`);

  await supabase
    .from('digital_inquiries')
    .update({
      payment_status: 'failed',
      status: 'pending',
    })
    .eq('external_reference', orderId)
    .or(`id.eq.${orderId}`);

  await supabase
    .from('orders')
    .update({
      payment_status: 'failed',
      status: 'pending',
    })
    .eq('id', orderId)
    .or(`external_reference.eq.${orderId}`);

  console.log(`Payment ${paymentId} failed, orders updated`);
}

async function handlePaymentPending(
  supabase: any,
  payload: BoohPayWebhookPayload
) {
  const { orderId, paymentId } = payload;

  // Mettre à jour les commandes avec le statut pending
  await supabase
    .from('product_inquiries')
    .update({
      payment_status: 'pending',
    })
    .eq('external_reference', orderId)
    .or(`id.eq.${orderId}`);

  await supabase
    .from('digital_inquiries')
    .update({
      payment_status: 'pending',
    })
    .eq('external_reference', orderId)
    .or(`id.eq.${orderId}`);

  await supabase
    .from('orders')
    .update({
      payment_status: 'pending',
    })
    .eq('id', orderId)
    .or(`external_reference.eq.${orderId}`);

  console.log(`Payment ${paymentId} pending, orders updated`);
}

// ========== Gestionnaires d'événements d'abonnement ==========

async function handleSubscriptionCreated(
  supabase: any,
  payload: BoohPayWebhookPayload
) {
  const { subscriptionId, merchantId, metadata, currentPeriodStart, currentPeriodEnd } = payload;

  if (!subscriptionId) {
    console.error('Subscription ID missing in webhook payload');
    return;
  }

  // Récupérer l'ID utilisateur depuis les metadata ou le merchantId
  const userId = metadata?.userId as string | undefined;
  
  if (!userId) {
    console.error('User ID missing in subscription metadata');
    return;
  }

  // Mettre à jour ou créer l'abonnement local
  const { data: existingSubscription } = await supabase
    .from('user_subscriptions')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'active')
    .maybeSingle();

  if (existingSubscription) {
    // Mettre à jour l'abonnement existant
    await supabase
      .from('user_subscriptions')
      .update({
        boohpay_subscription_id: subscriptionId,
        start_date: currentPeriodStart || new Date().toISOString(),
        end_date: currentPeriodEnd || null,
        auto_renew: true,
        updated_at: new Date().toISOString(),
      })
      .eq('id', existingSubscription.id);
  } else {
    // Créer un nouvel abonnement local
    const planType = (metadata?.planType as string) || 'free';
    
    await supabase
      .from('user_subscriptions')
      .insert({
        user_id: userId,
        plan_type: planType,
        boohpay_subscription_id: subscriptionId,
        status: 'active',
        start_date: currentPeriodStart || new Date().toISOString(),
        end_date: currentPeriodEnd || null,
        auto_renew: true,
      });
  }

  console.log(`Subscription ${subscriptionId} created, local subscription updated`);
}

async function handleSubscriptionUpdated(
  supabase: any,
  payload: BoohPayWebhookPayload
) {
  const { subscriptionId, currentPeriodStart, currentPeriodEnd, status, metadata } = payload;

  if (!subscriptionId) {
    console.error('Subscription ID missing in webhook payload');
    return;
  }

  // Mettre à jour l'abonnement local
  const updateData: any = {
    updated_at: new Date().toISOString(),
  };

  if (currentPeriodStart) {
    updateData.start_date = currentPeriodStart;
  }
  if (currentPeriodEnd) {
    updateData.end_date = currentPeriodEnd;
  }
  if (status === 'CANCELLED') {
    updateData.status = 'cancelled';
    updateData.auto_renew = false;
  } else if (status === 'ACTIVE') {
    updateData.status = 'active';
    updateData.auto_renew = true;
  }

  // Mettre à jour le plan si nécessaire
  if (metadata?.planType) {
    updateData.plan_type = metadata.planType;
  }

  await supabase
    .from('user_subscriptions')
    .update(updateData)
    .eq('boohpay_subscription_id', subscriptionId);

  console.log(`Subscription ${subscriptionId} updated, local subscription synced`);
}

async function handleSubscriptionCancelled(
  supabase: any,
  payload: BoohPayWebhookPayload
) {
  const { subscriptionId, currentPeriodEnd } = payload;

  if (!subscriptionId) {
    console.error('Subscription ID missing in webhook payload');
    return;
  }

  // Mettre à jour l'abonnement local
  await supabase
    .from('user_subscriptions')
    .update({
      status: 'cancelled',
      auto_renew: false,
      end_date: currentPeriodEnd || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('boohpay_subscription_id', subscriptionId);

  console.log(`Subscription ${subscriptionId} cancelled, local subscription updated`);
}

async function handleSubscriptionPaymentSucceeded(
  supabase: any,
  payload: BoohPayWebhookPayload
) {
  const { subscriptionId, paymentId, currentPeriodStart, currentPeriodEnd } = payload;

  if (!subscriptionId) {
    console.error('Subscription ID missing in webhook payload');
    return;
  }

  // Mettre à jour l'abonnement local avec la nouvelle période
  await supabase
    .from('user_subscriptions')
    .update({
      status: 'active',
      start_date: currentPeriodStart || new Date().toISOString(),
      end_date: currentPeriodEnd || null,
      auto_renew: true,
      updated_at: new Date().toISOString(),
    })
    .eq('boohpay_subscription_id', subscriptionId);

  // Optionnel: Enregistrer le paiement dans payment_history
  if (paymentId) {
    const { data: subscription } = await supabase
      .from('user_subscriptions')
      .select('user_id')
      .eq('boohpay_subscription_id', subscriptionId)
      .maybeSingle();

    if (subscription) {
      await supabase
        .from('payment_history')
        .insert({
          subscription_id: subscription.id,
          payment_id: paymentId,
          amount: payload.amount || 0,
          currency: payload.currency || 'EUR',
          status: 'paid',
          paid_at: payload.occurredAt,
        });
    }
  }

  console.log(`Subscription ${subscriptionId} payment succeeded, period extended`);
}

async function handleSubscriptionPaymentFailed(
  supabase: any,
  payload: BoohPayWebhookPayload
) {
  const { subscriptionId, paymentId } = payload;

  if (!subscriptionId) {
    console.error('Subscription ID missing in webhook payload');
    return;
  }

  // Enregistrer l'échec du paiement
  if (paymentId) {
    const { data: subscription } = await supabase
      .from('user_subscriptions')
      .select('user_id')
      .eq('boohpay_subscription_id', subscriptionId)
      .maybeSingle();

    if (subscription) {
      await supabase
        .from('payment_history')
        .insert({
          subscription_id: subscription.id,
          payment_id: paymentId,
          amount: payload.amount || 0,
          currency: payload.currency || 'EUR',
          status: 'failed',
          paid_at: payload.occurredAt,
        });
    }
  }

  // Note: Ne pas annuler l'abonnement automatiquement, laisser BoohPay gérer les tentatives
  console.log(`Subscription ${subscriptionId} payment failed, logged`);
}

