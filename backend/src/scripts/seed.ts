import "dotenv/config";
import { eq } from "drizzle-orm";

import { auth } from "../domains/auth/auth.config.js";
import { db, pool } from "../db/index.js";
import { user } from "../db/schema.js";

const ADMIN_EMAIL = "test@email.com";
const ADMIN_PASSWORD = "password";
const ADMIN_NAME = "admin";

const run = async () => {
  const existingUser = await db.query.user.findFirst({
    where: eq(user.email, ADMIN_EMAIL),
  });

  if (existingUser) {
    console.log(`Seed skipped: ${ADMIN_EMAIL} already exists.`);
    return;
  }

  await auth.api.signUpEmail({
    body: {
      name: ADMIN_NAME,
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
    },
    headers: new Headers({
      origin: process.env.BETTER_AUTH_URL ?? "http://localhost:3000",
    }),
  });

  console.log(`Seed complete: created ${ADMIN_EMAIL} (${ADMIN_NAME}).`);
};

run()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
