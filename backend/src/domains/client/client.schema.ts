import { z } from "zod";

import { dayOfWeekValues } from "../../db/schema.js";
import { basePersonSchema } from "../shared/person.schema.js";

const dayOfWeekSchema = z.enum(dayOfWeekValues);
const timeOfDaySchema = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, {
  message: "Time must use HH:MM 24-hour format",
});

const clientRequestedScheduleEntrySchema = z
  .object({
    dayOfWeek: dayOfWeekSchema,
    startTime: timeOfDaySchema,
    endTime: timeOfDaySchema,
  })
  .refine((value) => value.startTime < value.endTime, {
    message: "endTime must be after startTime",
    path: ["endTime"],
  });

export const clientIdParamsSchema = z.object({
  id: z.string().trim().min(1),
});

export const createClientSchema = basePersonSchema.extend({
  requestedSchedule: z.array(clientRequestedScheduleEntrySchema).default([]),
});

export const updateClientSchema = createClientSchema
  .partial()
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one field is required",
  });

export type ClientIdParams = z.infer<typeof clientIdParamsSchema>;
export type CreateClientInput = z.infer<typeof createClientSchema>;
export type UpdateClientInput = z.infer<typeof updateClientSchema>;
