import { addWeeks, format, startOfWeek } from "date-fns";

import { dayOfWeekOptions } from "@/types/people";
import type { DayOfWeek } from "@/types/people";

export const dayOrderIndex: Record<DayOfWeek, number> = {
  monday: 0,
  tuesday: 1,
  wednesday: 2,
  thursday: 3,
  friday: 4,
  saturday: 5,
  sunday: 6,
};

export const dayLabelByValue: Record<DayOfWeek, string> = {
  monday: "Monday",
  tuesday: "Tuesday",
  wednesday: "Wednesday",
  thursday: "Thursday",
  friday: "Friday",
  saturday: "Saturday",
  sunday: "Sunday",
};

export const isDayOfWeek = (value: unknown): value is DayOfWeek =>
  dayOfWeekOptions.some((option) => option.value === value);

export const sortDayValues = (days: DayOfWeek[]) =>
  [...days].sort((a, b) => dayOrderIndex[a] - dayOrderIndex[b]);

export const sortScheduleEntriesByDay = <T extends { dayOfWeek: DayOfWeek }>(
  entries: T[],
) =>
  [...entries].sort(
    (a, b) => dayOrderIndex[a.dayOfWeek] - dayOrderIndex[b.dayOfWeek],
  );

export const parseTimeOptionFromStoredTime = (time: unknown): string => {
  if (typeof time !== "string") {
    return "";
  }

  const match = /^([01]\d|2[0-3]):[0-5]\d$/.exec(time);
  if (!match) {
    return "";
  }

  const hour24 = Number(match[1]);
  const period = hour24 >= 12 ? "PM" : "AM";
  const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12;
  return `${hour12}:00${period}`;
};

export const formatDisplayTimeFromTwentyFour = (time: string): string => {
  const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(time);
  if (!match) {
    return time;
  }

  const hour24 = Number(match[1]);
  const minutes = match[2];
  const period = hour24 >= 12 ? "PM" : "AM";
  const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12;
  return `${hour12}:${minutes}${period}`;
};

export const toTwentyFourHourFromTimeOption = (timeOption: string): string => {
  const match = /^([1-9]|1[0-2]):00(AM|PM)$/.exec(timeOption);
  if (!match) {
    throw new Error("Select a valid start and end time");
  }

  const hour12 = Number(match[1]);
  const period = match[2];
  const normalized = hour12 % 12;
  const hour24 = period === "PM" ? normalized + 12 : normalized;
  return `${String(hour24).padStart(2, "0")}:00`;
};

export const getScheduleWeekBounds = (currentDate = new Date()) => {
  const currentMonday = startOfWeek(currentDate, { weekStartsOn: 1 });
  const nextMonday = addWeeks(currentMonday, 1);

  return {
    currentWeekOf: format(currentMonday, "yyyy-MM-dd"),
    nextWeekOf: format(nextMonday, "yyyy-MM-dd"),
  };
};
