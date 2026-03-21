/**
 * Weekly Reports Sender
 *
 * Cron job script to send weekly CRM reports
 * Run every Monday at 9:00 AM: 0 9 * * 1
 *
 * Usage:
 *   ts-node scripts/send-weekly-reports.ts
 */

import { createClient } from '@supabase/supabase-js';
import { generateExecutiveSummary } from '../src/services/crmReportingService';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || '';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || '';
const EMAIL_API_KEY = process.env.EMAIL_API_KEY || '';
const EMAIL_FROM = process.env.EMAIL_FROM || 'reports@booh.app';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Configure report recipients per user
const REPORT_RECIPIENTS: Record<string, string[]> = {
  // Format: 'user_id': ['email1@example.com', 'email2@example.com']
  // This would ideally come from a database table
};

/**
 * Send weekly reports to all configured users
 */
async function sendWeeklyReports() {
  console.log('[REPORTS] Starting weekly report generation...');

  const endDate = new Date();
  const startDate = new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000);

  try {
    // Get all active users
    const { data: users, error } = await supabase
      .from('user_roles')
      .select('user_id')
      .limit(1000); // Adjust as needed

    if (error) {
      console.error('[REPORTS] Error fetching users:', error);
      return;
    }

    if (!users || users.length === 0) {
      console.log('[REPORTS] No users found');
      return;
    }

    console.log(`[REPORTS] Generating reports for ${users.length} users...`);

    let sent = 0;
    let failed = 0;

    for (const user of users) {
      try {
        // Get recipients for this user (default to user's own email if not configured)
        const recipients = REPORT_RECIPIENTS[user.user_id] || await getUserEmail(user.user_id);

        if (!recipients || recipients.length === 0) {
          console.warn(`[REPORTS] No recipients for user ${user.user_id}`);
          continue;
        }

        // Generate executive summary
        const summary = await generateExecutiveSummary(user.user_id, {
          start: startDate,
          end: endDate
        });

        // Send email
        const success = await sendReportEmail(
          recipients,
          `Rapport CRM Hebdomadaire - ${formatDate(endDate)}`,
          summary
        );

        if (success) {
          sent++;
          console.log(`[REPORTS] ✓ Sent report to user ${user.user_id}`);
        } else {
          throw new Error('Email send failed');
        }
      } catch (error) {
        failed++;
        console.error(`[REPORTS] ✗ Failed for user ${user.user_id}:`, error);
      }

      // Rate limiting: wait 100ms between sends
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log(`[REPORTS] Finished. Sent: ${sent}, Failed: ${failed}`);
  } catch (error) {
    console.error('[REPORTS] Fatal error:', error);
  }
}

/**
 * Get user's email address
 */
async function getUserEmail(userId: string): Promise<string[]> {
  const { data: user } = await supabase.auth.admin.getUserById(userId);

  if (user && user.user.email) {
    return [user.user.email];
  }

  return [];
}

/**
 * Send report email
 */
async function sendReportEmail(
  recipients: string[],
  subject: string,
  reportContent: string
): Promise<boolean> {
  try {
    // Convert plain text report to HTML with pre tag for formatting
    const htmlContent = `
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${subject}</title>
    <style>
        body {
            font-family: 'Courier New', Courier, monospace;
            line-height: 1.6;
            color: #333;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f5f5f5;
        }
        .container {
            background: white;
            border-radius: 8px;
            padding: 30px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        pre {
            background: #1e1e1e;
            color: #d4d4d4;
            padding: 20px;
            border-radius: 8px;
            overflow-x: auto;
            font-size: 13px;
            line-height: 1.5;
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
        }
        .logo {
            font-size: 32px;
            font-weight: bold;
            color: #1a1a1a;
            margin-bottom: 10px;
        }
        .footer {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #eee;
            text-align: center;
            color: #666;
            font-size: 14px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">Booh</div>
            <h2 style="color: #666; margin: 0;">${subject}</h2>
        </div>

        <pre>${reportContent}</pre>

        <div class="footer">
            <p><strong>Rapport généré automatiquement</strong></p>
            <p>Pour toute question, contactez notre support.</p>
            <p style="margin-top: 20px;">
                <a href="{{dashboard_url}}" style="color: #667eea;">Accéder au tableau de bord</a>
            </p>
        </div>
    </div>
</body>
</html>
    `;

    // Send via SendGrid
    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${EMAIL_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        personalizations: [{
          to: recipients.map(email => ({ email }))
        }],
        from: { email: EMAIL_FROM, name: 'Booh CRM Reports' },
        subject,
        content: [{ type: 'text/html', value: htmlContent }]
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`SendGrid API error: ${response.status} - ${error}`);
    }

    return true;
  } catch (error) {
    console.error('[EMAIL] Send failed:', error);
    return false;
  }
}

/**
 * Format date for display
 */
function formatDate(date: Date): string {
  return date.toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

// Run the sender
if (require.main === module) {
  sendWeeklyReports()
    .then(() => {
      console.log('[REPORTS] Weekly reports sender completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('[REPORTS] Weekly reports sender failed:', error);
      process.exit(1);
    });
}

export { sendWeeklyReports };
