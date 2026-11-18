/**
 * Normalize an Egyptian mobile number to the local 01XXXXXXXXX format.
 * Accepts +20, 0020, 20 and bare 1XXXXXXXXX inputs.
 */
export function normalizePhone(raw: string | null | undefined) {
  let digits = String(raw || "").replace(/\D/g, "");
  if (digits.startsWith("0020")) digits = digits.slice(4);
  else if (digits.startsWith("20")) digits = digits.slice(2);
  if (digits.length === 10 && digits.startsWith("1")) return `0${digits}`;
  if (digits.length === 11 && digits.startsWith("01")) return digits;
  return digits;
}

/** Egyptian mobile numbers only: 010, 011, 012 and 015. */
export function isValidEgyptMobile(raw: string | null | undefined) {
  return /^01[0125]\d{8}$/.test(normalizePhone(raw));
}
