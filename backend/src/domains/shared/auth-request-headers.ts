import type { Request } from "express";

export const buildAuthRequestHeaders = (
  req: Request,
  fallbackOrigin: string,
) => {
  const headers = new Headers();

  const cookie = req.headers.cookie;
  if (cookie) {
    headers.set("cookie", cookie);
  }

  const origin = req.headers.origin ?? fallbackOrigin;
  headers.set("origin", origin);

  const userAgent = req.headers["user-agent"];
  if (userAgent) {
    headers.set("user-agent", userAgent);
  }

  const xForwardedFor = req.headers["x-forwarded-for"];
  if (typeof xForwardedFor === "string") {
    headers.set("x-forwarded-for", xForwardedFor);
  } else if (Array.isArray(xForwardedFor) && xForwardedFor.length > 0) {
    headers.set("x-forwarded-for", xForwardedFor[0]);
  }

  return headers;
};
