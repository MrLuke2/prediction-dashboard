import { JWTPayload } from '../lib/jwt.js';

declare module 'fastify' {
  interface FastifyRequest {
    user: JWTPayload;
  }
}

declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: JWTPayload;
    user: JWTPayload;
  }
}
