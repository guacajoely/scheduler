import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  dayLabelByValue,
  formatDisplayTimeFromTwentyFour,
} from "@/lib/schedule";
import type {
  ClientAssignedScheduleEntry,
  PersonSummary,
} from "@/types/people";
import type { DayOfWeek } from "@/types/people";

type AssignmentRow = {
  key: string;
  dayOfWeek: ClientAssignedScheduleEntry["dayOfWeek"];
  startTime: string;
  endTime: string;
  employeeId: string;
};

type AssignerGridProps = {
  rows: AssignmentRow[];
  availableByDay: Record<DayOfWeek, PersonSummary[]>;
  unassignedValue: string;
  onAssignEmployee: (rowKey: string, employeeId: string) => void;
};

export const AssignerGrid = ({
  rows,
  availableByDay,
  unassignedValue,
  onAssignEmployee,
}: AssignerGridProps) => {
  return (
    <>
      <div className="grid grid-cols-[9rem_7rem_7rem_minmax(16rem,1fr)] gap-2 text-sm font-medium text-muted-foreground">
        <p>Day</p>
        <p>Start Time</p>
        <p>End Time</p>
        <p>Employee</p>
      </div>

      {rows.map((row) => {
        const employeesForDay = availableByDay[row.dayOfWeek] ?? [];
        const selectedEmployee = employeesForDay.find(
          (person) => person.id === row.employeeId,
        );

        return (
          <div
            key={row.key}
            className="grid grid-cols-[9rem_7rem_7rem_minmax(16rem,1fr)] items-center gap-2"
          >
            <p>{dayLabelByValue[row.dayOfWeek]}</p>
            <p>{formatDisplayTimeFromTwentyFour(row.startTime)}</p>
            <p>{formatDisplayTimeFromTwentyFour(row.endTime)}</p>
            <div className="grid gap-1">
              <Label htmlFor={`assigned-${row.key}`} className="sr-only">
                Employee
              </Label>
              <Select
                value={row.employeeId || undefined}
                onValueChange={(value) =>
                  onAssignEmployee(
                    row.key,
                    value === unassignedValue ? "" : (value ?? ""),
                  )
                }
              >
                <SelectTrigger
                  id={`assigned-${row.key}`}
                  className="h-9 w-full"
                >
                  <SelectValue placeholder="Select employee">
                    {selectedEmployee
                      ? `${selectedEmployee.firstName} ${selectedEmployee.lastName}`
                      : "Select employee"}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={unassignedValue}>Unassigned</SelectItem>
                  {employeesForDay.map((person) => (
                    <SelectItem key={person.id} value={person.id}>
                      {person.firstName} {person.lastName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        );
      })}
    </>
  );
};

export type { AssignmentRow };
