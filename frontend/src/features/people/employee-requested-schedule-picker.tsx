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
        {dayOfWeekOptions.map((day) => (
          <label key={day.value} className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={selectedDays.includes(day.value)}
              onChange={(event) => onToggleDay(day.value, event.target.checked)}
            />
            {day.label}
          </label>
        ))}
      </div>
    </div>
  );
};
