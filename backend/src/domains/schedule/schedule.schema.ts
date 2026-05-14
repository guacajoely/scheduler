import { z } from "zod";

import { dayOfWeekValues } from "../../db/schema.js";

const dayOfWeekSchema = z.enum(dayOfWeekValues);
const timeOfDaySchema = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, {
  message: "Time must use HH:MM 24-hour format",
});
const weekOfSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, {
  message: "weekOf must be YYYY-MM-DD",
});

export const weekOfQuerySchema = z.object({
  weekOf: weekOfSchema,
});

export const replaceClientAssignedScheduleSchema = z.object({
  weekOf: weekOfSchema,
  schedule: z
    .array(
      z
        .object({
          dayOfWeek: dayOfWeekSchema,
          startTime: timeOfDaySchema,
          endTime: timeOfDaySchema,
          employeeId: z.string().trim().min(1),
        })
        .refine((value) => value.startTime < value.endTime, {
          message: "endTime must be after startTime",
          path: ["endTime"],
        }),
    )
    .default([]),
});

export type ReplaceClientAssignedScheduleInput = z.infer<
  typeof replaceClientAssignedScheduleSchema
>;
export type WeekOfQueryInput = z.infer<typeof weekOfQuerySchema>;
