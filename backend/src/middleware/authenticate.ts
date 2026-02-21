import { FastifyRequest, FastifyReply } from 'fastify';
import { verifyToken, JWTPayload } from '../lib/jwt.js';

/**
 * Fastify preHandler hook: extracts and validates JWT from Authorization header.
 * Attaches decoded payload to request.user.
 * Returns 401 with WWW-Authenticate header if invalid or missing.
 */
export const authenticate = async (req: FastifyRequest, reply: FastifyReply): Promise<void> => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    reply.header('WWW-Authenticate', 'Bearer realm="Alpha Mode Predict"');
    return reply.status(401).send({
      error: 'Unauthorized',
      message: 'Missing or invalid Authorization header',
    });
  }

  const token = authHeader.split(' ')[1];
  const payload = verifyToken(token);

  if (!payload) {
    reply.header('WWW-Authenticate', 'Bearer realm="Alpha Mode Predict", error="invalid_token"');
    return reply.status(401).send({
      error: 'Unauthorized',
      message: 'Invalid or expired token',
    });
  }

  req.user = payload;
};
