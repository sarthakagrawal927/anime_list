import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  console.warn("⚠ JWT_SECRET not set — authentication will be disabled");
}

export interface AuthPayload {
  userId: string;
  email: string;
  name: string;
  picture?: string;
}

export interface AuthRequest extends Request {
  user?: AuthPayload;
}

function extractToken(req: Request): string | null {
  const header = req.headers.authorization;
  if (header?.startsWith("Bearer ")) {
    return header.slice(7);
  }
  return null;
}

export function requireAuth(req: AuthRequest, res: Response, next: NextFunction): void {
  if (!JWT_SECRET) {
    res.status(503).json({ error: "Authentication is not configured" });
    return;
  }

  const token = extractToken(req);
  if (!token) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET) as AuthPayload;
    req.user = payload;
    next();
  } catch {
    res.status(401).json({ error: "Invalid or expired token" });
  }
}

export function optionalAuth(req: AuthRequest, _res: Response, next: NextFunction): void {
  if (!JWT_SECRET) {
    next();
    return;
  }

  const token = extractToken(req);
  if (!token) {
    next();
    return;
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET) as AuthPayload;
    req.user = payload;
  } catch {
    // Invalid token - just continue without auth
  }
  next();
}

export function signToken(payload: AuthPayload): string {
  if (!JWT_SECRET) {
    throw new Error("Cannot sign token: JWT_SECRET is not configured");
  }
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
}
