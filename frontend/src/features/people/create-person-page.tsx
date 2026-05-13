import { useEffect, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { API_BASE_URL } from "@/lib/api";
import { getErrorMessage } from "@/lib/errors";
import { buildPersonPayload } from "@/lib/people";
import type {
  EntityKind,
  PersonEntity,
  PersonFormValues,
} from "@/types/people";
import { emptyPersonForm } from "@/types/people";

const getEntityLabel = (entityKind: EntityKind) =>
  entityKind === "clients" ? "Client" : "Employee";

type CreatePersonPageProps = {
  entityKind: EntityKind;
  mode?: "create" | "edit";
};

export const CreatePersonPage = ({
  entityKind,
  mode = "create",
}: CreatePersonPageProps) => {
  const entityLabel = getEntityLabel(entityKind);
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditMode = mode === "edit";
  const missingEditId = isEditMode && !id;
  const [formValues, setFormValues] =
    useState<PersonFormValues>(emptyPersonForm);
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

  const submitForm = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSaving(true);
    setError(null);

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
          headers: {
            "content-type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify(buildPersonPayload(formValues)),
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

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    void submitForm(event);
  };

  return (
    <main className="min-h-screen bg-background p-4 text-foreground">
      <div className="mx-auto grid w-full max-w-2xl gap-4">
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
            <form className="grid gap-3" onSubmit={onSubmit}>
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
