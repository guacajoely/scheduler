import { useMemo } from "react";

import { getScheduleWeekBounds } from "@/lib/schedule";

export const useScheduleWeekContext = () =>
  useMemo(() => getScheduleWeekBounds(), []);
