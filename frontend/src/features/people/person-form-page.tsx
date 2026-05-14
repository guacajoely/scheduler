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
import {
  buildClientRequestedSchedule,
  createEmptyScheduleRow,
  parseClientRequestedScheduleRows,
  parseEmployeeRequestedSchedule,
} from "@/features/people/person-form-schedule";
import type {
  ClientRequestedSchedule,
  ClientRequestedScheduleRow,
  DayOfWeek,
  EntityKind,
  PersonEntity,
  PersonFormValues,
} from "@/types/people";
import { emptyPersonForm } from "@/types/people";

const getEntityLabel = (entityKind: EntityKind) =>
  entityKind === "clients" ? "Client" : "Employee";

type PersonFormPageProps = {
  entityKind: EntityKind;
  mode?: "create" | "edit";
};

type PersonTextFieldProps = {
  entityKind: EntityKind;
  field: keyof PersonFormValues;
  label: string;
  value: string;
  onChange: (
    field: keyof PersonFormValues,
  ) => (event: ChangeEvent<HTMLInputElement>) => void;
  required?: boolean;
  type?: "text" | "email";
  maxLength?: number;
};

const PersonTextField = ({
  entityKind,
  field,
  label,
  value,
  onChange,
  required = true,
  type = "text",
  maxLength,
}: PersonTextFieldProps) => {
  return (
    <div className="grid gap-1.5">
      <Label htmlFor={`${entityKind}-${field}`}>{label}</Label>
      <Input
        id={`${entityKind}-${field}`}
        type={type}
        value={value}
        onChange={onChange(field)}
        required={required}
        maxLength={maxLength}
      />
    </div>
  );
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
                <PersonTextField
                  entityKind={entityKind}
                  field="firstName"
                  label="First name"
                  value={formValues.firstName}
                  onChange={onInputChange}
                />
                <PersonTextField
                  entityKind={entityKind}
                  field="lastName"
                  label="Last name"
                  value={formValues.lastName}
                  onChange={onInputChange}
                />
              </div>

              <div className="grid gap-2 md:grid-cols-2">
                <PersonTextField
                  entityKind={entityKind}
                  field="email"
                  label="Email"
                  value={formValues.email}
                  onChange={onInputChange}
                  type="email"
                />
                <PersonTextField
                  entityKind={entityKind}
                  field="phoneNumber"
                  label="Phone number"
                  value={formValues.phoneNumber}
                  onChange={onInputChange}
                />
              </div>

              <PersonTextField
                entityKind={entityKind}
                field="addressLine1"
                label="Address line 1"
                value={formValues.addressLine1}
                onChange={onInputChange}
              />

              <PersonTextField
                entityKind={entityKind}
                field="addressLine2"
                label="Address line 2 (optional)"
                value={formValues.addressLine2}
                onChange={onInputChange}
                required={false}
              />

              <div className="grid gap-2 md:grid-cols-3">
                <PersonTextField
                  entityKind={entityKind}
                  field="city"
                  label="City"
                  value={formValues.city}
                  onChange={onInputChange}
                />
                <PersonTextField
                  entityKind={entityKind}
                  field="state"
                  label="State"
                  value={formValues.state}
                  onChange={onInputChange}
                  maxLength={2}
                />
                <PersonTextField
                  entityKind={entityKind}
                  field="postalCode"
                  label="Postal code"
                  value={formValues.postalCode}
                  onChange={onInputChange}
                />
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
