/**
 * Template email BÖÖH — design onboarding unifié
 * Fond #0a0a0a, gradient violet/rose, cartes rgba(255,255,255,0.05)
 */

export function createBoohEmailTemplate(options: {
  title: string;
  subtitle?: string;
  greeting?: string;
  content: string;
  ctaText?: string;
  ctaUrl?: string;
  footerExtra?: string;
}): string {
  const { title, subtitle, greeting, content, ctaText, ctaUrl, footerExtra } = options;
  return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">

<table role="presentation" width="100%" style="background:#0a0a0a;">
<tr>
<td align="center" style="padding:56px 20px">

<table role="presentation" width="600" style="max-width:600px;">

<!-- HERO -->
<tr>
<td style="padding-bottom:48px;">
  <div style="padding:48px 32px;border-radius:24px;background:linear-gradient(135deg,#667eea,#764ba2,#f093fb);box-shadow:0 20px 60px rgba(102,126,234,0.4);text-align:center;">
    <h1 style="margin:0 0 12px;font-size:38px;color:#fff;font-weight:700;">BÖÖH</h1>
    <p style="margin:0;font-size:22px;color:rgba(255,255,255,0.95);font-weight:600;">${title}</p>
    ${subtitle ? `<p style="margin:8px 0 0;font-size:16px;color:rgba(255,255,255,0.9);">${subtitle}</p>` : ''}
  </div>
</td>
</tr>

<!-- INTRO / CONTENT -->
<tr>
<td>
  <div style="background:rgba(255,255,255,0.05);border-radius:24px;padding:40px;color:#fff;">
    ${greeting ? `<p style="font-size:18px;line-height:1.7;margin:0 0 20px;">${greeting}</p>` : ''}
    <div style="font-size:16px;line-height:1.7;color:rgba(255,255,255,0.9);">
      ${content}
    </div>
  </div>
</td>
</tr>

<!-- CTA -->
${ctaText && ctaUrl ? `
<tr>
<td align="center" style="padding:40px 0;">
  <a href="${ctaUrl}" style="display:inline-block;padding:18px 56px;background:linear-gradient(135deg,#667eea,#764ba2);color:#fff;text-decoration:none;border-radius:14px;font-size:18px;font-weight:600;">
    ${ctaText}
  </a>
</td>
</tr>
` : ''}

<!-- FOOTER -->
<tr>
<td align="center" style="color:rgba(255,255,255,0.5);font-size:14px;padding-top:32px;">
  ${footerExtra ? `${footerExtra}<br>` : ''}
  Une question ? <a href="mailto:contact@booh.ga" style="color:#667eea;">contact@booh.ga</a><br>
  © 2026 BÖÖH
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

/** Ligne de détail pour les cartes (compatible clients email) */
export function createDetailRow(label: string, value: string): string {
  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:10px 0;">
      <tr>
        <td style="padding:14px;background:rgba(255,255,255,0.05);border-radius:12px;">
          <table role="presentation" width="100%"><tr>
            <td style="font-weight:600;width:140px;color:rgba(255,255,255,0.7);">${label}</td>
            <td style="color:#fff;text-align:right;">${value}</td>
          </tr></table>
        </td>
      </tr>
    </table>
  `;
}
