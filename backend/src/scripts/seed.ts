import "dotenv/config";
import { eq, inArray } from "drizzle-orm";

import { auth } from "../domains/auth/auth.config.js";
import { db, pool } from "../db/index.js";
import {
  client,
  dayOfWeekValues,
  employee,
  type ClientRequestedSchedule,
  type DayOfWeek,
  user,
} from "../db/schema.js";

const ADMIN_EMAIL = "test@email.com";
const ADMIN_PASSWORD = "password";
const ADMIN_NAME = "admin";
const BETTER_AUTH_URL = process.env.BETTER_AUTH_URL;
const PERSON_COUNT = 11;

if (!BETTER_AUTH_URL) {
  throw new Error("BETTER_AUTH_URL is not set");
}

const FIRST_NAMES = [
  "Alex",
  "Jordan",
  "Taylor",
  "Casey",
  "Morgan",
  "Riley",
  "Drew",
  "Avery",
  "Quinn",
  "Parker",
  "Cameron",
];

const LAST_NAMES = [
  "Smith",
  "Johnson",
  "Williams",
  "Brown",
  "Jones",
  "Miller",
  "Davis",
  "Garcia",
  "Wilson",
  "Anderson",
  "Thomas",
];

const randomInt = (min: number, max: number) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

const padTwo = (value: number) => String(value).padStart(2, "0");
const toTime = (hour24: number) => `${padTwo(hour24)}:00`;

const pickUniqueDays = (count: number): DayOfWeek[] => {
  const shuffled = [...dayOfWeekValues].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
};

const sortByWeekday = <T extends { dayOfWeek: DayOfWeek }>(values: T[]) =>
  [...values].sort(
    (a, b) =>
      dayOfWeekValues.indexOf(a.dayOfWeek) -
      dayOfWeekValues.indexOf(b.dayOfWeek),
  );

const createRandomClientRequestedSchedule = (): ClientRequestedSchedule => {
  const dayCount = randomInt(4, 5);
  const selectedDays = pickUniqueDays(dayCount);

  const entries = selectedDays.map((dayOfWeek) => {
    const durationHours = randomInt(6, 8);
    const latestStartHour = 22 - durationHours;
    const startHour = randomInt(3, latestStartHour);
    const endHour = startHour + durationHours;

    return {
      dayOfWeek,
      startTime: toTime(startHour),
      endTime: toTime(endHour),
    };
  });

  return sortByWeekday(entries);
};

const createRandomEmployeeRequestedSchedule = (): DayOfWeek[] => {
  const dayCount = randomInt(4, 5);
  return sortByWeekday(
    pickUniqueDays(dayCount).map((dayOfWeek) => ({ dayOfWeek })),
  ).map((entry) => entry.dayOfWeek);
};

const buildAddressLine1 = (index: number) => `${120 + index} Main St`;
const buildCity = (index: number) => `Springfield ${index + 1}`;
const buildPostalCode = (index: number) => `${10000 + index}`;
const buildPhone = () => `202-555-01${padTwo(randomInt(0, 99))}`;

const run = async () => {
  const existingUser = await db.query.user.findFirst({
    where: eq(user.email, ADMIN_EMAIL),
  });

  if (existingUser) {
    console.log(`Seed admin skipped: ${ADMIN_EMAIL} already exists.`);
  } else {
    await auth.api.signUpEmail({
      body: {
        name: ADMIN_NAME,
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD,
      },
      headers: new Headers({
        origin: BETTER_AUTH_URL,
      }),
    });

    console.log(`Seed admin complete: created ${ADMIN_EMAIL} (${ADMIN_NAME}).`);
  }

  const employeesToSeed = Array.from({ length: PERSON_COUNT }, (_, index) => ({
    firstName: FIRST_NAMES[index],
    lastName: LAST_NAMES[index],
    email: `employee${index + 1}@email.com`,
    phoneNumber: buildPhone(),
    addressLine1: buildAddressLine1(index + 1),
    addressLine2: null as string | null,
    city: buildCity(index + 1),
    state: "TX",
    postalCode: buildPostalCode(index + 1),
    requestedSchedule: createRandomEmployeeRequestedSchedule(),
  }));

  const clientsToSeed = Array.from({ length: PERSON_COUNT }, (_, index) => ({
    firstName: FIRST_NAMES[(index + 3) % FIRST_NAMES.length],
    lastName: LAST_NAMES[(index + 5) % LAST_NAMES.length],
    email: `client${index + 1}@email.com`,
    phoneNumber: buildPhone(),
    addressLine1: buildAddressLine1(index + 21),
    addressLine2: null as string | null,
    city: buildCity(index + 21),
    state: "TX",
    postalCode: buildPostalCode(index + 21),
    requestedSchedule: createRandomClientRequestedSchedule(),
  }));

  const existingEmployees = await db.query.employee.findMany({
    where: inArray(
      employee.email,
      employeesToSeed.map((person) => person.email),
    ),
    columns: { email: true },
  });
  const existingEmployeeEmails = new Set(
    existingEmployees.map((row) => row.email),
  );

  const missingEmployees = employeesToSeed.filter(
    (person) => !existingEmployeeEmails.has(person.email),
  );

  if (missingEmployees.length > 0) {
    await db.insert(employee).values(missingEmployees);
  }

  const existingClients = await db.query.client.findMany({
    where: inArray(
      client.email,
      clientsToSeed.map((person) => person.email),
    ),
    columns: { email: true },
  });
  const existingClientEmails = new Set(existingClients.map((row) => row.email));

  const missingClients = clientsToSeed.filter(
    (person) => !existingClientEmails.has(person.email),
  );

  if (missingClients.length > 0) {
    await db.insert(client).values(missingClients);
  }

  console.log(
    `Seed data complete: ${missingEmployees.length} employees added, ${missingClients.length} clients added.`,
  );
};

run()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
