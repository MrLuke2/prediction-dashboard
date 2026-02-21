import { FastifyRequest, FastifyReply } from 'fastify';
import { JWTPayload } from '../lib/jwt.js';

const planHierarchy: Record<string, number> = {
  free: 0,
  pro: 1,
  enterprise: 2,
};

/**
 * Authorization middleware factory.
 * Returns a Fastify preHandler that enforces minimum plan requirements.
 * Must be used AFTER authenticate middleware.
 *
 * @param minPlan - Minimum plan required ('pro' | 'enterprise')
 * @returns Fastify preHandler hook
 */
export const requirePlan = (minPlan: 'pro' | 'enterprise') => {
  return async (req: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const user = req.user as JWTPayload | undefined;

    if (!user) {
      return reply.status(401).send({
        error: 'Unauthorized',
        message: 'Not authenticated',
      });
    }

    const userPlanLevel = planHierarchy[user.plan] ?? 0;
    const requiredLevel = planHierarchy[minPlan];

    if (userPlanLevel < requiredLevel) {
      return reply.status(403).send({
        error: 'Forbidden',
        message: `This feature requires the ${minPlan} plan.`,
        requiredPlan: minPlan,
        currentPlan: user.plan,
        upgradePrompt: {
          title: `Upgrade to ${minPlan}`,
          description: `Unlock this feature and more with our ${minPlan} plan.`,
          cta: 'Upgrade Now',
          link: `/billing/upgrade?plan=${minPlan}`,
        },
      });
    }
  };
};
