import {
  type Request as ExpressRequest,
  type Response as ExpressResponse,
  Router,
} from "express";

import { buildAuthRequestHeaders } from "../shared/auth-request-headers.js";
import { auth } from "./auth.config.js";

type JsonBody = Record<string, unknown> | undefined;

const authApiBaseUrl = new URL(
  process.env.BETTER_AUTH_URL ?? "http://localhost:3000",
);

const buildAuthRequest = (
  req: ExpressRequest,
  pathname: string,
  method: "POST" | "GET",
  body?: JsonBody,
) => {
  const url = new URL(`/api/auth${pathname}`, authApiBaseUrl).toString();
  const headers = buildAuthRequestHeaders(req, authApiBaseUrl.origin);

  if (body) {
    headers.set("content-type", "application/json");
  }

  return new Request(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
};

const pipeAuthResponse = async (response: Response, res: ExpressResponse) => {
  const headersWithSetCookie = response.headers as Headers & {
    getSetCookie?: () => string[];
  };
  const setCookies =
    headersWithSetCookie.getSetCookie?.call(response.headers) ?? [];

  if (setCookies.length > 0) {
    res.setHeader("set-cookie", setCookies);
  } else {
    const setCookie = response.headers.get("set-cookie");
    if (setCookie) {
      res.setHeader("set-cookie", setCookie);
    }
  }

  const contentType = response.headers.get("content-type");
  if (contentType?.includes("application/json")) {
    const payload = (await response.json()) as unknown;
    res.status(response.status).json(payload);
    return;
  }

  const text = await response.text();
  res.status(response.status).send(text);
};

export const authRouter = Router();

authRouter.post("/sign-in", async (req, res, next) => {
  try {
    const authRequest = buildAuthRequest(
      req,
      "/sign-in/email",
      "POST",
      req.body as JsonBody,
    );
    const response = await auth.handler(authRequest);
    await pipeAuthResponse(response, res);
  } catch (error) {
    next(error);
  }
});

authRouter.post("/sign-out", async (req, res, next) => {
  try {
    const authRequest = buildAuthRequest(req, "/sign-out", "POST");
    const response = await auth.handler(authRequest);
    await pipeAuthResponse(response, res);
  } catch (error) {
    next(error);
  }
});

authRouter.get("/session", async (req, res, next) => {
  try {
    const authRequest = buildAuthRequest(req, "/get-session", "GET");
    const response = await auth.handler(authRequest);
    await pipeAuthResponse(response, res);
  } catch (error) {
    next(error);
  }
});
