import jwt, { type SignOptions } from 'jsonwebtoken';
import { config } from '@config/env';

/** The claims we embed in the token. Keep it minimal — tokens travel on every request. */
export interface JwtPayload {
  sub: number; // subject = user id (standard JWT claim)
  email: string;
}

/**
 * JWT utility — sign and verify tokens in ONE place.
 *
 * WHY JWT: stateless auth. The signed token itself proves identity, so protected
 * endpoints don't need a DB/session lookup on every request — the API scales
 * horizontally without shared session storage.
 *
 * Isolating sign/verify here means the secret and algorithm choice live in a
 * single module; rotating the secret or switching to RS256 touches one file.
 */
export const tokenService = {
  sign(payload: JwtPayload): string {
    // Cast the whole options object: `expiresIn` accepts a vendor string type
    // ("1d", "15m", …) that we keep configurable via env.
    const options = { expiresIn: config.auth.jwtExpiresIn } as SignOptions;
    return jwt.sign(payload, config.auth.jwtSecret, options);
  },

  /** Verify signature + expiry. Throws (JsonWebTokenError/TokenExpiredError) on failure. */
  verify(token: string): JwtPayload {
    // jwt.verify returns `string | JwtPayload`; our tokens always carry an object
    // payload, so we narrow through `unknown` to our known claim shape.
    return jwt.verify(token, config.auth.jwtSecret) as unknown as JwtPayload;
  },
};
