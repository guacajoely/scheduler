import { and, eq, inArray, isNull } from "drizzle-orm";

import { db } from "../../db/index.js";
import { client, employee } from "../../db/schema.js";
import {
  getClientAssignedScheduleForWeek,
  upsertClientAssignedSchedule,
} from "./client-assigned-schedule.service.js";
import { syncEmployeeAssignedSchedulesForWeek } from "./employee-assigned-schedule.service.js";
import type { ReplaceClientAssignedScheduleInput } from "./schedule.schema.js";

type ReplaceClientAssignedScheduleResult =
  | { ok: true }
  | { ok: false; code: "CLIENT_NOT_FOUND" }
  | { ok: false; code: "EMPLOYEES_NOT_FOUND"; employeeIds: string[] };

const unique = (values: string[]) => Array.from(new Set(values));

export const replaceClientAssignedSchedule = async (
  clientId: string,
  input: ReplaceClientAssignedScheduleInput,
): Promise<ReplaceClientAssignedScheduleResult> => {
  return db.transaction(async (tx) => {
    const clientRecord = await tx.query.client.findFirst({
      where: and(eq(client.id, clientId), isNull(client.deletedAt)),
    });
    if (!clientRecord) {
      return { ok: false, code: "CLIENT_NOT_FOUND" } as const;
    }

    const nextEmployeeIds = unique(
      input.schedule.map((entry) => entry.employeeId),
    );
    if (nextEmployeeIds.length > 0) {
      const found = await tx.query.employee.findMany({
        where: and(
          inArray(employee.id, nextEmployeeIds),
          isNull(employee.deletedAt),
        ),
        columns: { id: true },
      });
      const foundIds = new Set(found.map((row) => row.id));
      const missing = nextEmployeeIds.filter((id) => !foundIds.has(id));
      if (missing.length > 0) {
        return {
          ok: false,
          code: "EMPLOYEES_NOT_FOUND",
          employeeIds: missing,
        } as const;
      }
    }

    const previous = await getClientAssignedScheduleForWeek(
      tx,
      clientId,
      input.weekOf,
    );
    const previousEmployeeIds = unique(
      (previous?.schedule ?? []).map((entry) => entry.employeeId),
    );

    await upsertClientAssignedSchedule(
      tx,
      clientId,
      input.weekOf,
      input.schedule,
    );

    const impactedEmployeeIds = unique([
      ...previousEmployeeIds,
      ...nextEmployeeIds,
    ]);
    if (impactedEmployeeIds.length > 0) {
      await syncEmployeeAssignedSchedulesForWeek(
        tx,
        input.weekOf,
        impactedEmployeeIds,
      );
    }

    return { ok: true } as const;
  });
};
