/**
 * Input validation utilities to prevent injection attacks
 */

/**
 * Sanitize string input to prevent injection attacks
 */
export function sanitizeInput(input: string): string {
  if (typeof input !== "string") return "";

  return input
    .trim()
    .slice(0, 5000) // Limit length
    .replace(/[<>]/g, "") // Remove potential HTML/injection characters
    .replace(/[{}]/g, ""); // Remove braces that could be used in query injections
}

/**
 * Validate email address
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate premium key format
 */
export function isValidKeyFormat(key: string): boolean {
  // Format: PINPIN-XXXX-XXXX-XXXX
  const keyRegex = /^PINPIN-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/;
  return keyRegex.test(key);
}

/**
 * Sanitize Firestore query parameters
 */
export function sanitizeFirestoreQuery(query: any): any {
  if (typeof query !== "object" || query === null) return {};

  const sanitized: any = {};

  for (const key in query) {
    const value = query[key];

    // Block prototype pollution
    if (key === "__proto__" || key === "constructor" || key === "prototype") {
      continue;
    }

    // Sanitize string values
    if (typeof value === "string") {
      sanitized[key] = sanitizeInput(value);
    } else if (typeof value === "number") {
      sanitized[key] = value;
    } else if (typeof value === "boolean") {
      sanitized[key] = value;
    } else if (value instanceof Date) {
      sanitized[key] = value.toISOString();
    }
  }

  return sanitized;
}

/**
 * Validate user object structure
 */
export function isValidUserData(user: any): boolean {
  if (!user || typeof user !== "object") return false;

  const { email, uid } = user;
  return typeof email === "string" && typeof uid === "string" && isValidEmail(email);
}
