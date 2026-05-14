import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AssignerGrid } from "@/features/people/assigner-grid";
import type { AssignmentRow } from "@/features/people/assigner-grid";
import { API_BASE_URL } from "@/lib/api";
import { getErrorMessage } from "@/lib/errors";
import { sortScheduleEntriesByDay } from "@/lib/schedule";
import { useScheduleWeekContext } from "@/lib/use-schedule-week-context";
import { parseClientRequestedSchedule } from "@/features/people/person-details-schedule";
import type {
  ClientAssignedScheduleResponse,
  EmployeesAvailableByDayResponse,
  PersonEntity,
} from "@/types/people";

const UNASSIGNED_VALUE = "__unassigned__";

const buildRowKey = (entry: {
  dayOfWeek: string;
  startTime: string;
  endTime: string;
}) => `${entry.dayOfWeek}-${entry.startTime}-${entry.endTime}`;

export const ClientScheduleAssignerPage = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const clientId = id ?? "";
  const { nextWeekOf } = useScheduleWeekContext();

  const [clientName, setClientName] = useState("");
  const [rows, setRows] = useState<AssignmentRow[]>([]);
  const [availableByDay, setAvailableByDay] = useState<
    EmployeesAvailableByDayResponse["availableEmployeesByDay"]
  >({
    monday: [],
    tuesday: [],
    wednesday: [],
    thursday: [],
    friday: [],
    saturday: [],
    sunday: [],
  });
  const [isLoading, setIsLoading] = useState(Boolean(clientId));
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(
    clientId ? null : "Client id is missing",
  );

  useEffect(() => {
    if (!clientId) {
      return;
    }

    const load = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const [clientResponse, availabilityResponse, assignedResponse] =
          await Promise.all([
            fetch(`${API_BASE_URL}/api/clients/${clientId}`, {
              credentials: "include",
            }),
            fetch(
              `${API_BASE_URL}/api/clients/${clientId}/available-employees-by-day`,
              {
                credentials: "include",
              },
            ),
            fetch(
              `${API_BASE_URL}/api/clients/${clientId}/assigned-schedule?${new URLSearchParams({ weekOf: nextWeekOf }).toString()}`,
              {
                credentials: "include",
              },
            ),
          ]);

        if (!clientResponse.ok) {
          throw new Error("Failed to load client");
        }
        if (!availabilityResponse.ok) {
          throw new Error("Failed to load employee availability");
        }
        if (!assignedResponse.ok) {
          throw new Error("Failed to load assigned schedule");
        }

        const client = (await clientResponse.json()) as PersonEntity;
        const availability =
          (await availabilityResponse.json()) as EmployeesAvailableByDayResponse;
        const assigned =
          (await assignedResponse.json()) as ClientAssignedScheduleResponse;

        const requestedSchedule = sortScheduleEntriesByDay(
          parseClientRequestedSchedule(client.requestedSchedule),
        );
        const assignedByKey = new Map(
          assigned.schedule.map((entry) => [
            buildRowKey(entry),
            entry.employeeId,
          ]),
        );

        setClientName(`${client.firstName} ${client.lastName}`);
        setAvailableByDay(availability.availableEmployeesByDay);
        setRows(
          requestedSchedule.map((entry) => ({
            key: buildRowKey(entry),
            dayOfWeek: entry.dayOfWeek,
            startTime: entry.startTime,
            endTime: entry.endTime,
            employeeId: assignedByKey.get(buildRowKey(entry)) ?? "",
          })),
        );
      } catch (loadError) {
        setError(getErrorMessage(loadError));
      } finally {
        setIsLoading(false);
      }
    };

    void load();
  }, [clientId, nextWeekOf]);

  const onAssignEmployee = (rowKey: string, employeeId: string) => {
    setRows((current) =>
      current.map((row) =>
        row.key === rowKey
          ? {
              ...row,
              employeeId,
            }
          : row,
      ),
    );
  };

  const handleSave = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!clientId) {
      return;
    }

    setIsSaving(true);
    setError(null);
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/clients/${clientId}/assigned-schedule`,
        {
          method: "PUT",
          headers: { "content-type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            weekOf: nextWeekOf,
            schedule: rows
              .filter((row) => row.employeeId)
              .map((row) => ({
                dayOfWeek: row.dayOfWeek,
                startTime: row.startTime,
                endTime: row.endTime,
                employeeId: row.employeeId,
              })),
          }),
        },
      );

      if (!response.ok) {
        const payloadError = (await response.json().catch(() => null)) as {
          message?: string;
        } | null;
        throw new Error(
          payloadError?.message ?? "Failed to save assigned schedule",
        );
      }

      void navigate(`/clients/${clientId}`);
    } catch (saveError) {
      setError(getErrorMessage(saveError));
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
              Assign Schedule{clientName ? `: ${clientName}` : ""}
            </CardTitle>
            <Button
              type="button"
              variant="outline"
              onClick={() =>
                void navigate(clientId ? `/clients/${clientId}` : "/dashboard")
              }
            >
              Back
            </Button>
          </CardHeader>
          <CardContent className="grid gap-3">
            <p className="text-sm text-muted-foreground">
              Next week (week of {nextWeekOf})
            </p>

            {isLoading ? (
              <p className="text-sm text-muted-foreground">Loading...</p>
            ) : null}
            {error ? <p className="text-sm text-destructive">{error}</p> : null}

            {!isLoading && rows.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No requested client schedule to assign.
              </p>
            ) : null}

            {rows.length > 0 ? (
              <form
                className="grid gap-3"
                onSubmit={(event) => void handleSave(event)}
              >
                <AssignerGrid
                  rows={rows}
                  availableByDay={availableByDay}
                  unassignedValue={UNASSIGNED_VALUE}
                  onAssignEmployee={onAssignEmployee}
                />

                <Button type="submit" disabled={isSaving}>
                  {isSaving ? "Saving..." : "Save Assigned Schedule"}
                </Button>
              </form>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </main>
  );
};
