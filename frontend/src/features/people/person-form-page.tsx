import { useEffect, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ClientRequestedScheduleEditor } from "@/features/people/client-requested-schedule-editor";
import { EmployeeRequestedSchedulePicker } from "@/features/people/employee-requested-schedule-picker";
import { API_BASE_URL } from "@/lib/api";
import { getErrorMessage } from "@/lib/errors";
import { buildPersonPayload } from "@/lib/people";
import type {
  ClientRequestedSchedule,
  ClientRequestedScheduleRow,
  DayOfWeek,
  EntityKind,
  PersonEntity,
  PersonFormValues,
} from "@/types/people";
import { dayOfWeekOptions, emptyPersonForm } from "@/types/people";

const getEntityLabel = (entityKind: EntityKind) =>
  entityKind === "clients" ? "Client" : "Employee";

const isDayOfWeek = (value: unknown): value is DayOfWeek =>
  dayOfWeekOptions.some((option) => option.value === value);

const createRowId = () => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random()}`;
};

const createEmptyScheduleRow = (): ClientRequestedScheduleRow => ({
  id: createRowId(),
  dayOfWeek: "",
  startTime: "",
  endTime: "",
});

const parseEmployeeRequestedSchedule = (value: unknown): DayOfWeek[] => {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.filter(isDayOfWeek);
};

const parseTimeOptionFromStoredTime = (time: unknown): string => {
  if (typeof time !== "string") {
    return "";
  }

  const match = /^([01]\d|2[0-3]):[0-5]\d$/.exec(time);
  if (!match) {
    return "";
  }

  const hour24 = Number(match[1]);
  const period = hour24 >= 12 ? "PM" : "AM";
  const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12;
  return `${hour12}:00${period}`;
};

const parseClientRequestedScheduleRows = (
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

    const startTime = parseTimeOptionFromStoredTime(candidate.startTime);
    const endTime = parseTimeOptionFromStoredTime(candidate.endTime);
    rows.push({
      id: createRowId(),
      dayOfWeek: candidate.dayOfWeek,
      startTime,
      endTime,
    });
  }

  return rows.length > 0 ? rows : [createEmptyScheduleRow()];
};

const toTwentyFourHour = (timeOption: string) => {
  const match = /^([1-9]|1[0-2]):00(AM|PM)$/.exec(timeOption);
  if (!match) {
    throw new Error("Select a valid start and end time");
  }

  const hour12 = Number(match[1]);
  const period = match[2];
  const normalized = hour12 % 12;
  const hour24 = period === "PM" ? normalized + 12 : normalized;
  return `${String(hour24).padStart(2, "0")}:00`;
};

const buildClientRequestedSchedule = (
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
      const label =
        dayOfWeekOptions.find((day) => day.value === selectedDay)?.label ??
        "Selected day";
      throw new Error(`${label} requires both start and end time`);
    }
    if (seenDays.has(selectedDay)) {
      throw new Error("Each day can only be added once");
    }
    seenDays.add(selectedDay);

    const startTime = toTwentyFourHour(row.startTime);
    const endTime = toTwentyFourHour(row.endTime);
    if (endTime <= startTime) {
      const label =
        dayOfWeekOptions.find((day) => day.value === selectedDay)?.label ??
        "Selected day";
      throw new Error(`${label} end time must be after start time`);
    }

    result.push({ dayOfWeek: selectedDay, startTime, endTime });
  }

  return result;
};

type PersonFormPageProps = {
  entityKind: EntityKind;
  mode?: "create" | "edit";
};

export const PersonFormPage = ({
  entityKind,
  mode = "create",
}: PersonFormPageProps) => {
  const entityLabel = getEntityLabel(entityKind);
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditMode = mode === "edit";
  const missingEditId = isEditMode && !id;
  const [formValues, setFormValues] =
    useState<PersonFormValues>(emptyPersonForm);
  const [employeeRequestedSchedule, setEmployeeRequestedSchedule] = useState<
    DayOfWeek[]
  >([]);
  const [clientRequestedScheduleRows, setClientRequestedScheduleRows] =
    useState<ClientRequestedScheduleRow[]>(() => [createEmptyScheduleRow()]);
  const [isLoadingInitialData, setIsLoadingInitialData] = useState(
    isEditMode && Boolean(id),
  );
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(
    missingEditId ? `${entityLabel} id is missing` : null,
  );

  useEffect(() => {
    if (!isEditMode || !id) {
      return;
    }

    const loadPerson = async () => {
      setError(null);
      try {
        const response = await fetch(
          `${API_BASE_URL}/api/${entityKind}/${id}`,
          {
            credentials: "include",
          },
        );
        if (!response.ok) {
          throw new Error(`Failed to load ${entityLabel}`);
        }

        const person = (await response.json()) as PersonEntity;
        setFormValues({
          firstName: person.firstName,
          lastName: person.lastName,
          email: person.email,
          phoneNumber: person.phoneNumber,
          addressLine1: person.addressLine1,
          addressLine2: person.addressLine2 ?? "",
          city: person.city,
          state: person.state,
          postalCode: person.postalCode,
        });

        if (entityKind === "employees") {
          setEmployeeRequestedSchedule(
            parseEmployeeRequestedSchedule(person.requestedSchedule),
          );
        } else {
          setClientRequestedScheduleRows(
            parseClientRequestedScheduleRows(person.requestedSchedule),
          );
        }
      } catch (loadError) {
        setError(getErrorMessage(loadError));
      } finally {
        setIsLoadingInitialData(false);
      }
    };

    void loadPerson();
  }, [entityKind, entityLabel, id, isEditMode]);

  const onInputChange =
    (field: keyof PersonFormValues) =>
    (event: ChangeEvent<HTMLInputElement>) => {
      setFormValues((current) => ({ ...current, [field]: event.target.value }));
    };

  const onEmployeeDayToggle = (day: DayOfWeek, checked: boolean) => {
    setEmployeeRequestedSchedule((current) => {
      if (checked) {
        return current.includes(day) ? current : [...current, day];
      }
      return current.filter((value) => value !== day);
    });
  };

  const submitForm = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    let requestedSchedulePayload: DayOfWeek[] | ClientRequestedSchedule;
    try {
      requestedSchedulePayload =
        entityKind === "employees"
          ? employeeRequestedSchedule
          : buildClientRequestedSchedule(clientRequestedScheduleRows);
    } catch (validationError) {
      setError(getErrorMessage(validationError));
      return;
    }

    setIsSaving(true);
    try {
      if (isEditMode && !id) {
        throw new Error(`${entityLabel} id is missing`);
      }

      const response = await fetch(
        isEditMode
          ? `${API_BASE_URL}/api/${entityKind}/${id}`
          : `${API_BASE_URL}/api/${entityKind}`,
        {
          method: isEditMode ? "PATCH" : "POST",
          headers: { "content-type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            ...buildPersonPayload(formValues),
            requestedSchedule: requestedSchedulePayload,
          }),
        },
      );

      if (!response.ok) {
        const payloadError = (await response.json().catch(() => null)) as {
          message?: string;
        } | null;
        throw new Error(
          payloadError?.message ??
            `Failed to ${isEditMode ? "update" : "create"} ${entityLabel}`,
        );
      }

      void navigate("/dashboard", { replace: true });
    } catch (submitError) {
      setError(getErrorMessage(submitError));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <main className="min-h-screen bg-background p-4 text-foreground">
      <div className="mx-auto grid w-full max-w-3xl gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>
              {isEditMode ? `Edit ${entityLabel}` : `Create ${entityLabel}`}
            </CardTitle>
            <Button
              type="button"
              variant="outline"
              onClick={() => void navigate("/dashboard")}
            >
              Back to dashboard
            </Button>
          </CardHeader>
          <CardContent>
            {isLoadingInitialData ? (
              <p className="mb-3 text-sm text-muted-foreground">
                Loading {entityLabel.toLowerCase()}...
              </p>
            ) : null}
            {error ? (
              <p className="mb-3 text-sm text-destructive">{error}</p>
            ) : null}
            <form
              className="grid gap-3"
              onSubmit={(event) => void submitForm(event)}
            >
              <div className="grid gap-2 md:grid-cols-2">
                <div className="grid gap-1.5">
                  <Label htmlFor={`${entityKind}-firstName`}>First name</Label>
                  <Input
                    id={`${entityKind}-firstName`}
                    value={formValues.firstName}
                    onChange={onInputChange("firstName")}
                    required
                  />
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor={`${entityKind}-lastName`}>Last name</Label>
                  <Input
                    id={`${entityKind}-lastName`}
                    value={formValues.lastName}
                    onChange={onInputChange("lastName")}
                    required
                  />
                </div>
              </div>

              <div className="grid gap-2 md:grid-cols-2">
                <div className="grid gap-1.5">
                  <Label htmlFor={`${entityKind}-email`}>Email</Label>
                  <Input
                    id={`${entityKind}-email`}
                    type="email"
                    value={formValues.email}
                    onChange={onInputChange("email")}
                    required
                  />
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor={`${entityKind}-phoneNumber`}>
                    Phone number
                  </Label>
                  <Input
                    id={`${entityKind}-phoneNumber`}
                    value={formValues.phoneNumber}
                    onChange={onInputChange("phoneNumber")}
                    required
                  />
                </div>
              </div>

              <div className="grid gap-1.5">
                <Label htmlFor={`${entityKind}-addressLine1`}>
                  Address line 1
                </Label>
                <Input
                  id={`${entityKind}-addressLine1`}
                  value={formValues.addressLine1}
                  onChange={onInputChange("addressLine1")}
                  required
                />
              </div>

              <div className="grid gap-1.5">
                <Label htmlFor={`${entityKind}-addressLine2`}>
                  Address line 2 (optional)
                </Label>
                <Input
                  id={`${entityKind}-addressLine2`}
                  value={formValues.addressLine2}
                  onChange={onInputChange("addressLine2")}
                />
              </div>

              <div className="grid gap-2 md:grid-cols-3">
                <div className="grid gap-1.5">
                  <Label htmlFor={`${entityKind}-city`}>City</Label>
                  <Input
                    id={`${entityKind}-city`}
                    value={formValues.city}
                    onChange={onInputChange("city")}
                    required
                  />
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor={`${entityKind}-state`}>State</Label>
                  <Input
                    id={`${entityKind}-state`}
                    value={formValues.state}
                    onChange={onInputChange("state")}
                    maxLength={2}
                    required
                  />
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor={`${entityKind}-postalCode`}>
                    Postal code
                  </Label>
                  <Input
                    id={`${entityKind}-postalCode`}
                    value={formValues.postalCode}
                    onChange={onInputChange("postalCode")}
                    required
                  />
                </div>
              </div>

              {entityKind === "employees" ? (
                <EmployeeRequestedSchedulePicker
                  selectedDays={employeeRequestedSchedule}
                  onToggleDay={onEmployeeDayToggle}
                />
              ) : (
                <ClientRequestedScheduleEditor
                  rows={clientRequestedScheduleRows}
                  onRowsChange={setClientRequestedScheduleRows}
                  onAddRow={() =>
                    setClientRequestedScheduleRows((current) => [
                      ...current,
                      createEmptyScheduleRow(),
                    ])
                  }
                />
              )}

              <Button type="submit" disabled={isSaving || isLoadingInitialData}>
                {isSaving
                  ? `${isEditMode ? "Saving" : "Creating"} ${entityLabel}...`
                  : `${isEditMode ? "Save" : "Create"} ${entityLabel}`}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </main>
  );
};
