import { JwtPayload } from '../lib/jwt.js';

declare module 'fastify' {
  interface FastifyRequest {
    user: JwtPayload;
  }
}

declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: JwtPayload; // payload type is used for signing and verifying
    user: JwtPayload; // user type is return type of `request.user` object
  }
}
