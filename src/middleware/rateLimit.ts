import rateLimit from "express-rate-limit";

export const userRateLimit = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  keyGenerator: (req) => {
    const authReq = req as any;
    return authReq.user?.userId || "anonymous";
  },
  standardHeaders: true,
  legacyHeaders: false,
  validate: { xForwardedForHeader: false },
});
