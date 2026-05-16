import ms from 'ms';

/**
 * Converts a jsonwebtoken `expiresIn` value to Fastify cookie `maxAge` (seconds).
 */
export function jwtExpiresInToCookieMaxAgeSeconds(expiresIn: string | number): number {
  if (typeof expiresIn === 'number') {
    if (!Number.isFinite(expiresIn) || expiresIn <= 0) {
      throw new Error(`Invalid JWT expiresIn: expected a positive number of seconds, got ${expiresIn}`);
    }
    return Math.max(1, Math.floor(expiresIn));
  }

  const str = String(expiresIn).trim();
  if (str === '') {
    throw new Error('Invalid JWT expiresIn: empty string');
  }

  const milliseconds = ms(str as ms.StringValue);
  if (typeof milliseconds !== 'number' || !Number.isFinite(milliseconds) || milliseconds <= 0) {
    throw new Error(`Invalid JWT expiresIn: could not parse duration: ${expiresIn}`);
  }

  return Math.max(1, Math.ceil(milliseconds / 1000));
}
