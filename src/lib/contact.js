// Central contact details for WayLuz Inversions SAS.
// Keep WhatsApp numbers in E.164 digits only (no +, spaces, or dashes)
// because that is the format wa.me requires.

// WhatsApp business line — Twilio WhatsApp sender, registered with Meta.
// Chats open here (floating button + every "Send a message" link).
export const WHATSAPP_NUMBER = '14246224568';        // wa.me format (digits only)
export const WHATSAPP_DISPLAY = '+1 (424) 622-4568'; // human-readable

// Voice / phone line — rings a real phone. Used by the "Call" buttons.
export const PHONE_DISPLAY = '+57 320 9937784';      // human-readable
export const PHONE_TEL = '+573209937784';            // tel: href format

const DEFAULT_WHATSAPP_MESSAGE =
  "Hi WayLuz, I'm interested in your properties in Colombia.";

/**
 * Build a wa.me link that opens a WhatsApp chat with WayLuz.
 * @param {string} [message] optional prefilled message
 * @returns {string} a https://wa.me/... URL
 */
export function whatsappLink(message = DEFAULT_WHATSAPP_MESSAGE) {
  const base = `https://wa.me/${WHATSAPP_NUMBER}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}
