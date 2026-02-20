import { z } from 'zod';
import zxcvbn from 'zxcvbn'; // Ensure @types/zxcvbn installed

export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(12, "Password must be at least 12 characters").refine((val) => {
    const result = zxcvbn(val);
    return result.score >= 3;
  }, {
    message: "Password is too weak (score < 3)",
  }),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

export const refreshSchema = z.object({
  // Typically handled via cookie, but maybe body fallback?
  // User constraint: "Validate refresh token from httpOnly cookie"
  // So body might be empty or just specific structure if needed.
  // We can validate cookie exists in route handler.
});
