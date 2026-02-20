import { FastifyRequest, FastifyReply } from 'fastify';
import { verifyToken, JwtPayload } from '../lib/jwt.js';



export const authenticate = async (req: FastifyRequest, reply: FastifyReply) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      reply.header('WWW-Authenticate', 'Bearer realm="Alpha Mode Predict"');
      return reply.status(401).send({ error: 'Unauthorized', message: 'Missing or invalid Authorization header' });
    }

    const token = authHeader.split(' ')[1];
    const payload = verifyToken(token);

    if (!payload) {
      reply.header('WWW-Authenticate', 'Bearer realm="Alpha Mode Predict", error="invalid_token"');
      return reply.status(401).send({ error: 'Unauthorized', message: 'Invalid or expired token' });
    }

    req.user = payload;
  } catch (err) {
    reply.status(401).send(err);
  }
};
