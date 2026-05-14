import {
  dayLabelByValue,
  formatDisplayTimeFromTwentyFour,
} from "@/lib/schedule";
import type { ClientRequestedSchedule } from "@/types/people";

type RequestedClientScheduleSectionProps = {
  entries: ClientRequestedSchedule;
  emptyMessage: string;
};

export const RequestedClientScheduleSection = ({
  entries,
  emptyMessage,
}: RequestedClientScheduleSectionProps) => {
  if (entries.length === 0) {
    return <p className="text-sm text-muted-foreground">{emptyMessage}</p>;
  }

  return (
    <div className="grid gap-1 text-sm">
      <div className="grid grid-cols-[1.2fr_1fr_1fr] gap-2 border-b pb-1 font-medium text-muted-foreground">
        <p>Day</p>
        <p>Start Time</p>
        <p>End Time</p>
      </div>
      {entries.map((entry) => (
        <div
          key={`${entry.dayOfWeek}-${entry.startTime}-${entry.endTime}`}
          className="grid grid-cols-[1.2fr_1fr_1fr] gap-2"
        >
          <p>{dayLabelByValue[entry.dayOfWeek]}</p>
          <p>{formatDisplayTimeFromTwentyFour(entry.startTime)}</p>
          <p>{formatDisplayTimeFromTwentyFour(entry.endTime)}</p>
        </div>
      ))}
    </div>
  );
};
