import { isDayOfWeek, sortScheduleEntriesByDay } from "@/lib/schedule";
import type { ClientRequestedSchedule, DayOfWeek } from "@/types/people";

export const parseEmployeeRequestedSchedule = (value: unknown): DayOfWeek[] => {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.filter(isDayOfWeek);
};

export const parseClientRequestedSchedule = (
  value: unknown,
): ClientRequestedSchedule => {
  if (!Array.isArray(value)) {
    return [];
  }

  const parsed = value
    .map((entry) => {
      if (typeof entry !== "object" || entry === null) {
        return null;
      }

      const candidate = entry as {
        dayOfWeek?: unknown;
        startTime?: unknown;
        endTime?: unknown;
      };

      if (
        !isDayOfWeek(candidate.dayOfWeek) ||
        typeof candidate.startTime !== "string" ||
        typeof candidate.endTime !== "string"
      ) {
        return null;
      }

      return {
        dayOfWeek: candidate.dayOfWeek,
        startTime: candidate.startTime,
        endTime: candidate.endTime,
      };
    })
    .filter(
      (entry): entry is ClientRequestedSchedule[number] => entry !== null,
    );

  return sortScheduleEntriesByDay(parsed);
};
