import type { AuthSession } from "../domains/shared/auth.middleware.js";

declare global {
  namespace Express {
    interface Locals {
      auth: NonNullable<AuthSession>;
    }
  }
}

export {};
