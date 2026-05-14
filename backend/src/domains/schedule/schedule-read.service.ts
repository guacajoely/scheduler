import { and, eq, inArray, isNull } from "drizzle-orm";

import { db } from "../../db/index.js";
import { dayOfWeekValues, employee, type DayOfWeek } from "../../db/schema.js";
import { client } from "../../db/schema.js";
import { employeeSchedule } from "../../db/schema.js";
import {
  getClientAssignedScheduleForWeek,
  type ScheduleDbConn,
} from "./client-assigned-schedule.service.js";

type PersonSummary = {
  id: string;
  firstName: string;
  lastName: string;
};

type EmployeesByDay = Record<DayOfWeek, PersonSummary[]>;

const buildEmptyEmployeesByDay = (): EmployeesByDay => ({
  monday: [],
  tuesday: [],
  wednesday: [],
  thursday: [],
  friday: [],
  saturday: [],
  sunday: [],
});

export const getEmployeesAvailableForEachDay = async (
  dbConn: ScheduleDbConn = db,
): Promise<EmployeesByDay> => {
  const employees = await dbConn.query.employee.findMany({
    where: isNull(employee.deletedAt),
    columns: {
      id: true,
      firstName: true,
      lastName: true,
      requestedSchedule: true,
    },
    orderBy: (table, { asc }) => [asc(table.lastName), asc(table.firstName)],
  });

  const byDay = buildEmptyEmployeesByDay();
  for (const day of dayOfWeekValues) {
    byDay[day] = employees
      .filter((person) => person.requestedSchedule.includes(day))
      .map((person) => ({
        id: person.id,
        firstName: person.firstName,
        lastName: person.lastName,
      }));
  }

  return byDay;
};

export const getClientAssignedScheduleWithEmployees = async (
  clientId: string,
  weekOf: string,
  dbConn: ScheduleDbConn = db,
) => {
  const record = await getClientAssignedScheduleForWeek(
    dbConn,
    clientId,
    weekOf,
  );
  if (!record) {
    return [];
  }

  const employeeIds = Array.from(
    new Set(record.schedule.map((entry) => entry.employeeId)),
  );
  const employees = employeeIds.length
    ? await dbConn.query.employee.findMany({
        where: and(
          inArray(employee.id, employeeIds),
          isNull(employee.deletedAt),
        ),
        columns: { id: true, firstName: true, lastName: true },
      })
    : [];

  const namesByEmployeeId = new Map(
    employees.map((person) => [
      person.id,
      `${person.firstName} ${person.lastName}`,
    ]),
  );

  return record.schedule.map((entry) => ({
    dayOfWeek: entry.dayOfWeek,
    startTime: entry.startTime,
    endTime: entry.endTime,
    employeeId: entry.employeeId,
    employeeName: namesByEmployeeId.get(entry.employeeId) ?? "Unknown employee",
  }));
};

export const getEmployeeAssignedScheduleWithClients = async (
  employeeId: string,
  weekOf: string,
  dbConn: ScheduleDbConn = db,
) => {
  const record = await dbConn.query.employeeSchedule.findFirst({
    where: and(
      eq(employeeSchedule.employeeId, employeeId),
      eq(employeeSchedule.weekOf, weekOf),
      isNull(employeeSchedule.deletedAt),
    ),
  });

  if (!record) {
    return [];
  }

  const clientIds = Array.from(
    new Set(record.schedule.map((entry) => entry.clientId)),
  );
  const clients = clientIds.length
    ? await dbConn.query.client.findMany({
        where: and(inArray(client.id, clientIds), isNull(client.deletedAt)),
        columns: { id: true, firstName: true, lastName: true },
      })
    : [];

  const namesByClientId = new Map(
    clients.map((person) => [
      person.id,
      `${person.firstName} ${person.lastName}`,
    ]),
  );

  return record.schedule.map((entry) => ({
    dayOfWeek: entry.dayOfWeek,
    startTime: entry.startTime,
    endTime: entry.endTime,
    clientId: entry.clientId,
    clientName: namesByClientId.get(entry.clientId) ?? "Unknown client",
  }));
};
