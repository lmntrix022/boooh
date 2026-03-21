/**
 * Vercel Serverless Function: Process Automation Queue
 *
 * This is called by Vercel Cron every 5 minutes
 */

module.exports = async (req, res) => {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const CRON_SECRET = process.env.CRON_SECRET || 'change-me';
  const authHeader = req.headers.authorization;

  if (authHeader !== `Bearer ${CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // Dynamic import for ES modules
  const { createClient } = await import('@supabase/supabase-js');

  const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
  const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    return res.status(500).json({
      error: 'Missing environment variables',
      details: {
        hasUrl: !!SUPABASE_URL,
        hasKey: !!SUPABASE_SERVICE_KEY
      }
    });
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    // Call SQL function
    const { data: processedCount, error } = await supabase.rpc('process_automation_queue');

    if (error) {
      console.error('Error calling SQL function:', error);
      return res.status(500).json({ error: error.message });
    }

    // Get pending items
    const { data: queueItems, error: fetchError } = await supabase
      .from('automation_queue')
      .select('*')
      .eq('status', 'pending')
      .lte('execute_at', new Date().toISOString())
      .limit(50);

    if (fetchError) {
      return res.status(500).json({ error: fetchError.message });
    }

    let executed = 0;
    let failed = 0;

    // Process items
    for (const item of queueItems || []) {
      try {
        await supabase
          .from('automation_queue')
          .update({ status: 'executing', updated_at: new Date().toISOString() })
          .eq('id', item.id);

        const success = await executeAction(supabase, item);

        if (success) {
          await supabase
            .from('automation_queue')
            .update({
              status: 'completed',
              executed_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
            .eq('id', item.id);
          executed++;
        } else {
          throw new Error('Execution failed');
        }
      } catch (error) {
        failed++;
        await supabase
          .from('automation_queue')
          .update({
            status: 'failed',
            error: error.message,
            updated_at: new Date().toISOString()
          })
          .eq('id', item.id);
      }
    }

    return res.status(200).json({
      success: true,
      processed: processedCount || 0,
      executed,
      failed,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Fatal error:', error);
    return res.status(500).json({
      error: error.message,
      stack: error.stack
    });
  }
};

async function executeAction(supabase, item) {
  const { action_type, contact_id, user_id, action_data } = item;

  switch (action_type) {
    case 'send_email':
      return await sendEmail(supabase, contact_id, user_id, action_data);
    case 'create_task':
      return await createTask(supabase, contact_id, user_id, action_data);
    case 'update_crm':
      return await updateCRM(supabase, contact_id, action_data);
    default:
      return true;
  }
}

async function sendEmail(supabase, contactId, userId, data) {
  try {
    const { data: contact } = await supabase
      .from('scanned_contacts')
      .select('email, full_name')
      .eq('id', contactId)
      .single();

    if (!contact || !contact.email) {
      throw new Error('Contact not found');
    }

    const { data: user } = await supabase
      .from('profiles')
      .select('full_name, email')
      .eq('id', userId)
      .single();

    const emailTypeMap = {
      'at_risk_day_0': 'reactivation',
      'welcome_day_0': 'crm',
      'vip_welcome': 'crm'
    };

    const { data: result, error } = await supabase.functions.invoke('send-invoice-email', {
      body: {
        invoice_number: 'N/A',
        client_name: contact.full_name || 'Client',
        client_email: contact.email,
        total_ttc: 0,
        issue_date: new Date().toISOString(),
        due_date: new Date().toISOString(),
        email_type: emailTypeMap[data.template] || 'crm',
        custom_subject: data.subject || 'Message de Booh',
        custom_message: data.message || '',
        user_name: user?.full_name || 'L\'équipe Booh',
        user_email: user?.email
      }
    });

    if (error) throw error;
    return result?.success;
  } catch (error) {
    console.error('Email error:', error);
    return false;
  }
}

async function createTask(supabase, contactId, userId, data) {
  try {
    const { error } = await supabase.from('crm_tasks').insert({
      contact_id: contactId,
      user_id: userId,
      task_type: data.taskType || 'follow_up',
      priority: data.priority || 'medium',
      title: data.title || 'Tâche automatique',
      description: data.description || '',
      due_date: data.dueDate || new Date(Date.now() + 86400000).toISOString()
    });
    return !error;
  } catch {
    return false;
  }
}

async function updateCRM(supabase, contactId, data) {
  try {
    const updates = {};
    if (data.tags) {
      const { data: contact } = await supabase
        .from('scanned_contacts')
        .select('tags')
        .eq('id', contactId)
        .single();
      updates.tags = [...new Set([...(contact?.tags || []), ...data.tags])];
    }
    if (data.note) updates.notes = data.note;

    const { error } = await supabase
      .from('scanned_contacts')
      .update(updates)
      .eq('id', contactId);
    return !error;
  } catch {
    return false;
  }
}
