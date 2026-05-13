import { and, eq, isNull } from "drizzle-orm";

import { db } from "../../db/index.js";
import { client } from "../../db/schema.js";
import type { CreateClientInput, UpdateClientInput } from "./client.schema.js";

export const listClients = async () => {
  return db.query.client.findMany({
    where: isNull(client.deletedAt),
    orderBy: (table, { asc }) => [asc(table.lastName), asc(table.firstName)],
  });
};

export const getClientById = async (id: string) => {
  const record = await db.query.client.findFirst({
    where: and(eq(client.id, id), isNull(client.deletedAt)),
  });
  return record ?? null;
};

export const createClient = async (input: CreateClientInput) => {
  const [created] = await db
    .insert(client)
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

export const updateClient = async (id: string, input: UpdateClientInput) => {
  const [updated] = await db
    .update(client)
    .set(input)
    .where(and(eq(client.id, id), isNull(client.deletedAt)))
    .returning();
  return updated ?? null;
};

export const softDeleteClient = async (id: string) => {
  const [deleted] = await db
    .update(client)
    .set({
      deletedAt: new Date(),
    })
    .where(and(eq(client.id, id), isNull(client.deletedAt)))
    .returning({ id: client.id });
  return deleted ?? null;
};
