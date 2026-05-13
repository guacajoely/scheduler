import type { RequestHandler, Response } from "express";
import type { ZodError, ZodType } from "zod";

type RequestValidationSchemas = {
  params?: ZodType<unknown>;
  body?: ZodType<unknown>;
  query?: ZodType<unknown>;
};

const flattenErrors = (error: ZodError) =>
  error.issues.map((issue) => ({
    path: issue.path.join("."),
    message: issue.message,
  }));

export const validateQueryOrRespond = <TQuery>(
  res: Response,
  query: unknown,
  schema: ZodType<TQuery>,
): TQuery | null => {
  const result = schema.safeParse(query);
  if (!result.success) {
    res.status(400).json({
      message: "Invalid request query",
      errors: flattenErrors(result.error),
    });
    return null;
  }
  return result.data;
};

export const validateRequest = (
  schemas: RequestValidationSchemas,
): RequestHandler => {
  return (req, res, next) => {
    if (schemas.params) {
      const result = schemas.params.safeParse(req.params);
      if (!result.success) {
        res.status(400).json({
          message: "Invalid request params",
          errors: flattenErrors(result.error),
        });
        return;
      }
      req.params = result.data as typeof req.params;
    }

    if (schemas.body) {
      const result = schemas.body.safeParse(req.body);
      if (!result.success) {
        res.status(400).json({
          message: "Invalid request body",
          errors: flattenErrors(result.error),
        });
        return;
      }
      req.body = result.data;
    }

    if (schemas.query) {
      const result = schemas.query.safeParse(req.query);
      if (!result.success) {
        res.status(400).json({
          message: "Invalid request query",
          errors: flattenErrors(result.error),
        });
        return;
      }
      req.query = result.data as typeof req.query;
    }

    next();
  };
};
