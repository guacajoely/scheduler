import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { dayOfWeekOptions } from "@/types/people";
import type { DayOfWeek } from "@/types/people";

type EmployeeRequestedSchedulePickerProps = {
  selectedDays: DayOfWeek[];
  onToggleDay: (day: DayOfWeek, checked: boolean) => void;
};

export const EmployeeRequestedSchedulePicker = ({
  selectedDays,
  onToggleDay,
}: EmployeeRequestedSchedulePickerProps) => {
  return (
    <div className="grid gap-2 rounded-md border p-3">
      <Label>Requested schedule (days)</Label>
      <div className="grid gap-2">
        {dayOfWeekOptions.map((day) => {
          const checkboxId = `employee-requested-${day.value}`;
          return (
            <div key={day.value} className="flex items-center gap-2 text-sm">
              <Checkbox
                id={checkboxId}
                checked={selectedDays.includes(day.value)}
                onCheckedChange={(checked) =>
                  onToggleDay(day.value, checked === true)
                }
              />
              <Label htmlFor={checkboxId}>{day.label}</Label>
            </div>
          );
        })}
      </div>
    </div>
  );
};
