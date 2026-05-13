import { and, eq, isNull, sql } from "drizzle-orm";

import { db } from "../../db/index.js";
import { employee } from "../../db/schema.js";
import type { PaginationQuery } from "../shared/pagination.schema.js";
import type {
  CreateEmployeeInput,
  UpdateEmployeeInput,
} from "./employee.schema.js";

export const listEmployees = async ({ page, pageSize }: PaginationQuery) => {
  const offset = (page - 1) * pageSize;
  const whereClause = isNull(employee.deletedAt);

  const items = await db.query.employee.findMany({
    where: whereClause,
    orderBy: (table, { asc }) => [asc(table.lastName), asc(table.firstName)],
    limit: pageSize,
    offset,
  });

  const [countRow] = await db
    .select({ count: sql<number>`count(*)` })
    .from(employee)
    .where(whereClause);

  const total = Number(countRow?.count ?? 0);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return {
    items,
    page,
    pageSize,
    total,
    totalPages,
  };
};

export const getEmployeeById = async (id: string) => {
  const record = await db.query.employee.findFirst({
    where: and(eq(employee.id, id), isNull(employee.deletedAt)),
  });
  return record ?? null;
};

export const createEmployee = async (input: CreateEmployeeInput) => {
  const [created] = await db
    .insert(employee)
    .values({
      firstName: input.firstName,
      lastName: input.lastName,
      email: input.email,
      phoneNumber: input.phoneNumber,
      addressLine1: input.addressLine1,
      addressLine2: input.addressLine2,
      city: input.city,
      state: input.state,
      postalCode: input.postalCode,
      requestedSchedule: input.requestedSchedule,
    })
    .returning();
  return created;
};

export const updateEmployee = async (
  id: string,
  input: UpdateEmployeeInput,
) => {
  const [updated] = await db
    .update(employee)
    .set(input)
    .where(and(eq(employee.id, id), isNull(employee.deletedAt)))
    .returning();
  return updated ?? null;
};

export const softDeleteEmployee = async (id: string) => {
  const [deleted] = await db
    .update(employee)
    .set({
      deletedAt: new Date(),
    })
    .where(and(eq(employee.id, id), isNull(employee.deletedAt)))
    .returning({ id: employee.id });
  return deleted ?? null;
};
