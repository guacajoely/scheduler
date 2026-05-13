import { and, eq, isNull } from "drizzle-orm";

import { db } from "../../db/index.js";
import {
  clientSchedule,
  type ClientAssignedSchedule,
} from "../../db/schema.js";

export type ScheduleDbConn = Omit<typeof db, "$client">;

export const getClientAssignedScheduleForWeek = async (
  dbConn: ScheduleDbConn,
  clientId: string,
  weekOf: string,
) => {
  const record = await dbConn.query.clientSchedule.findFirst({
    where: and(
      eq(clientSchedule.clientId, clientId),
      eq(clientSchedule.weekOf, weekOf),
      isNull(clientSchedule.deletedAt),
    ),
  });
  return record ?? null;
};

export const upsertClientAssignedSchedule = async (
  dbConn: ScheduleDbConn,
  clientId: string,
  weekOf: string,
  schedule: ClientAssignedSchedule,
) => {
  const [record] = await dbConn
    .insert(clientSchedule)
    .values({
      clientId,
      weekOf,
      schedule,
      deletedAt: null,
    })
    .onConflictDoUpdate({
      target: [clientSchedule.clientId, clientSchedule.weekOf],
      set: {
        schedule,
        deletedAt: null,
      },
    })
    .returning();

  return record;
};
