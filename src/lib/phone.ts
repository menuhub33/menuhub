export function digitsOnly(value: string): string {
  return value.replace(/\D/g, "");
}

export function toWhatsAppNumber(value: string | null | undefined): string | null {
  if (!value) return null;
  if (/^https?:\/\//i.test(value)) {
    const match = value.match(/(\d{8,})/);
    return match?.[1] ? normalizeWhatsAppDigits(match[1]) : null;
  }
  const digits = digitsOnly(value);
  if (digits.length < 8) return null;
  return normalizeWhatsAppDigits(digits);
}

function normalizeWhatsAppDigits(digits: string): string {
  let next = digits;
  if (next.startsWith("00")) next = next.slice(2);
  if (/^09\d{8}$/.test(next)) return `963${next.slice(1)}`;
  if (/^9\d{8}$/.test(next)) return `963${next}`;
  return next;
}

export function whatsappHref(value: string): string {
  if (/^https?:\/\//i.test(value)) return value;
  const number = toWhatsAppNumber(value);
  return number ? `https://wa.me/${number}` : `https://wa.me/${digitsOnly(value)}`;
}
