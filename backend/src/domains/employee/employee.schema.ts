import { z } from "zod";

import { dayOfWeekValues } from "../../db/schema.js";
import { basePersonSchema } from "../shared/person.schema.js";

const dayOfWeekSchema = z.enum(dayOfWeekValues);

export const employeeIdParamsSchema = z.object({
  id: z.string().trim().min(1),
});

export const createEmployeeSchema = basePersonSchema.extend({
  requestedSchedule: z.array(dayOfWeekSchema).default([]),
});

export const updateEmployeeSchema = createEmployeeSchema
  .partial()
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one field is required",
  });

export type CreateEmployeeInput = z.infer<typeof createEmployeeSchema>;
export type UpdateEmployeeInput = z.infer<typeof updateEmployeeSchema>;
export type EmployeeIdParams = z.infer<typeof employeeIdParamsSchema>;
