import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  AssignedScheduleSection,
  type AssignedScheduleRow,
} from "@/features/people/assigned-schedule-section";
import { RequestedClientScheduleSection } from "@/features/people/requested-client-schedule-section";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { API_BASE_URL } from "@/lib/api";
import { getErrorMessage } from "@/lib/errors";
import {
  parseClientRequestedSchedule,
  parseEmployeeRequestedSchedule,
} from "@/features/people/person-details-schedule";
import { dayLabelByValue, sortDayValues } from "@/lib/schedule";
import { useScheduleWeekContext } from "@/lib/use-schedule-week-context";
import type {
  ClientAssignedScheduleResponse,
  EmployeeAssignedScheduleResponse,
  EntityKind,
  PersonEntity,
} from "@/types/people";

const getEntityLabel = (entityKind: EntityKind) =>
  entityKind === "clients" ? "Client" : "Employee";

type PersonDetailsPageProps = {
  entityKind: EntityKind;
};

export const PersonDetailsPage = ({ entityKind }: PersonDetailsPageProps) => {
  const entityLabel = getEntityLabel(entityKind);
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { currentWeekOf, nextWeekOf } = useScheduleWeekContext();
  const [person, setPerson] = useState<PersonEntity | null>(null);
  const [assignedClientCurrentSchedule, setAssignedClientCurrentSchedule] =
    useState<ClientAssignedScheduleResponse["schedule"]>([]);
  const [assignedClientNextSchedule, setAssignedClientNextSchedule] = useState<
    ClientAssignedScheduleResponse["schedule"]
  >([]);
  const [assignedEmployeeCurrentSchedule, setAssignedEmployeeCurrentSchedule] =
    useState<EmployeeAssignedScheduleResponse["schedule"]>([]);
  const [assignedEmployeeNextSchedule, setAssignedEmployeeNextSchedule] =
    useState<EmployeeAssignedScheduleResponse["schedule"]>([]);
  const [error, setError] = useState<string | null>(
    id ? null : `${entityLabel} id is missing`,
  );
  const [isLoading, setIsLoading] = useState(Boolean(id));

  useEffect(() => {
    if (!id) {
      return;
    }

    const loadPerson = async () => {
      setError(null);
      try {
        const [personResponse, assignedCurrentResponse, assignedNextResponse] =
          await Promise.all([
            fetch(`${API_BASE_URL}/api/${entityKind}/${id}`, {
              credentials: "include",
            }),
            fetch(
              `${API_BASE_URL}/api/${entityKind}/${id}/assigned-schedule?${new URLSearchParams({ weekOf: currentWeekOf }).toString()}`,
              {
                credentials: "include",
              },
            ),
            fetch(
              `${API_BASE_URL}/api/${entityKind}/${id}/assigned-schedule?${new URLSearchParams({ weekOf: nextWeekOf }).toString()}`,
              {
                credentials: "include",
              },
            ),
          ]);

        if (!personResponse.ok) {
          throw new Error(`Failed to load ${entityLabel}`);
        }
        if (!assignedCurrentResponse.ok || !assignedNextResponse.ok) {
          throw new Error(
            `Failed to load assigned ${entityLabel.toLowerCase()} schedule`,
          );
        }

        setPerson((await personResponse.json()) as PersonEntity);
        if (entityKind === "clients") {
          const currentPayload =
            (await assignedCurrentResponse.json()) as ClientAssignedScheduleResponse;
          const nextPayload =
            (await assignedNextResponse.json()) as ClientAssignedScheduleResponse;
          setAssignedClientCurrentSchedule(currentPayload.schedule);
          setAssignedClientNextSchedule(nextPayload.schedule);
        } else {
          const currentPayload =
            (await assignedCurrentResponse.json()) as EmployeeAssignedScheduleResponse;
          const nextPayload =
            (await assignedNextResponse.json()) as EmployeeAssignedScheduleResponse;
          setAssignedEmployeeCurrentSchedule(currentPayload.schedule);
          setAssignedEmployeeNextSchedule(nextPayload.schedule);
        }
      } catch (loadError) {
        setError(getErrorMessage(loadError));
      } finally {
        setIsLoading(false);
      }
    };

    void loadPerson();
  }, [currentWeekOf, entityKind, entityLabel, id, nextWeekOf]);

  const requestedEmployeeDays =
    person && entityKind === "employees"
      ? sortDayValues(parseEmployeeRequestedSchedule(person.requestedSchedule))
      : [];

  const requestedClientSchedule =
    person && entityKind === "clients"
      ? parseClientRequestedSchedule(person.requestedSchedule)
      : [];

  const toClientAssignedRows = (
    entries: ClientAssignedScheduleResponse["schedule"],
  ): AssignedScheduleRow[] =>
    entries.map((entry) => ({
      key: `${entry.dayOfWeek}-${entry.startTime}-${entry.endTime}-${entry.employeeId}`,
      dayOfWeek: entry.dayOfWeek,
      startTime: entry.startTime,
      endTime: entry.endTime,
      assigneeId: entry.employeeId,
      assigneeName: entry.employeeName,
    }));

  const toEmployeeAssignedRows = (
    entries: EmployeeAssignedScheduleResponse["schedule"],
  ): AssignedScheduleRow[] =>
    entries.map((entry) => ({
      key: `${entry.dayOfWeek}-${entry.startTime}-${entry.endTime}-${entry.clientId}`,
      dayOfWeek: entry.dayOfWeek,
      startTime: entry.startTime,
      endTime: entry.endTime,
      assigneeId: entry.clientId,
      assigneeName: entry.clientName,
    }));

  return (
    <main className="min-h-screen bg-background p-4 text-foreground">
      <div className="mx-auto grid w-full max-w-2xl gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>{entityLabel} Details</CardTitle>
            <div className="flex gap-2">
              {id ? (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => void navigate(`/${entityKind}/${id}/edit`)}
                >
                  Edit
                </Button>
              ) : null}
              <Button
                type="button"
                variant="outline"
                onClick={() => void navigate("/dashboard")}
              >
                Back to dashboard
              </Button>
            </div>
          </CardHeader>
          <CardContent className="grid gap-4">
            {isLoading ? (
              <p className="text-sm text-muted-foreground">Loading...</p>
            ) : null}
            {error ? <p className="text-sm text-destructive">{error}</p> : null}
            {person ? (
              <div className="grid gap-4">
                <div className="grid gap-3 rounded-md border p-4 md:grid-cols-[1.5fr_1fr] md:items-center">
                  <div className="grid gap-1 md:pr-4">
                    <h2 className="text-2xl font-semibold">
                      {person.firstName} {person.lastName}
                    </h2>
                    <p className="text-base text-muted-foreground">
                      {person.email}
                    </p>
                    <p className="text-base text-muted-foreground">
                      {person.phoneNumber}
                    </p>
                  </div>

                  <div className="grid gap-0.5 rounded-sm bg-muted/40 p-3 text-base md:justify-self-end md:min-w-[220px]">
                    <p>{person.addressLine1}</p>
                    {person.addressLine2?.trim() ? (
                      <p>{person.addressLine2}</p>
                    ) : null}
                    <p>
                      {person.city}, {person.state} {person.postalCode}
                    </p>
                  </div>
                </div>

                <div className="grid gap-3 rounded-md border p-4">
                  <div>
                    <h3 className="font-semibold">Requested Schedule</h3>
                  </div>

                  {entityKind === "employees" ? (
                    requestedEmployeeDays.length > 0 ? (
                      <p className="text-sm">
                        {requestedEmployeeDays
                          .map((day) => dayLabelByValue[day])
                          .join(", ")}
                      </p>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        No requested schedule set.
                      </p>
                    )
                  ) : null}

                  {entityKind === "clients" ? (
                    <RequestedClientScheduleSection
                      entries={requestedClientSchedule}
                      emptyMessage="No requested schedule set."
                    />
                  ) : null}
                </div>

                <div className="grid gap-3 rounded-md border p-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold">Assigned Schedules</h3>
                    {entityKind === "clients" && id ? (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          void navigate(`/clients/${id}/assign-schedule`)
                        }
                      >
                        Edit next week assignments
                      </Button>
                    ) : null}
                  </div>

                  {entityKind === "clients" ? (
                    <AssignedScheduleSection
                      heading={`This Week (${currentWeekOf})`}
                      assigneeLabel="Employee"
                      emptyMessage="This Week has no assigned schedule."
                      rows={toClientAssignedRows(assignedClientCurrentSchedule)}
                      onAssigneeClick={(employeeId) =>
                        void navigate(`/employees/${employeeId}`)
                      }
                    />
                  ) : null}

                  {entityKind === "clients" ? (
                    <AssignedScheduleSection
                      heading={`Next Week (${nextWeekOf})`}
                      assigneeLabel="Employee"
                      emptyMessage="Next week has no assigned schedule yet."
                      rows={toClientAssignedRows(assignedClientNextSchedule)}
                      onAssigneeClick={(employeeId) =>
                        void navigate(`/employees/${employeeId}`)
                      }
                    />
                  ) : null}

                  {entityKind === "employees" ? (
                    <AssignedScheduleSection
                      heading={`This Week (${currentWeekOf})`}
                      assigneeLabel="Client"
                      emptyMessage="This Week has no assigned schedule."
                      rows={toEmployeeAssignedRows(
                        assignedEmployeeCurrentSchedule,
                      )}
                      onAssigneeClick={(clientId) =>
                        void navigate(`/clients/${clientId}`)
                      }
                    />
                  ) : null}

                  {entityKind === "employees" ? (
                    <AssignedScheduleSection
                      heading={`Next Week (${nextWeekOf})`}
                      assigneeLabel="Client"
                      emptyMessage="Next week has no assigned schedule yet."
                      rows={toEmployeeAssignedRows(
                        assignedEmployeeNextSchedule,
                      )}
                      onAssigneeClick={(clientId) =>
                        void navigate(`/clients/${clientId}`)
                      }
                    />
                  ) : null}
                </div>
              </div>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </main>
  );
};
