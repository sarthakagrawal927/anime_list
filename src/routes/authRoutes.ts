import { Router, Request, Response } from "express";
import { OAuth2Client } from "google-auth-library";
import { findOrCreateUser } from "../db/users";
import { signToken } from "../middleware/auth";
import { catcher } from "../utils/functional";

const router = Router();

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;

const googleLogin = async (req: Request, res: Response) => {
  const { credential } = req.body;
  if (!credential || typeof credential !== "string") {
    res.status(400).json({ error: "Missing Google credential token" });
    return;
  }

  if (!GOOGLE_CLIENT_ID) {
    res.status(500).json({ error: "Google OAuth not configured" });
    return;
  }

  const client = new OAuth2Client(GOOGLE_CLIENT_ID);
  const ticket = await client.verifyIdToken({
    idToken: credential,
    audience: GOOGLE_CLIENT_ID,
  });

  const payload = ticket.getPayload();
  if (!payload || !payload.sub || !payload.email) {
    res.status(400).json({ error: "Invalid Google token" });
    return;
  }

  const user = await findOrCreateUser({
    googleId: payload.sub,
    email: payload.email,
    name: payload.name || payload.email,
    picture: payload.picture,
  });

  const token = signToken({
    userId: user.id,
    email: user.email,
    name: user.name,
    picture: user.picture,
  });

  res.json({
    token,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      picture: user.picture,
    },
  });
};

router.post("/auth/google", catcher(googleLogin));

export default router;
