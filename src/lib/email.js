// Single source of truth for outbound email (Resend REST API — no SDK needed).
// Used by BOTH the contact form (/api/contact) and the WhatsApp auto-reply
// (/api/whatsapp/webhook) so there is exactly one "Resend function" to maintain.
//
// Required env:  RESEND_API_KEY
// Optional env:  WAYLUZ_FROM_EMAIL  (must be on a domain verified in Resend)
//                WAYLUZ_SALES_EMAIL
//                WAYLUZ_PROPERTIES_URL

export const SALES_EMAIL = process.env.WAYLUZ_SALES_EMAIL || 'sales@wayluz.com';
export const FROM_EMAIL = process.env.WAYLUZ_FROM_EMAIL || 'WayLuz <noreply@wayluz.com>';
export const PROPERTIES_URL =
  process.env.WAYLUZ_PROPERTIES_URL || 'https://wayluz.com/properties';

export function escapeHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Send an email via Resend. Never throws — returns { sent, reason }.
 * @returns {Promise<{sent: boolean, reason?: string, id?: string}>}
 */
export async function sendEmail({ to, subject, html, replyTo }) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return { sent: false, reason: 'RESEND_API_KEY not set' };

  const payload = {
    from: FROM_EMAIL,
    to: Array.isArray(to) ? to : [to],
    subject,
    html,
  };
  if (replyTo) payload.reply_to = replyTo;

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const detail = await res.text().catch(() => '');
      return { sent: false, reason: `Resend ${res.status}: ${detail.slice(0, 300)}` };
    }
    const data = await res.json().catch(() => ({}));
    return { sent: true, id: data?.id };
  } catch (err) {
    return { sent: false, reason: err?.message || 'Resend request failed' };
  }
}

/**
 * "More info" lead notification to the sales team.
 * Works for both web-form leads and WhatsApp leads (channel distinguishes them).
 */
export function sendSalesLead({
  channel = 'website',        // 'website' | 'whatsapp'
  name,
  email,                      // may be null for WhatsApp
  phone,                      // may be null for website
  waId,                       // WhatsApp number (digits) when channel === 'whatsapp'
  propertyInterest,
  message,
  userAgent,
}) {
  const row = (label, value) =>
    value
      ? `<tr><td style="padding:6px 12px;font-weight:bold;background:#f7f7f7;white-space:nowrap">${label}</td><td style="padding:6px 12px">${escapeHtml(value)}</td></tr>`
      : '';

  const waLink = waId ? `https://wa.me/${String(waId).replace(/[^\d]/g, '')}` : null;

  const html = `
  <div style="font-family:Arial,Helvetica,sans-serif;max-width:640px;margin:0 auto;color:#1a1a1a">
    <h2>New ${channel === 'whatsapp' ? 'WhatsApp' : 'website'} lead</h2>
    <table style="border-collapse:collapse;width:100%;border:1px solid #eee">
      ${row('Name', name)}
      ${row('Email', email)}
      ${row('Phone', phone)}
      ${row('WhatsApp', waId)}
      ${row('Property of interest', propertyInterest)}
      ${row('Message', message)}
      ${row('User agent', userAgent)}
    </table>
    ${waLink ? `<p style="margin-top:16px"><a href="${waLink}" style="background:#25D366;color:#fff;text-decoration:none;padding:12px 22px;border-radius:8px;font-weight:bold;display:inline-block">Open chat in WhatsApp</a></p>` : ''}
    ${email ? `<p style="font-size:13px;color:#666;margin-top:16px">Reply directly to this email to respond to ${escapeHtml(name || 'the lead')}.</p>` : ''}
  </div>`;

  const subject = `New ${channel === 'whatsapp' ? 'WhatsApp' : 'website'} lead: ${
    name || waId || 'unknown'
  }${propertyInterest ? ` — ${propertyInterest}` : ''}`;

  return sendEmail({
    to: SALES_EMAIL,
    subject,
    html,
    replyTo: email || undefined, // only meaningful when we have the customer's email
  });
}

/**
 * Auto-reply email to a WEB-form visitor: thanks them, asks which property,
 * and links the properties page (details + pricing).
 */
export function sendVisitorAutoReply({ to, name, propertyInterest }) {
  const safeName = escapeHtml(name || 'there');
  const interestLine = propertyInterest
    ? `<p>We see you're interested in <strong>${escapeHtml(propertyInterest)}</strong>. Could you confirm that's the property you'd like details on?</p>`
    : `<p>To point you to the right listing, <strong>which property are you seeking information about?</strong> Just reply and let us know.</p>`;

  const html = `
  <div style="font-family:Arial,Helvetica,sans-serif;max-width:560px;margin:0 auto;color:#1a1a1a;line-height:1.6">
    <h2 style="color:#0f0f0f">Thank you for contacting WayLuz, ${safeName}</h2>
    <p>We've received your message and our team will be in touch shortly.</p>
    ${interestLine}
    <p>Meanwhile, browse <strong>every property with full details and current pricing</strong> here:</p>
    <p style="margin:24px 0">
      <a href="${PROPERTIES_URL}" style="background:#d4af37;color:#0f0f0f;text-decoration:none;padding:14px 28px;border-radius:8px;font-weight:bold;display:inline-block">View all properties &amp; pricing</a>
    </p>
    <p style="font-size:13px;color:#666">${escapeHtml(PROPERTIES_URL)}</p>
    <hr style="border:none;border-top:1px solid #eee;margin:24px 0"/>
    <p style="font-size:13px;color:#666">WayLuz Inversiones SAS &middot; Colombia &middot; <a href="mailto:${SALES_EMAIL}">${SALES_EMAIL}</a></p>
  </div>`;

  return sendEmail({
    to,
    subject: 'Thanks for contacting WayLuz — which property interests you?',
    html,
    replyTo: SALES_EMAIL,
  });
}
