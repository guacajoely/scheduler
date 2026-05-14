import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { dayOfWeekOptions } from "@/types/people";
import type { ClientRequestedScheduleRow, DayOfWeek } from "@/types/people";

const dayOrderIndex: Record<DayOfWeek, number> = {
  monday: 0,
  tuesday: 1,
  wednesday: 2,
  thursday: 3,
  friday: 4,
  saturday: 5,
  sunday: 6,
};

const timeOptions = [
  ...Array.from({ length: 23 }, (_, index) => index + 1),
  0,
].map((hour24) => {
  const period = hour24 >= 12 ? "PM" : "AM";
  const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12;
  return `${hour12}:00${period}`;
});

const sortRows = (rows: ClientRequestedScheduleRow[]) => {
  return [...rows].sort((a, b) => {
    if (!a.dayOfWeek && !b.dayOfWeek) {
      return 0;
    }
    if (!a.dayOfWeek) {
      return 1;
    }
    if (!b.dayOfWeek) {
      return -1;
    }
    return dayOrderIndex[a.dayOfWeek] - dayOrderIndex[b.dayOfWeek];
  });
};

type ClientRequestedScheduleEditorProps = {
  rows: ClientRequestedScheduleRow[];
  onRowsChange: (rows: ClientRequestedScheduleRow[]) => void;
  onAddRow: () => void;
};

export const ClientRequestedScheduleEditor = ({
  rows,
  onRowsChange,
  onAddRow,
}: ClientRequestedScheduleEditorProps) => {
  const updateRow = <K extends keyof ClientRequestedScheduleRow>(
    rowId: string,
    field: K,
    value: ClientRequestedScheduleRow[K],
  ) => {
    const nextRows = rows.map((row) =>
      row.id === rowId ? { ...row, [field]: value } : row,
    );
    const sortedRows = field === "dayOfWeek" ? sortRows(nextRows) : nextRows;
    onRowsChange(sortedRows);
  };

  const removeRow = (rowId: string) => {
    if (rows.length <= 1) {
      const resetRow: ClientRequestedScheduleRow[] = rows.map((row) =>
        row.id === rowId
          ? {
              ...row,
              dayOfWeek: "",
              startTime: "",
              endTime: "",
            }
          : row,
      );
      onRowsChange(resetRow);
      return;
    }

    onRowsChange(rows.filter((row) => row.id !== rowId));
  };

  return (
    <div className="grid gap-2 rounded-md border p-3">
      <Label>Requested schedule</Label>

      <div className="grid grid-cols-[1.4fr_1fr_1fr_5rem] items-center gap-2 text-sm font-medium text-muted-foreground">
        <div className="px-2">
          <p className="text-left">Day of Week</p>
        </div>
        <div className="px-2">
          <p className="text-left">Start Time</p>
        </div>
        <div className="px-2">
          <p className="text-left">End Time</p>
        </div>
        <span />
      </div>

      {rows.map((row) => {
        const usedDays = rows
          .filter((candidate) => candidate.id !== row.id && candidate.dayOfWeek)
          .map((candidate) => candidate.dayOfWeek);

        return (
          <div
            key={row.id}
            className="grid grid-cols-[1.4fr_1fr_1fr_5rem] items-center gap-2"
          >
            <select
              className="h-9 rounded-md border bg-background px-2 text-left text-sm [text-align-last:left]"
              value={row.dayOfWeek}
              onChange={(event) =>
                updateRow(
                  row.id,
                  "dayOfWeek",
                  event.target.value as ClientRequestedScheduleRow["dayOfWeek"],
                )
              }
            >
              <option value="">Select day</option>
              {dayOfWeekOptions
                .filter(
                  (day) =>
                    day.value === row.dayOfWeek ||
                    !usedDays.includes(day.value),
                )
                .map((day) => (
                  <option key={day.value} value={day.value}>
                    {day.label}
                  </option>
                ))}
            </select>

            <select
              className="h-9 rounded-md border bg-background px-2 text-left text-sm [text-align-last:left]"
              value={row.startTime}
              onChange={(event) =>
                updateRow(row.id, "startTime", event.target.value)
              }
            >
              <option value="">Select time</option>
              {timeOptions.map((time) => (
                <option key={time} value={time}>
                  {time}
                </option>
              ))}
            </select>

            <select
              className="h-9 rounded-md border bg-background px-2 text-left text-sm [text-align-last:left]"
              value={row.endTime}
              onChange={(event) =>
                updateRow(row.id, "endTime", event.target.value)
              }
            >
              <option value="">Select time</option>
              {timeOptions.map((time) => (
                <option key={time} value={time}>
                  {time}
                </option>
              ))}
            </select>

            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => removeRow(row.id)}
            >
              Remove
            </Button>
          </div>
        );
      })}

      <div>
        <Button type="button" variant="outline" size="sm" onClick={onAddRow}>
          + Add Day
        </Button>
      </div>
    </div>
  );
};
