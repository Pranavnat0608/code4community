/** @param {string | null | undefined} email */
export function normalizeEmail(email) {
  return typeof email === "string" ? email.trim().toLowerCase() : "";
}

/** @param {string | null | undefined} a @param {string | null | undefined} b */
export function emailsEqual(a, b) {
  const na = normalizeEmail(a);
  const nb = normalizeEmail(b);
  return na.length > 0 && na === nb;
}
