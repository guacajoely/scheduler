import { createId } from "@paralleldrive/cuid2";
import {
  boolean,
  date,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  unique,
} from "drizzle-orm/pg-core";

export const dayOfWeekEnum = pgEnum("day_of_week", [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
]);

export const dayOfWeekValues = dayOfWeekEnum.enumValues;
export type DayOfWeek = (typeof dayOfWeekValues)[number];

export type ClientRequestedSchedule = Array<{
  dayOfWeek: DayOfWeek;
  startTime: string;
  endTime: string;
}>;

export type EmployeeRequestedSchedule = DayOfWeek[];

export type ClientAssignedSchedule = Array<{
  dayOfWeek: DayOfWeek;
  startTime: string;
  endTime: string;
  employeeId: string;
}>;

export type EmployeeAssignedSchedule = Array<{
  dayOfWeek: DayOfWeek;
  startTime: string;
  endTime: string;
  clientId: string;
}>;

const basicEntityColumns = () => ({
  id: text("id")
    .$defaultFn(() => createId())
    .primaryKey(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
});

const personColumns = () => ({
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: text("email").notNull(),
  phoneNumber: text("phone_number").notNull(),
  addressLine1: text("address_line_1").notNull(),
  addressLine2: text("address_line_2"),
  city: text("city").notNull(),
  state: text("state").notNull(),
  postalCode: text("postal_code").notNull(),
});

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name"),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull().default(false),
  image: text("image"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
});

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
});

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at", {
    withTimezone: true,
  }),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at", {
    withTimezone: true,
  }),
  scope: text("scope"),
  idToken: text("id_token"),
  password: text("password"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
});

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
});

export const client = pgTable(
  "client",
  {
    ...basicEntityColumns(),
    ...personColumns(),
    requestedSchedule: jsonb("requested_schedule")
      .$type<ClientRequestedSchedule>()
      .notNull()
      .default([]),
  },
  (table) => [unique("client_email_unique").on(table.email)],
);

export const employee = pgTable(
  "employee",
  {
    ...basicEntityColumns(),
    ...personColumns(),
    requestedSchedule: dayOfWeekEnum("requested_schedule")
      .array()
      .notNull()
      .default([]),
  },
  (table) => [unique("employee_email_unique").on(table.email)],
);

export const clientSchedule = pgTable(
  "client_schedule",
  {
    ...basicEntityColumns(),
    clientId: text("client_id")
      .notNull()
      .references(() => client.id, { onDelete: "cascade" }),
    weekOf: date("week_of").notNull(),
    schedule: jsonb("schedule")
      .$type<ClientAssignedSchedule>()
      .notNull()
      .default([]),
  },
  (table) => [
    unique("client_schedule_client_id_week_of_unique").on(
      table.clientId,
      table.weekOf,
    ),
  ],
);

export const employeeSchedule = pgTable(
  "employee_schedule",
  {
    ...basicEntityColumns(),
    employeeId: text("employee_id")
      .notNull()
      .references(() => employee.id, { onDelete: "cascade" }),
    weekOf: date("week_of").notNull(),
    schedule: jsonb("schedule")
      .$type<EmployeeAssignedSchedule>()
      .notNull()
      .default([]),
  },
  (table) => [
    unique("employee_schedule_employee_id_week_of_unique").on(
      table.employeeId,
      table.weekOf,
    ),
  ],
);
