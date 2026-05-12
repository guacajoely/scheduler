import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { betterAuth } from "better-auth";

import { db } from "../../db/index.js";
import * as schema from "../../db/schema.js";

const betterAuthSecret = process.env.BETTER_AUTH_SECRET;
const betterAuthUrl = process.env.BETTER_AUTH_URL;
const trustedOriginsFromEnv = (process.env.BETTER_AUTH_TRUSTED_ORIGINS ?? "")
  .split(",")
  .map((origin) => origin.trim())
  .filter((origin) => origin.length > 0);

if (!betterAuthSecret) {
  throw new Error("BETTER_AUTH_SECRET is not set");
}

if (!betterAuthUrl) {
  throw new Error("BETTER_AUTH_URL is not set");
}

const trustedOrigins = Array.from(
  new Set([
    new URL(betterAuthUrl).origin,
    "http://localhost:5173",
    ...trustedOriginsFromEnv,
  ]),
);

export const auth = betterAuth({
  secret: betterAuthSecret,
  baseURL: betterAuthUrl,
  trustedOrigins,
  database: drizzleAdapter(db, {
    provider: "pg",
    schema,
  }),
  emailAndPassword: {
    enabled: true,
  },
});
