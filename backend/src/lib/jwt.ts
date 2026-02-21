import jwt from 'jsonwebtoken';
import { config } from '../config.js';

export interface JWTPayload {
  userId: string;
  email: string;
  plan: 'free' | 'pro' | 'enterprise';
  preferredAiProvider: 'anthropic' | 'openai' | 'gemini';
  preferredModel: string;
}

/**
 * Sign a JWT access token.
 * @param payload - User claims to encode
 * @param expiresIn - Token lifetime (default 15m)
 */
export function signToken(payload: JWTPayload, expiresIn: string | number = '15m'): string {
  return jwt.sign(payload as object, config.JWT_SECRET, { expiresIn } as jwt.SignOptions);
}

/**
 * Verify a JWT access token.
 * Supports key rotation: tries JWT_SECRET first, then NEXT_JWT_SECRET if configured.
 */
export function verifyToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, config.JWT_SECRET) as JWTPayload;
  } catch {
    // If NEXT_JWT_SECRET is configured, try rotation key
    if (config.NEXT_JWT_SECRET) {
      try {
        return jwt.verify(token, config.NEXT_JWT_SECRET) as JWTPayload;
      } catch {
        return null;
      }
    }
    return null;
  }
}

/**
 * Sign a refresh token (long-lived, separate secret).
 * This is used for the refresh token JWT wrapper if needed,
 * but we primarily use opaque tokens + argon2id hashes in Redis.
 */
export function signRefreshToken(payload: { userId: string }, expiresIn: string | number = '7d'): string {
  return jwt.sign(payload, config.REFRESH_SECRET, { expiresIn } as jwt.SignOptions);
}

/**
 * Verify a refresh token signed with REFRESH_SECRET.
 */
export function verifyRefreshToken(token: string): { userId: string } | null {
  try {
    return jwt.verify(token, config.REFRESH_SECRET) as { userId: string };
  } catch {
    return null;
  }
}
