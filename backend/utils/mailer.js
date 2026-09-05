const nodemailer = require('nodemailer');

const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;
const NOTIFY_EMAIL = process.env.NOTIFY_EMAIL || 'shahhet28122004@gmail.com';
const SITE_NAME = process.env.SITE_NAME || 'hetshah.xyz';

const isConfigured = Boolean(SMTP_USER && SMTP_PASS);

// Explicit host/port rather than the `service: 'gmail'` shorthand so the
// connection details stay obvious and don't depend on nodemailer's registry.
const transporter = isConfigured
  ? nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: { user: SMTP_USER, pass: SMTP_PASS },
    })
  : null;

const HTML_ESCAPES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (char) => HTML_ESCAPES[char]);

const formatTimestamp = (date) =>
  new Intl.DateTimeFormat('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Asia/Kolkata',
  }).format(date);

function buildHtml({ name, email, message, receivedAt }) {
  return `<!doctype html>
<html>
  <body style="margin:0;padding:24px;background:#f4f6f8;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="max-width:600px;margin:0 auto;background:#ffffff;border-radius:10px;overflow:hidden;border:1px solid #e1e6ec;">
      <tr>
        <td style="background:#0d1117;padding:18px 24px;">
          <div style="font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-size:14px;color:#56d364;">
            $ new-message --from ${escapeHtml(SITE_NAME)}
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

function buildText({ name, email, message, receivedAt }) {
  return [
    `New message from ${SITE_NAME}`,
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

/**
 * Emails a contact-form submission to NOTIFY_EMAIL.
 * `replyTo` is the sender's address so replying goes straight back to them.
 */
async function sendContactNotification({ name, email, message, receivedAt = new Date() }) {
  if (!transporter) {
    return { sent: false, reason: 'smtp-not-configured' };
  }

  const payload = { name, email, message, receivedAt };

  await transporter.sendMail({
    // Gmail requires the authenticated account in `from`, so the sender's
    // name goes in the display name instead of the address.
    from: `"${name} via ${SITE_NAME}" <${SMTP_USER}>`,
    to: NOTIFY_EMAIL,
    replyTo: `"${name}" <${email}>`,
    subject: `New portfolio message from ${name}`,
    text: buildText(payload),
    html: buildHtml(payload),
  });

  return { sent: true };
}

/** Checks the SMTP credentials once at boot so failures surface immediately. */
async function verifyMailer() {
  if (!transporter) {
    console.warn(
      '[mailer] SMTP_USER / SMTP_PASS are not set — contact notification emails are DISABLED. ' +
        'Submissions will still be saved to MongoDB.'
    );
    return false;
  }

  try {
    await transporter.verify();
    console.log(`[mailer] SMTP ready — notifications will be sent to ${NOTIFY_EMAIL}`);
    return true;
  } catch (err) {
    console.error(`[mailer] SMTP verification failed: ${err.message}`);
    console.error('[mailer] For Gmail, SMTP_PASS must be a 16-character App Password, not your login password.');
    return false;
  }
}

module.exports = { sendContactNotification, verifyMailer, isMailerConfigured: isConfigured };
