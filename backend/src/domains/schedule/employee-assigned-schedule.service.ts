import { and, eq, isNull } from "drizzle-orm";

import {
  clientSchedule,
  employeeSchedule,
  type EmployeeAssignedSchedule,
} from "../../db/schema.js";
import type { ScheduleDbConn } from "./client-assigned-schedule.service.js";

const deriveEmployeeScheduleForWeek = async (
  dbConn: ScheduleDbConn,
  weekOf: string,
) => {
  const rows = await dbConn.query.clientSchedule.findMany({
    where: and(
      eq(clientSchedule.weekOf, weekOf),
      isNull(clientSchedule.deletedAt),
    ),
  });

  const byEmployee = new Map<string, EmployeeAssignedSchedule>();

  for (const row of rows) {
    for (const entry of row.schedule) {
      const items = byEmployee.get(entry.employeeId) ?? [];
      items.push({
        dayOfWeek: entry.dayOfWeek,
        startTime: entry.startTime,
        endTime: entry.endTime,
        clientId: row.clientId,
      });
      byEmployee.set(entry.employeeId, items);
    }
  }

  return byEmployee;
};

export const syncEmployeeAssignedSchedulesForWeek = async (
  dbConn: ScheduleDbConn,
  weekOf: string,
  employeeIds: string[],
) => {
  const byEmployee = await deriveEmployeeScheduleForWeek(dbConn, weekOf);

  await Promise.all(
    employeeIds.map(async (employeeId) => {
      const schedule = byEmployee.get(employeeId) ?? [];

      if (schedule.length === 0) {
        await dbConn
          .delete(employeeSchedule)
          .where(
            and(
              eq(employeeSchedule.employeeId, employeeId),
              eq(employeeSchedule.weekOf, weekOf),
            ),
          );
        return;
      }

      await dbConn
        .insert(employeeSchedule)
        .values({
          employeeId,
          weekOf,
          schedule,
          deletedAt: null,
        })
        .onConflictDoUpdate({
          target: [employeeSchedule.employeeId, employeeSchedule.weekOf],
          set: {
            schedule,
            deletedAt: null,
          },
        });
    }),
  );
};
