/** Builds a wa.me link from a local Egyptian number (e.g. 01005419148). */
export function whatsappUrl(phone?: string | null) {
  const digits = (phone || "").replace(/\D/g, "");
  if (!digits) return null;
  const normalized = digits.startsWith("20")
    ? digits
    : digits.startsWith("0")
      ? `20${digits.slice(1)}`
      : `20${digits}`;
  return `https://wa.me/${normalized}`;
}
