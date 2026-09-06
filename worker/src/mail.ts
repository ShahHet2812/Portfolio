/**
 * Contact notifications via the Resend HTTP API.
 *
 * Workers have no Node SMTP stack, so nodemailer/Gmail is not an option here —
 * this posts over plain HTTPS instead.
 */

export interface MailEnv {
  RESEND_API_KEY?: string;
  NOTIFY_EMAIL?: string;
  MAIL_FROM?: string;
  SITE_NAME?: string;
}

export interface ContactPayload {
  name: string;
  email: string;
  message: string;
  receivedAt: Date;
}

export type MailResult = { sent: true } | { sent: false; reason: string };

const HTML_ESCAPES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

const escapeHtml = (value: string) => value.replace(/[&<>"']/g, (char) => HTML_ESCAPES[char]);

const formatTimestamp = (date: Date) =>
  new Intl.DateTimeFormat('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Asia/Kolkata',
  }).format(date);

function buildHtml({ name, email, message, receivedAt }: ContactPayload, siteName: string) {
  return `<!doctype html>
<html>
  <body style="margin:0;padding:24px;background:#f4f6f8;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="max-width:600px;margin:0 auto;background:#ffffff;border-radius:10px;overflow:hidden;border:1px solid #e1e6ec;">
      <tr>
        <td style="background:#0d1117;padding:18px 24px;">
          <div style="font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-size:14px;color:#56d364;">
            $ new-message --from ${escapeHtml(siteName)}
          </div>
        </td>
      </tr>
      <tr>
        <td style="padding:24px;">
          <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="font-size:14px;color:#24292f;">
            <tr>
              <td style="padding:6px 0;color:#6b7684;width:80px;">Name</td>
              <td style="padding:6px 0;font-weight:600;">${escapeHtml(name)}</td>
            </tr>
            <tr>
              <td style="padding:6px 0;color:#6b7684;">Email</td>
              <td style="padding:6px 0;"><a href="mailto:${escapeHtml(email)}" style="color:#0969da;">${escapeHtml(email)}</a></td>
            </tr>
            <tr>
              <td style="padding:6px 0;color:#6b7684;">Received</td>
              <td style="padding:6px 0;">${escapeHtml(formatTimestamp(receivedAt))} IST</td>
            </tr>
          </table>

          <div style="margin-top:20px;padding:16px;background:#f6f8fa;border:1px solid #e1e6ec;border-radius:8px;font-size:15px;line-height:1.65;color:#24292f;white-space:pre-wrap;">${escapeHtml(message)}</div>

          <p style="margin:20px 0 0;font-size:13px;color:#6b7684;">
            Hit reply to respond to ${escapeHtml(name)} directly.
          </p>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

function buildText({ name, email, message, receivedAt }: ContactPayload, siteName: string) {
  return [
    `New message from ${siteName}`,
    '',
    `Name:     ${name}`,
    `Email:    ${email}`,
    `Received: ${formatTimestamp(receivedAt)} IST`,
    '',
    '--- Message ---',
    message,
    '',
    'Reply to this email to respond directly.',
  ].join('\n');
}

export async function sendContactNotification(env: MailEnv, payload: ContactPayload): Promise<MailResult> {
  if (!env.RESEND_API_KEY) return { sent: false, reason: 'RESEND_API_KEY not configured' };

  const siteName = env.SITE_NAME || 'hetshah.xyz';
  const to = env.NOTIFY_EMAIL || 'shahhet28122004@gmail.com';
  // Must be an address on a domain verified in Resend.
  const from = env.MAIL_FROM || `Portfolio <noreply@${siteName}>`;

  let response: Response;
  try {
    response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to: [to],
        // Replying in the mail client goes straight back to the sender.
        reply_to: `${payload.name} <${payload.email}>`,
        subject: `New portfolio message from ${payload.name}`,
        text: buildText(payload, siteName),
        html: buildHtml(payload, siteName),
      }),
      signal: AbortSignal.timeout(8000),
    });
  } catch (err) {
    return { sent: false, reason: `request failed: ${(err as Error).message}` };
  }

  if (!response.ok) {
    const body = await response.text().catch(() => '');
    return { sent: false, reason: `resend responded ${response.status}: ${body.slice(0, 200)}` };
  }

  return { sent: true };
}
