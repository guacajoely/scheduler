import type { Request, RequestHandler } from "express";

import { auth } from "../auth/auth.config.js";
import { buildAuthRequestHeaders } from "./auth-request-headers.js";

const fallbackAuthOrigin = new URL(
  process.env.BETTER_AUTH_URL ?? "http://localhost:3000",
).origin;

export type AuthSession = Awaited<ReturnType<typeof auth.api.getSession>>;

const getSession = async (req: Request) =>
  auth.api.getSession({
    headers: buildAuthRequestHeaders(req, fallbackAuthOrigin),
  });

export const requireAuth: RequestHandler = async (req, res, next) => {
  try {
    const session = await getSession(req);

    if (!session) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    res.locals.auth = session;
    next();
  } catch (error) {
    next(error);
  }
};
