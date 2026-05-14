import {
  dayLabelByValue,
  formatDisplayTimeFromTwentyFour,
} from "@/lib/schedule";
import type { DayOfWeek } from "@/types/people";

type AssignedScheduleRow = {
  key: string;
  dayOfWeek: DayOfWeek;
  startTime: string;
  endTime: string;
  assigneeId: string;
  assigneeName: string;
};

type AssignedScheduleSectionProps = {
  heading: string;
  assigneeLabel: string;
  emptyMessage: string;
  rows: AssignedScheduleRow[];
  onAssigneeClick: (assigneeId: string) => void;
};

export const AssignedScheduleSection = ({
  heading,
  assigneeLabel,
  emptyMessage,
  rows,
  onAssigneeClick,
}: AssignedScheduleSectionProps) => {
  if (rows.length === 0) {
    return <p className="text-sm text-muted-foreground">{emptyMessage}</p>;
  }

  return (
    <div className="grid gap-1 text-sm">
      <p className="font-medium text-muted-foreground">{heading}</p>
      <div className="grid grid-cols-[1.2fr_1fr_1fr_1.4fr] gap-2 border-b pb-1 font-medium text-muted-foreground">
        <p>Day</p>
        <p>Start Time</p>
        <p>End Time</p>
        <p>{assigneeLabel}</p>
      </div>
      {rows.map((row) => (
        <div
          key={row.key}
          className="grid grid-cols-[1.2fr_1fr_1fr_1.4fr] gap-2"
        >
          <p>{dayLabelByValue[row.dayOfWeek]}</p>
          <p>{formatDisplayTimeFromTwentyFour(row.startTime)}</p>
          <p>{formatDisplayTimeFromTwentyFour(row.endTime)}</p>
          <button
            type="button"
            className="cursor-pointer text-left text-primary underline-offset-4 hover:underline"
            onClick={() => onAssigneeClick(row.assigneeId)}
          >
            {row.assigneeName}
          </button>
        </div>
      ))}
    </div>
  );
};

export type { AssignedScheduleRow };
