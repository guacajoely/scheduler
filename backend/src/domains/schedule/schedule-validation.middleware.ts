import type { RequestHandler } from "express";

import {
  isUpcomingPacificMondayWeekOf,
  upcomingPacificMondayWeekOfValidationMessage,
} from "../shared/week-of.js";

type RequestWithWeekOfBody = {
  body?: {
    weekOf?: unknown;
  };
};

export const validateUpcomingPacificMondayWeekOfBody: RequestHandler = (
  req,
  res,
  next,
) => {
  const request = req as RequestWithWeekOfBody;
  const weekOf = request.body?.weekOf;

  if (typeof weekOf !== "string" || !isUpcomingPacificMondayWeekOf(weekOf)) {
    res.status(400).json({
      message: upcomingPacificMondayWeekOfValidationMessage,
    });
    return;
  }

  next();
};
