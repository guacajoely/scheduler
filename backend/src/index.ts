import "dotenv/config";
import cors from "cors";
import express from "express";
import { toNodeHandler } from "better-auth/node";

import { auth } from "./domains/auth/auth.config.js";
import { authRouter } from "./domains/auth/auth.routes.js";
import { clientRouter } from "./domains/client/client.routes.js";
import { employeeRouter } from "./domains/employee/employee.routes.js";

const app = express();
const port = Number(process.env.PORT ?? 3000);

app.use(
  cors({
    origin: true,
    credentials: true,
  }),
);
app.use(express.json());

app.all("/api/auth/*splat", toNodeHandler(auth));
app.use("/api", authRouter);
app.use("/api", clientRouter);
app.use("/api", employeeRouter);

app.get("/health", (_req, res) => {
  res.status(200).json({ ok: true });
});

app.listen(port, () => {
  console.log(`Backend listening on http://localhost:${port}`);
});
