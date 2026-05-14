import { addWeeks, format, startOfWeek } from "date-fns";
import { toZonedTime } from "date-fns-tz";

const PACIFIC_TIMEZONE = "America/Los_Angeles";

export const getUpcomingPacificMondayWeekOf = (now: Date = new Date()) => {
  const pacificNow = toZonedTime(now, PACIFIC_TIMEZONE);
  const currentPacificMonday = startOfWeek(pacificNow, { weekStartsOn: 1 });
  const upcomingPacificMonday = addWeeks(currentPacificMonday, 1);
  return format(upcomingPacificMonday, "yyyy-MM-dd");
};

export const isUpcomingPacificMondayWeekOf = (
  weekOf: string,
  now: Date = new Date(),
) => {
  return weekOf === getUpcomingPacificMondayWeekOf(now);
};

export const upcomingPacificMondayWeekOfValidationMessage =
  "weekOf must be the upcoming Monday in Pacific time for assignment updates";
