import {
  dayLabelByValue,
  isDayOfWeek,
  parseTimeOptionFromStoredTime,
  toTwentyFourHourFromTimeOption,
} from "@/lib/schedule";
import type {
  ClientRequestedSchedule,
  ClientRequestedScheduleRow,
  DayOfWeek,
} from "@/types/people";

const createRowId = () => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random()}`;
};

export const createEmptyScheduleRow = (): ClientRequestedScheduleRow => ({
  id: createRowId(),
  dayOfWeek: "",
  startTime: "",
  endTime: "",
});

export const parseEmployeeRequestedSchedule = (value: unknown): DayOfWeek[] => {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.filter(isDayOfWeek);
};

export const parseClientRequestedScheduleRows = (
  value: unknown,
): ClientRequestedScheduleRow[] => {
  if (!Array.isArray(value)) {
    return [createEmptyScheduleRow()];
  }

  const rows: ClientRequestedScheduleRow[] = [];
  for (const entry of value) {
    if (typeof entry !== "object" || entry === null) {
      continue;
    }
    const candidate = entry as {
      dayOfWeek?: unknown;
      startTime?: unknown;
      endTime?: unknown;
    };
    if (!isDayOfWeek(candidate.dayOfWeek)) {
      continue;
    }

    rows.push({
      id: createRowId(),
      dayOfWeek: candidate.dayOfWeek,
      startTime: parseTimeOptionFromStoredTime(candidate.startTime),
      endTime: parseTimeOptionFromStoredTime(candidate.endTime),
    });
  }

  return rows.length > 0 ? rows : [createEmptyScheduleRow()];
};

export const buildClientRequestedSchedule = (
  rows: ClientRequestedScheduleRow[],
): ClientRequestedSchedule => {
  const result: ClientRequestedSchedule = [];
  const seenDays = new Set<DayOfWeek>();

  for (const row of rows) {
    const hasAnyTime =
      row.startTime.trim().length > 0 || row.endTime.trim().length > 0;

    if (!row.dayOfWeek && !hasAnyTime) {
      continue;
    }
    if (!row.dayOfWeek && hasAnyTime) {
      throw new Error("Select a day for each requested schedule row");
    }

    const selectedDay = row.dayOfWeek as DayOfWeek;
    if (!row.startTime.trim() || !row.endTime.trim()) {
      throw new Error(
        `${dayLabelByValue[selectedDay] ?? "Selected day"} requires both start and end time`,
      );
    }
    if (seenDays.has(selectedDay)) {
      throw new Error("Each day can only be added once");
    }
    seenDays.add(selectedDay);

    const startTime = toTwentyFourHourFromTimeOption(row.startTime);
    const endTime = toTwentyFourHourFromTimeOption(row.endTime);
    if (endTime <= startTime) {
      throw new Error(
        `${dayLabelByValue[selectedDay] ?? "Selected day"} end time must be after start time`,
      );
    }

    result.push({ dayOfWeek: selectedDay, startTime, endTime });
  }

  return result;
};
