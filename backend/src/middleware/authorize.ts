import { FastifyRequest, FastifyReply } from 'fastify';
import { JwtPayload } from '../lib/jwt.js';

const planHierarchy = {
  free: 0,
  pro: 1,
  enterprise: 2,
} as const;

export const requirePlan = (minPlan: 'pro' | 'enterprise') => {
  return async (req: FastifyRequest, reply: FastifyReply) => {
    // Authenticate middleware must run before this
    const user = req.user as JwtPayload | undefined;
    
    if (!user) {
      return reply.status(401).send({ error: 'Unauthorized', message: 'Not authenticated' });
    }

    const userPlanLevel = planHierarchy[user.plan as keyof typeof planHierarchy] ?? 0;
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
          link: `/billing/upgrade?plan=${minPlan}`
        }
      });
    }
  };
};
