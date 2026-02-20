import jwt from 'jsonwebtoken';
import { config } from '../config.js';

export interface JwtPayload {
  userId: string;
  email: string;
  plan: 'free' | 'pro' | 'enterprise' | string ; // Allow other strings if plan enum changes?
}

export const signToken = (payload: JwtPayload, expiresIn: string | number = '15m'): string => {
  return jwt.sign(payload as object, config.JWT_SECRET, { expiresIn } as jwt.SignOptions);
};

export const verifyToken = (token: string): JwtPayload | null => {
  try {
    return jwt.verify(token, config.JWT_SECRET) as JwtPayload;
  } catch (err) {
    if (config.NEXT_JWT_SECRET) {
      try {
        return jwt.verify(token, config.NEXT_JWT_SECRET) as JwtPayload;
      } catch (e) {
        return null;
      }
    }
    return null;
  }
};
