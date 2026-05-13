import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { API_BASE_URL } from "@/lib/api";
import { getErrorMessage } from "@/lib/errors";
import type { EntityKind, PersonEntity } from "@/types/people";

const getEntityLabel = (entityKind: EntityKind) =>
  entityKind === "clients" ? "Client" : "Employee";

type PersonDetailsPageProps = {
  entityKind: EntityKind;
};

export const PersonDetailsPage = ({ entityKind }: PersonDetailsPageProps) => {
  const entityLabel = getEntityLabel(entityKind);
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [person, setPerson] = useState<PersonEntity | null>(null);
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
        const response = await fetch(
          `${API_BASE_URL}/api/${entityKind}/${id}`,
          {
            credentials: "include",
          },
        );
        if (!response.ok) {
          throw new Error(`Failed to load ${entityLabel}`);
        }
        setPerson((await response.json()) as PersonEntity);
      } catch (loadError) {
        setError(getErrorMessage(loadError));
      } finally {
        setIsLoading(false);
      }
    };

    void loadPerson();
  }, [entityKind, entityLabel, id]);

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
            ) : null}
          </CardContent>
        </Card>
      </div>
    </main>
  );
};
