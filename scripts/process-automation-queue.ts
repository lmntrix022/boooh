/**
 * Automation Queue Processor
 *
 * Cron job script to process pending automation actions
 * Run every 5 minutes
 *
 * Uses existing Supabase Edge Function (send-invoice-email) for email sending via Resend
 *
 * Usage: tsx scripts/process-automation-queue.ts
 */

import { createClient } from '@supabase/supabase-js';

// Environment variables
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || '';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || ''; // Service role key

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing required environment variables');
  console.error('   Required: VITE_SUPABASE_URL, SUPABASE_SERVICE_KEY');
  process.exit(1);
}

// Initialize Supabase with service role (bypass RLS)
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

interface QueueItem {
  id: string;
  rule_id: string;
  contact_id: string;
  user_id: string;
  action_type: string;
  action_data: Record<string, any>;
  execute_at: string;
}

interface AutomationAction {
  type: 'send_email' | 'send_sms' | 'send_whatsapp' | 'create_task' | 'update_crm' | 'trigger_webhook' | 'wait';
  delay: number; // hours
  template?: string;
  data?: Record<string, any>;
  condition?: {
    field: string;
    operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than';
    value: any;
  };
}

/**
 * Main processor function
 */
async function processAutomationQueue() {
  console.log('╔══════════════════════════════════════════╗');
  console.log('║  AUTOMATION QUEUE PROCESSOR              ║');
  console.log('╚══════════════════════════════════════════╝');
  console.log(`⏰ ${new Date().toLocaleString('fr-FR')}\n`);

  try {
    // Fetch pending items that should be executed now
    const { data: queueItems, error } = await supabase
      .from('automation_queue')
      .select('*')
      .eq('status', 'pending')
      .lte('execute_at', new Date().toISOString())
      .order('execute_at', { ascending: true })
      .limit(100); // Process in batches

    if (error) {
      console.error('❌ Error fetching queue:', error);
      return;
    }

    if (!queueItems || queueItems.length === 0) {
      console.log('✓ No pending items to process\n');
      return;
    }

    console.log(`📋 Found ${queueItems.length} pending items\n`);

    let processed = 0;
    let failed = 0;

    for (const item of queueItems) {
      try {
        console.log(`\n🔄 Processing item ${item.id.substring(0, 8)}...`);
        console.log(`   Rule: ${item.rule_id}`);
        console.log(`   Action: ${item.action_type}`);

        // Mark as executing
        await supabase
          .from('automation_queue')
          .update({ status: 'executing', updated_at: new Date().toISOString() })
          .eq('id', item.id);

        // Execute the action
        const action: AutomationAction = {
          type: item.action_type as any,
          delay: 0,
          ...item.action_data
        };

        const success = await executeAction(
          action,
          item.contact_id,
          item.user_id,
          item.rule_id
        );

        // Update status
        if (success) {
          await supabase
            .from('automation_queue')
            .update({
              status: 'completed',
              executed_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
            .eq('id', item.id);

          processed++;
          console.log(`   ✅ Success`);
        } else {
          throw new Error('Action execution returned false');
        }
      } catch (error: any) {
        failed++;
        console.error(`   ❌ Failed:`, error.message);

        // Mark as failed
        await supabase
          .from('automation_queue')
          .update({
            status: 'failed',
            error: error.message || String(error),
            updated_at: new Date().toISOString()
          })
          .eq('id', item.id);
      }
    }

    console.log('\n╔══════════════════════════════════════════╗');
    console.log('║  SUMMARY                                 ║');
    console.log('╚══════════════════════════════════════════╝');
    console.log(`✅ Processed: ${processed}`);
    console.log(`❌ Failed:    ${failed}`);
    console.log(`📊 Total:     ${queueItems.length}\n`);
  } catch (error: any) {
    console.error('\n❌ Fatal error in queue processor:', error.message);
    process.exit(1);
  }
}

/**
 * Execute a single automation action
 */
async function executeAction(
  action: AutomationAction,
  contactId: string,
  userId: string,
  ruleId: string
): Promise<boolean> {
  switch (action.type) {
    case 'send_email':
      return await sendEmail(contactId, userId, action.template || '', action.data || {});

    case 'send_sms':
      return await sendSMS(contactId, action.data || {});

    case 'create_task':
      return await createTask(contactId, userId, action.data || {});

    case 'update_crm':
      return await updateCRM(contactId, action.data || {});

    case 'trigger_webhook':
      return await triggerWebhook(action.data || {});

    default:
      console.warn(`⚠️  Unknown action type: ${action.type}`);
      return false;
  }
}

/**
 * Send email via Supabase Edge Function (uses Resend)
 */
async function sendEmail(
  contactId: string,
  userId: string,
  template: string,
  data: Record<string, any>
): Promise<boolean> {
  try {
    // Get contact details
    const { data: contact, error: contactError } = await supabase
      .from('scanned_contacts')
      .select('email, full_name')
      .eq('id', contactId)
      .single();

    if (contactError || !contact) {
      throw new Error(`Contact not found: ${contactId}`);
    }

    if (!contact.email) {
      throw new Error('Contact has no email address');
    }

    // Get user details (for sender info)
    const { data: user } = await supabase
      .from('profiles')
      .select('full_name, email')
      .eq('id', userId)
      .single();

    // Map template names to email types for Edge Function
    const emailTypeMap: Record<string, string> = {
      'at_risk_day_0': 'reactivation',
      'at_risk_reminder_sms': 'follow-up',
      'at_risk_final_offer': 'upsell',
      'welcome_day_0': 'crm',
      'vip_welcome': 'crm',
      'monthly_report': 'crm'
    };

    const emailType = emailTypeMap[template] || 'crm';

    // Prepare email payload for Edge Function
    const emailPayload = {
      // Required fields for Edge Function
      invoice_number: data.invoice_number || 'N/A',
      client_name: contact.full_name || 'Client',
      client_email: contact.email,
      total_ttc: data.total_ttc || 0,
      issue_date: new Date().toISOString(),
      due_date: new Date().toISOString(),

      // CRM-specific fields
      email_type: emailType as any,
      custom_subject: data.subject || getDefaultSubject(template, contact.full_name || 'Client'),
      custom_message: data.message || getDefaultMessage(template, data, contact.full_name || 'Client'),
      user_name: user?.full_name || 'L\'équipe Booh',
      user_email: user?.email
    };

    console.log(`   📧 Sending email to: ${contact.email}`);

    // Call Supabase Edge Function
    const { data: result, error } = await supabase.functions.invoke('send-invoice-email', {
      body: emailPayload
    });

    if (error) {
      throw new Error(`Edge Function error: ${error.message}`);
    }

    if (!result.success) {
      throw new Error(result.error || 'Email sending failed');
    }

    console.log(`   ✉️  Email sent successfully (${result.email_id})`);
    return true;
  } catch (error: any) {
    console.error(`   ❌ Email error:`, error.message);
    return false;
  }
}

/**
 * Send SMS (placeholder - requires SMS service integration)
 */
async function sendSMS(contactId: string, data: Record<string, any>): Promise<boolean> {
  console.log(`   📱 SMS sending not yet implemented`);
  // TODO: Integrate with SMS service (Twilio, etc.)
  return true; // Mark as success for now
}

/**
 * Create CRM task
 */
async function createTask(
  contactId: string,
  userId: string,
  data: Record<string, any>
): Promise<boolean> {
  try {
    const { error } = await supabase.from('crm_tasks').insert({
      contact_id: contactId,
      user_id: userId,
      task_type: data.taskType || 'follow_up',
      priority: data.priority || 'medium',
      title: data.title || 'Tâche automatique',
      description: data.description || '',
      due_date: data.dueDate || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      metadata: data.metadata || {}
    });

    if (error) throw error;

    console.log(`   📋 Task created successfully`);
    return true;
  } catch (error: any) {
    console.error(`   ❌ Task error:`, error.message);
    return false;
  }
}

/**
 * Update CRM contact
 */
async function updateCRM(contactId: string, data: Record<string, any>): Promise<boolean> {
  try {
    const updates: Record<string, any> = {};

    // Add tags
    if (data.tags) {
      const { data: contact } = await supabase
        .from('scanned_contacts')
        .select('tags')
        .eq('id', contactId)
        .single();

      const currentTags = contact?.tags || [];
      updates.tags = [...new Set([...currentTags, ...data.tags])];
    }

    // Add notes
    if (data.note) {
      updates.notes = data.note;
    }

    const { error } = await supabase
      .from('scanned_contacts')
      .update(updates)
      .eq('id', contactId);

    if (error) throw error;

    console.log(`   💾 CRM updated successfully`);
    return true;
  } catch (error: any) {
    console.error(`   ❌ CRM update error:`, error.message);
    return false;
  }
}

/**
 * Trigger webhook (placeholder)
 */
async function triggerWebhook(data: Record<string, any>): Promise<boolean> {
  console.log(`   🔗 Webhook triggering not yet implemented`);
  // TODO: Implement webhook system
  return true;
}

/**
 * Get default email subject based on template
 */
function getDefaultSubject(template: string, name: string): string {
  const firstName = name.split(' ')[0];

  const subjects: Record<string, string> = {
    'at_risk_day_0': `${firstName}, nous avons remarqué votre absence... 💔`,
    'at_risk_reminder_sms': `Dernière chance: Réduction exclusive pour vous!`,
    'at_risk_final_offer': `${firstName}, votre offre VIP expire bientôt`,
    'welcome_day_0': `Bienvenue chez Booh, ${firstName}! 🎉`,
    'vip_welcome': `🌟 Félicitations ${firstName}! Vous êtes maintenant VIP Champion`,
    'monthly_report': `Votre rapport mensuel Booh`
  };

  return subjects[template] || 'Message de Booh';
}

/**
 * Get default email message based on template
 */
function getDefaultMessage(template: string, data: Record<string, any>, name: string): string {
  const firstName = name.split(' ')[0];

  const messages: Record<string, string> = {
    'at_risk_day_0': `Bonjour ${firstName},

Nous avons remarqué que vous ne nous avez pas rendu visite depuis un moment.

En tant que client VIP, nous vous offrons ${(data.discount || 0.20) * 100}% de réduction sur votre prochaine commande!

Utilisez le code: ${data.discount_code || 'VIP20'}

Cette offre est valable ${data.validity_days || 7} jours.

À très bientôt!`,

    'at_risk_reminder_sms': `⚡ Rappel: Votre réduction VIP de ${(data.discount || 0.20) * 100}% expire bientôt!

Ne manquez pas cette opportunité exclusive.

Code: ${data.discount_code || 'VIP20'}`,

    'at_risk_final_offer': `Bonjour ${firstName},

C'est votre dernière chance!

Nous augmentons votre réduction à ${(data.discount || 0.30) * 100}% pour vous montrer combien nous tenons à vous.

Code: ${data.discount_code || 'FINAL30'}

Expire dans ${data.validity_days || 3} jours!`,

    'welcome_day_0': `Bonjour ${firstName},

Merci pour votre confiance! 🎉

Nous sommes ravis de vous compter parmi nos clients.

Votre commande est en cours de traitement et sera livrée sous ${data.delivery_days || 3} jours.

À bientôt!`,

    'vip_welcome': `Bonjour ${firstName},

Félicitations! Vous avez atteint le statut VIP Champion 🏆

Vous bénéficiez maintenant de:
• ${data.discount || 15}% de réduction permanente
• Livraison gratuite sur toutes vos commandes
• Accès prioritaire aux nouveautés
• Support client dédié
• Cadeaux d'anniversaire exclusifs

Profitez de vos avantages dès maintenant!`,

    'monthly_report': `Bonjour ${firstName},

Voici votre rapport mensuel d'activité.

Nous espérons que vous appréciez nos services!`
  };

  return messages[template] || `Bonjour ${firstName},\n\nMessage personnalisé de Booh.`;
}

// Run the processor
if (require.main === module) {
  processAutomationQueue()
    .then(() => {
      console.log('✅ Queue processor completed successfully\n');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Queue processor failed:', error);
      process.exit(1);
    });
}

export { processAutomationQueue };
