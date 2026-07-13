import { randomBytes } from 'node:crypto';

/** Alphabet excludes ambiguous characters (0/O, 1/l/I) for out-of-band communication. */
const TEMP_PASSWORD_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%&*';

const DEFAULT_LENGTH = 16;

/**
 * Generates a cryptographically secure temporary password meeting product strength (min 8).
 * Plaintext is for one-time return only — callers must hash before persistence.
 */
export function generateTemporaryPassword(length = DEFAULT_LENGTH): string {
  const size = Math.max(8, length);
  const bytes = randomBytes(size);
  let result = '';
  for (let i = 0; i < size; i++) {
    result += TEMP_PASSWORD_ALPHABET[bytes[i]! % TEMP_PASSWORD_ALPHABET.length];
  }
  return result;
}
